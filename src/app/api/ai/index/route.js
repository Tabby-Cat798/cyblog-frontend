import { indexAllPublishedArticles, indexArticle } from "@/lib/ai/article-index";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const result = body.articleId
      ? await indexArticle(body.articleId)
      : await indexAllPublishedArticles();

    return Response.json(result);
  } catch (error) {
    console.error("文章索引失败:", error);
    return Response.json(
      { error: error.message || "文章索引失败" },
      { status: 500 }
    );
  }
}

function isAuthorized(request) {
  const token = process.env.REVALIDATE_TOKEN;
  const authorization = request.headers.get("authorization");

  return Boolean(token && authorization === `Bearer ${token}`);
}
