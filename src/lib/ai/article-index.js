import { randomUUID } from "node:crypto";
import { ObjectId } from "mongodb";
import clientPromise from "../mongodb.js";
import {
  chunkMarkdown,
  createArticleSourceHash,
} from "./chunk-markdown.js";
import { createEmbeddings } from "./embeddings.js";
import { invalidateArticleVectorCache } from "./retrieval.js";

const COLLECTION_NAME = "article_chunks";

export async function indexArticle(articleOrId) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || "blogs");
  const article =
    typeof articleOrId === "object"
      ? articleOrId
      : await findArticle(db, articleOrId);

  if (!article) {
    throw new Error("文章不存在");
  }

  const articleId = article._id;
  const sourceHash = createArticleSourceHash(article);
  const collection = db.collection(COLLECTION_NAME);
  const existing = await collection.findOne(
    { articleId, sourceHash },
    { sort: { indexedAt: -1 }, projection: { _id: 1 } }
  );

  if (existing) {
    return {
      articleId: articleId.toString(),
      title: article.title,
      status: "skipped",
      reason: "unchanged",
    };
  }

  if (article.status !== "published") {
    await collection.deleteMany({ articleId });
    return {
      articleId: articleId.toString(),
      title: article.title,
      status: "removed",
      chunks: 0,
    };
  }

  const chunks = chunkMarkdown(article.content);
  if (!chunks.length) {
    throw new Error(`文章“${article.title}”没有可索引内容`);
  }

  console.info(`开始索引文章“${article.title}”，共 ${chunks.length} 个 Chunk`);
  const embeddingInputs = chunks.map((chunk) =>
    [article.title, chunk.headingPath, chunk.content].filter(Boolean).join("\n")
  );
  const embeddingResult = await createEmbeddings(embeddingInputs);
  const indexVersion = randomUUID();
  const indexedAt = new Date();
  const documents = chunks.map((chunk, index) => ({
    articleId,
    title: article.title,
    summary: article.summary || "",
    tags: article.tags || [],
    heading: chunk.heading,
    headingPath: chunk.headingPath,
    anchor: chunk.anchor,
    content: chunk.content,
    chunkIndex: chunk.chunkIndex,
    charCount: chunk.charCount,
    contentHash: chunk.contentHash,
    sourceHash,
    indexVersion,
    embedding: embeddingResult.embeddings[index],
    embeddingModel: embeddingResult.model,
    embeddingDimensions: embeddingResult.dimensions,
    articleCreatedAt: article.createdAt || null,
    articleUpdatedAt: article.updatedAt || null,
    indexedAt,
  }));

  try {
    await insertInBatches(collection, documents);
    await collection.deleteMany({
      articleId,
      indexVersion: { $ne: indexVersion },
    });
    invalidateArticleVectorCache();
  } catch (error) {
    await collection.deleteMany({ articleId, indexVersion }).catch(() => {});
    throw error;
  }
  console.info(`文章“${article.title}”索引完成`);

  return {
    articleId: articleId.toString(),
    title: article.title,
    status: "indexed",
    chunks: documents.length,
    embeddingModel: embeddingResult.model,
    embeddingDimensions: embeddingResult.dimensions,
  };
}

export async function indexAllPublishedArticles() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || "blogs");
  const articles = await db
    .collection("articles")
    .find({ status: "published" })
    .sort({ createdAt: 1 })
    .toArray();
  const results = [];

  for (const article of articles) {
    try {
      results.push(await indexArticle(article));
    } catch (error) {
      results.push({
        articleId: article._id.toString(),
        title: article.title,
        status: "failed",
        error: error.message,
      });
    }
  }

  return summarizeResults(results);
}

async function findArticle(db, articleId) {
  if (!ObjectId.isValid(articleId)) {
    throw new Error("无效的文章 ID");
  }

  return db.collection("articles").findOne({
    _id: new ObjectId(articleId),
  });
}

function summarizeResults(results) {
  return {
    total: results.length,
    indexed: results.filter((item) => item.status === "indexed").length,
    skipped: results.filter((item) => item.status === "skipped").length,
    failed: results.filter((item) => item.status === "failed").length,
    chunks: results.reduce((sum, item) => sum + (item.chunks || 0), 0),
    results,
  };
}

async function insertInBatches(collection, documents) {
  const batchSize = 5;
  const totalBatches = Math.ceil(documents.length / batchSize);

  for (let index = 0; index < documents.length; index += batchSize) {
    const batch = documents.slice(index, index + batchSize);
    const batchNumber = index / batchSize + 1;
    console.info(`MongoDB 写入批次 ${batchNumber}/${totalBatches}，${batch.length} 条`);
    await collection.insertMany(batch, { ordered: true });
  }
}
