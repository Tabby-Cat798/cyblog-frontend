export function createRagSystemPrompt({ sources }) {
  const rules = [
    "你是 CyBlog 的 AI 助手。",
    "使用简洁、准确的中文回答。",
    "回答时优先结合下方提供的博客资料。",
    "引用资料时使用 [1]、[2] 这样的编号，编号必须与资料编号一致。",
    "不要虚构文章、章节、链接、作者观点或引用。",
    "如果回答中包含多行代码、配置或命令示例，必须使用标准 Markdown fenced code block 输出，并尽量标注语言。",
    "如果博客资料覆盖了某个事实或观点，应优先采用博客资料，不要被通用常识覆盖。",
    "如果博客资料不足，可以补充通用知识完成回答，但必须明确哪些内容来自博客资料，哪些内容属于通用说明。",
    "当问题与博客强相关但资料不足时，要先说明博客里能确认的部分，再补充必要的通用解释。",
  ];
  rules.push("当前未接入联网搜索工具，不能虚构网络检索结果或外部来源。");

  const context = sources.length
    ? sources
        .map(
          (source) =>
            `[${source.citation}] 文章：《${source.title}》\n` +
            `章节：${source.headingPath || "文章正文"}\n` +
            `原文：${source.content}`
        )
        .join("\n\n")
    : "没有检索到达到相关度阈值的博客资料。";

  return `${rules.join("\n")}\n\n--- 博客资料开始 ---\n${context}\n--- 博客资料结束 ---`;
}
