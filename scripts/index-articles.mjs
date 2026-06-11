import fs from "node:fs";
import path from "node:path";

loadLocalEnv();

const { indexAllPublishedArticles } = await import(
  "../src/lib/ai/article-index.js"
);

const startedAt = Date.now();
const result = await indexAllPublishedArticles();

console.log(
  JSON.stringify(
    {
      durationMs: Date.now() - startedAt,
      ...result,
    },
    null,
    2
  )
);

if (result.failed > 0) {
  process.exitCode = 1;
}

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error(".env.local 不存在");
  }

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2];
    }
  }
}
