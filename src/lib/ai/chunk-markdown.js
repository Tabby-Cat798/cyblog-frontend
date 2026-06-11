import { createHash } from "node:crypto";

const DEFAULT_MAX_CHARS = 800;
const DEFAULT_OVERLAP_CHARS = 120;

export function chunkMarkdown(
  markdown,
  { maxChars = DEFAULT_MAX_CHARS, overlapChars = DEFAULT_OVERLAP_CHARS } = {}
) {
  const sections = parseSections(normalizeMarkdown(markdown));
  const chunks = [];

  for (const section of sections) {
    const contentParts = splitSectionContent(section.content, maxChars);
    let current = "";

    for (const part of contentParts) {
      if (!current) {
        current = part;
        continue;
      }

      if (`${current}\n\n${part}`.length <= maxChars) {
        current = `${current}\n\n${part}`;
        continue;
      }

      chunks.push(createChunk(section, current, chunks.length));
      current = isCodeBlock(part)
        ? part
        : `${getOverlap(current, overlapChars)}${part}`.trim();
    }

    if (current.trim()) {
      chunks.push(createChunk(section, current, chunks.length));
    }
  }

  return chunks;
}

export function createArticleSourceHash(article) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        title: article.title || "",
        summary: article.summary || "",
        tags: article.tags || [],
        content: article.content || "",
        status: article.status || "",
      })
    )
    .digest("hex");
}

export function createHeadingAnchor(heading) {
  if (!heading) return "";

  const normalized = heading.toLowerCase();
  const numberedHeading = normalized.match(/^(\d+)[.\s]+(.+)$/u);

  if (numberedHeading) {
    return `${numberedHeading[1]}-${numberedHeading[2]
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")}`;
  }

  return normalized.replace(/[^\p{L}\p{N}]+/gu, "");
}

function normalizeMarkdown(markdown) {
  return String(markdown || "")
    .replace(/\r\n?/g, "\n")
    .trim();
}

function parseSections(markdown) {
  if (!markdown) return [];

  const lines = markdown.split("\n");
  const headingStack = [];
  const sections = [];
  let current = {
    heading: "",
    headingPath: [],
    contentLines: [],
  };
  let inCodeFence = false;

  const flush = () => {
    const content = current.contentLines.join("\n").trim();
    if (content) {
      sections.push({ ...current, content });
    }
  };

  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inCodeFence = !inCodeFence;
      current.contentLines.push(line);
      continue;
    }

    const headingMatch = !inCodeFence && line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);

    if (!headingMatch) {
      current.contentLines.push(line);
      continue;
    }

    flush();

    const level = headingMatch[1].length;
    const heading = headingMatch[2].trim();
    headingStack[level - 1] = heading;
    headingStack.length = level;
    current = {
      heading,
      headingPath: headingStack.filter(Boolean),
      contentLines: [],
    };
  }

  flush();
  return sections;
}

function splitSectionContent(content, maxChars) {
  const parts = [];
  let textBuffer = [];
  let codeBuffer = [];
  let inCodeFence = false;

  const flushText = () => {
    const text = textBuffer.join("\n").trim();
    if (text) parts.push(...splitLongText(text, maxChars));
    textBuffer = [];
  };

  for (const line of content.split("\n")) {
    if (/^\s*```/.test(line)) {
      if (!inCodeFence) {
        flushText();
        codeBuffer = [line];
        inCodeFence = true;
      } else {
        codeBuffer.push(line);
        parts.push(codeBuffer.join("\n").trim());
        codeBuffer = [];
        inCodeFence = false;
      }
      continue;
    }

    if (inCodeFence) {
      codeBuffer.push(line);
    } else if (!line.trim()) {
      flushText();
    } else {
      textBuffer.push(line);
    }
  }

  if (codeBuffer.length) parts.push(codeBuffer.join("\n").trim());
  flushText();
  return parts.filter(Boolean);
}

function splitLongText(text, maxChars) {
  if (text.length <= maxChars) return [text];

  const sentences = text.split(/(?<=[。！？.!?；;])\s*/u).filter(Boolean);
  const parts = [];
  let current = "";

  for (const sentence of sentences) {
    if (!current || `${current}${sentence}`.length <= maxChars) {
      current += sentence;
    } else {
      parts.push(current.trim());
      current = sentence;
    }
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

function createChunk(section, content, chunkIndex) {
  const headingPath = section.headingPath.join(" > ");
  const normalizedContent = content.trim();

  return {
    chunkIndex,
    heading: section.heading,
    headingPath,
    anchor: createHeadingAnchor(section.heading),
    content: normalizedContent,
    charCount: normalizedContent.length,
    contentHash: createHash("sha256").update(normalizedContent).digest("hex"),
  };
}

function getOverlap(text, overlapChars) {
  if (!overlapChars || text.length <= overlapChars) return "";
  return `${text.slice(-overlapChars).trim()}\n\n`;
}

function isCodeBlock(text) {
  return text.startsWith("```");
}
