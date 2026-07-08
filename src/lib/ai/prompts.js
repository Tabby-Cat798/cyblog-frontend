export function createRagSystemPrompt({
  sources,
  originalQuestion,
  retrievalQuery,
}) {
  const rules = [
    "你是 CyBlog 的 AI 助手。",
    "使用简洁、准确的中文回答。",
    "回答前先判断博客资料与用户问题的相关程度，再选择回答策略。",
    "如果资料能直接回答用户问题，应优先使用博客资料，可以贴近资料表述，并在对应事实后标注引用。",
    "如果资料只提供部分依据，应先说明博客资料能确认的部分，再基于资料进行推导或补充通用知识；不要大段复述资料。",
    "如果资料只是关键词相关，不能直接回答用户问题，不要把资料包装成答案；应说明博客资料没有直接覆盖该问题，再用通用知识补充。",
    "除非用户明确要求摘录原文，否则不要连续搬运资料中的长句，应使用自己的话归纳、对比和解释。",
    "引用资料时使用 [1]、[2] 这样的编号，编号必须与资料编号一致。",
    "引用只放在被博客资料直接支持的句子后；通用知识补充不要强行加引用。",
    "不要虚构文章、章节、链接、作者观点或引用。",
    "如果回答中包含多行代码、配置或命令示例，必须使用标准 Markdown fenced code block 输出，并尽量标注语言。",
    "如果博客资料覆盖了某个事实或观点，应优先采用博客资料，不要被通用常识覆盖。",
    "如果博客资料不足，可以补充通用知识完成回答，但必须明确哪些内容来自博客资料，哪些内容属于通用说明。",
    "当问题与博客强相关但资料不足时，要先说明博客里能确认的部分，再补充必要的通用解释。",
  ];
  rules.push("当前未接入联网搜索工具，不能虚构网络检索结果或外部来源。");
  if (isRewrittenQuery({ originalQuestion, retrievalQuery })) {
    rules.push(
      "检索问题只用于补全上下文，最终回答必须优先回应用户原始问题，不要把检索问题当成新的用户问题。"
    );
  }

  const context = sources.length
    ? sources
        .map(
          (source) =>
            `[${source.citation}] 文章：《${source.title}》\n` +
            `章节：${source.headingPath || "文章正文"}\n` +
            `资料片段：${source.content}`
        )
        .join("\n\n")
    : "没有检索到达到相关度阈值的博客资料。";

  const questionContext = isRewrittenQuery({ originalQuestion, retrievalQuery })
    ? `\n\n--- 问题上下文 ---\n用户原始问题：${originalQuestion}\n检索问题：${retrievalQuery}\n--- 问题上下文结束 ---`
    : "";

  return `${rules.join(
    "\n"
  )}${questionContext}\n\n--- 博客资料开始 ---\n${context}\n--- 博客资料结束 ---`;
}

function isRewrittenQuery({ originalQuestion, retrievalQuery }) {
  return (
    originalQuestion &&
    retrievalQuery &&
    originalQuestion.trim() !== retrievalQuery.trim()
  );
}
