import clientPromise from "../mongodb.js";
import { createQueryEmbedding } from "./embeddings.js";

const DEFAULT_CANDIDATE_K = 24;
const DEFAULT_FINAL_K = 10;
const DEFAULT_MAX_CHUNKS_PER_ARTICLE = 3;
const DEFAULT_MIN_SCORE = 0.35;
const DEFAULT_CACHE_TTL_MS = 10 * 60 * 1000;

export async function retrieveArticleChunks({
  query,
  articleId,
  candidateK = DEFAULT_CANDIDATE_K,
  finalK = DEFAULT_FINAL_K,
  maxChunksPerArticle = DEFAULT_MAX_CHUNKS_PER_ARTICLE,
  minDistinctArticles = 1,
  traceId = "rag",
}) {
  const startedAt = Date.now();
  console.info(`[${traceId}] 开始生成 query embedding`);
  const queryEmbedding = await createQueryEmbedding(query);
  console.info(
    `[${traceId}] query embedding 完成，model=${queryEmbedding.model}，耗时 ${
      Date.now() - startedAt
    }ms`
  );

  const chunksStartedAt = Date.now();
  console.info(`[${traceId}] 开始加载向量 chunks`);
  const chunks = await getCachedChunks(queryEmbedding.model);
  console.info(
    `[${traceId}] 向量 chunks 已就绪，共 ${chunks.length} 条，耗时 ${
      Date.now() - chunksStartedAt
    }ms`
  );

  const minScore = Number(
    process.env.RAG_MIN_SIMILARITY || DEFAULT_MIN_SCORE
  );
  const preferredArticleId = articleId ? String(articleId) : null;

  const candidates = chunks
    .map((chunk) => {
      const vectorScore = cosineSimilarity(
        queryEmbedding.embedding,
        chunk.embedding
      );
      const articleBoost =
        preferredArticleId &&
        String(chunk.articleId) === preferredArticleId
          ? 0.03
          : 0;

      return {
        ...chunk,
        vectorScore,
        score: Math.min(vectorScore + articleBoost, 1),
      };
    })
    .filter((chunk) => chunk.vectorScore >= minScore)
    .sort((left, right) => right.score - left.score)
    .slice(0, candidateK);

  const selectedChunks = selectDiverseChunks(candidates, {
    finalK,
    maxChunksPerArticle,
    minDistinctArticles,
  });

  const results = selectedChunks
    .map((chunk, index) => ({
      citation: index + 1,
      articleId: String(chunk.articleId),
      title: chunk.title,
      heading: chunk.heading,
      headingPath: chunk.headingPath,
      anchor: chunk.anchor,
      content: chunk.content,
      chunkIndex: chunk.chunkIndex,
      score: Number(chunk.score.toFixed(4)),
      url: `/posts/${chunk.articleId}${
        chunk.anchor ? `#${encodeURIComponent(chunk.anchor)}` : ""
      }`,
    }));

  console.info(
    `[${traceId}] 相似度计算完成，候选 ${candidates.length} 条，返回 ${results.length} 条，candidateK=${candidateK}，finalK=${finalK}，maxChunksPerArticle=${maxChunksPerArticle}，minDistinctArticles=${minDistinctArticles}，minScore=${minScore}，总耗时 ${
      Date.now() - startedAt
    }ms`
  );

  return results;
}

export function selectDiverseChunks(
  candidates,
  { finalK, maxChunksPerArticle, minDistinctArticles = 1 }
) {
  const safeFinalK = Math.max(0, Number(finalK) || 0);
  const safeArticleLimit = Math.max(1, Number(maxChunksPerArticle) || 1);
  const safeMinArticles = Math.max(1, Number(minDistinctArticles) || 1);
  const selected = [];
  const selectedChunkKeys = new Set();
  const articleCounts = new Map();

  if (safeMinArticles > 1) {
    const selectedArticles = new Set();

    for (const candidate of candidates) {
      if (selected.length >= safeFinalK) break;

      const articleId = String(candidate.articleId);
      if (selectedArticles.has(articleId)) continue;

      addSelectedChunk({
        candidate,
        selected,
        selectedChunkKeys,
        articleCounts,
      });
      selectedArticles.add(articleId);

      if (selectedArticles.size >= safeMinArticles) break;
    }
  }

  for (const candidate of candidates) {
    if (selected.length >= safeFinalK) break;

    const articleId = String(candidate.articleId);
    const chunkKey = getChunkKey(candidate);
    if (selectedChunkKeys.has(chunkKey)) continue;
    if ((articleCounts.get(articleId) || 0) >= safeArticleLimit) continue;

    addSelectedChunk({
      candidate,
      selected,
      selectedChunkKeys,
      articleCounts,
    });
  }

  return selected.sort((left, right) => right.score - left.score);
}

function addSelectedChunk({
  candidate,
  selected,
  selectedChunkKeys,
  articleCounts,
}) {
  const articleId = String(candidate.articleId);
  selected.push(candidate);
  selectedChunkKeys.add(getChunkKey(candidate));
  articleCounts.set(articleId, (articleCounts.get(articleId) || 0) + 1);
}

function getChunkKey(chunk) {
  return `${chunk.articleId}:${chunk.chunkIndex}`;
}

async function getCachedChunks(embeddingModel) {
  const now = Date.now();
  const ttlMs = Number(
    process.env.RAG_VECTOR_CACHE_TTL_MS || DEFAULT_CACHE_TTL_MS
  );
  const cache = globalThis._articleVectorCache;

  if (
    cache?.embeddingModel === embeddingModel &&
    cache.expiresAt > now &&
    Array.isArray(cache.chunks)
  ) {
    console.info(
      `[RAG cache] 命中向量缓存，model=${embeddingModel}，chunks=${cache.chunks.length}`
    );
    return cache.chunks;
  }

  if (
    globalThis._articleVectorCachePromise?.embeddingModel === embeddingModel
  ) {
    console.info(`[RAG cache] 复用进行中的向量加载，model=${embeddingModel}`);
    return globalThis._articleVectorCachePromise.promise;
  }

  const promise = loadChunks(embeddingModel).then((chunks) => {
    globalThis._articleVectorCache = {
      embeddingModel,
      chunks,
      expiresAt: Date.now() + ttlMs,
    };
    globalThis._articleVectorCachePromise = null;
    return chunks;
  }).catch((error) => {
    globalThis._articleVectorCachePromise = null;
    throw error;
  });

  globalThis._articleVectorCachePromise = {
    embeddingModel,
    promise,
  };

  return promise;
}

export function invalidateArticleVectorCache() {
  globalThis._articleVectorCache = null;
  globalThis._articleVectorCachePromise = null;
}

async function loadChunks(embeddingModel) {
  const startedAt = Date.now();
  console.info(`[RAG cache] 开始从 MongoDB 加载向量 chunks，model=${embeddingModel}`);
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || "blogs");

  const chunks = await db
    .collection("article_chunks")
    .find(
      { embeddingModel },
      {
        projection: {
          articleId: 1,
          title: 1,
          heading: 1,
          headingPath: 1,
          anchor: 1,
          content: 1,
          chunkIndex: 1,
          embedding: 1,
        },
      }
    )
    .toArray();

  console.info(
    `[RAG cache] MongoDB 向量 chunks 加载完成，model=${embeddingModel}，chunks=${chunks.length}，耗时 ${
      Date.now() - startedAt
    }ms`
  );

  return chunks;
}

export function cosineSimilarity(left, right) {
  if (
    !Array.isArray(left) ||
    !Array.isArray(right) ||
    left.length !== right.length ||
    left.length === 0
  ) {
    return 0;
  }

  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    dotProduct += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }

  const denominator = Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude);
  return denominator ? dotProduct / denominator : 0;
}
