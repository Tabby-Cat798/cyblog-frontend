import https from "node:https";

const DEFAULT_BASE_URL =
  "https://dashscope.aliyuncs.com/compatible-mode/v1";
const DEFAULT_MODEL = "text-embedding-v4";
const DEFAULT_DIMENSIONS = 1024;
const DEFAULT_BATCH_SIZE = 10;

export async function createEmbeddings(inputs) {
  if (!process.env.DASHSCOPE_API_KEY) {
    throw new Error("服务端未配置 DASHSCOPE_API_KEY");
  }

  const normalizedInputs = inputs.map((input) => String(input || "").trim());
  if (normalizedInputs.some((input) => !input)) {
    throw new Error("Embedding 输入不能为空");
  }

  const baseURL = process.env.DASHSCOPE_BASE_URL || DEFAULT_BASE_URL;
  const model = process.env.DASHSCOPE_EMBEDDING_MODEL || DEFAULT_MODEL;
  const dimensions = Number(
    process.env.DASHSCOPE_EMBEDDING_DIMENSIONS || DEFAULT_DIMENSIONS
  );
  const embeddings = [];

  for (let index = 0; index < normalizedInputs.length; index += DEFAULT_BATCH_SIZE) {
    const batch = normalizedInputs.slice(index, index + DEFAULT_BATCH_SIZE);
    const batchNumber = index / DEFAULT_BATCH_SIZE + 1;
    const totalBatches = Math.ceil(normalizedInputs.length / DEFAULT_BATCH_SIZE);
    console.info(`Embedding 批次 ${batchNumber}/${totalBatches}，输入 ${batch.length} 条`);
    const response = await requestEmbeddingBatch({
      baseURL,
      model,
      dimensions,
      inputs: batch,
      batchNumber,
    });

    embeddings.push(
      ...response.data
        .sort((left, right) => left.index - right.index)
        .map((item) => item.embedding)
    );
  }

  return {
    embeddings,
    model,
    dimensions,
  };
}

async function requestEmbeddingBatch({
  baseURL,
  model,
  dimensions,
  inputs,
  batchNumber,
}) {
  const maxAttempts = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const attemptStartedAt = Date.now();
    console.info(
      `Embedding 批次 ${batchNumber} 第 ${attempt}/${maxAttempts} 次请求开始，model=${model}，dimensions=${dimensions}`
    );
    try {
      const data = await postJson(
        `${baseURL.replace(/\/$/, "")}/embeddings`,
        {
          model,
          input: inputs,
          dimensions,
          encoding_format: "float",
        }
      );

      if (!Array.isArray(data?.data) || data.data.length !== inputs.length) {
        throw new Error("百炼 Embedding 返回数量与输入数量不一致");
      }

      console.info(
        `Embedding 批次 ${batchNumber} 第 ${attempt}/${maxAttempts} 次请求成功，耗时 ${
          Date.now() - attemptStartedAt
        }ms`
      );
      return data;
    } catch (error) {
      lastError = error;
      console.warn(
        `Embedding 批次 ${batchNumber} 第 ${attempt}/${maxAttempts} 次请求失败，耗时 ${
          Date.now() - attemptStartedAt
        }ms：${error.message}`
      );
      if (attempt < maxAttempts) {
        await delay(500 * attempt);
      }
    }
  }

  throw new Error(
    `Embedding 批次 ${batchNumber} 生成失败: ${lastError?.message || "未知错误"}`,
    { cause: lastError }
  );
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function postJson(url, body) {
  const payload = JSON.stringify(body);

  return new Promise((resolve, reject) => {
    let settled = false;
    const request = https.request(
      url,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
        timeout: 30_000,
      },
      (response) => {
        let rawData = "";

        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          rawData += chunk;
        });
        response.on("end", () => {
          if (settled) return;
          settled = true;
          clearTimeout(totalTimeout);
          let data;

          try {
            data = JSON.parse(rawData);
          } catch {
            reject(new Error("百炼 Embedding 返回了无法解析的响应"));
            return;
          }

          if (
            !response.statusCode ||
            response.statusCode < 200 ||
            response.statusCode >= 300
          ) {
            reject(
              new Error(
                data?.error?.message ||
                  `百炼 Embedding 请求失败（${response.statusCode || "unknown"}）`
              )
            );
            return;
          }

          resolve(data);
        });
      }
    );

    request.on("timeout", () => {
      request.destroy(new Error("百炼 Embedding 请求超时"));
    });
    request.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(totalTimeout);
      reject(error);
    });
    const totalTimeout = setTimeout(() => {
      request.destroy(new Error("百炼 Embedding 请求总超时"));
    }, 30_000);
    request.write(payload);
    request.end();
  });
}

export async function createQueryEmbedding(query) {
  const startedAt = Date.now();
  console.info(`开始生成 query embedding，queryLength=${String(query || "").length}`);
  const result = await createEmbeddings([query]);
  console.info(`query embedding 完成，总耗时 ${Date.now() - startedAt}ms`);
  return {
    embedding: result.embeddings[0],
    model: result.model,
    dimensions: result.dimensions,
  };
}
