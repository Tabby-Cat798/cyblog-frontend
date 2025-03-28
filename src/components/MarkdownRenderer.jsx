"use client";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import "@/styles/markdown-styles.css"; // 自定义 Markdown 样式

const MarkdownRenderer = ({ content }) => {
  // 自定义组件
  const components = {
    // 代码块渲染
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : "";
      
      return !inline && match ? (
        <div className="code-block-wrapper">
          {language && (
            <div className="code-language-tag">
              {language}
            </div>
          )}
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={language}
            PreTag="div"
            className="code-block"
            showLineNumbers={true}
            wrapLines={true}
            {...props}
          >
            {String(children).replace(/\n$/, "")}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code className={`inline-code ${className || ""}`} {...props}>
          {children}
        </code>
      );
    },
    // 增强图片渲染
    img({ node, ...props }) {
      return (
        <div className="image-container">
          <img {...props} className="rounded-md max-w-full" />
          {props.alt && <div className="image-caption">{props.alt}</div>}
        </div>
      );
    },
    // 增强表格渲染
    table({ node, ...props }) {
      return (
        <div className="table-container">
          <table {...props} className="markdown-table" />
        </div>
      );
    },
    // 增强链接渲染
    a({ node, ...props }) {
      return (
        <a 
          {...props} 
          target="_blank" 
          rel="noopener noreferrer"
          className="markdown-link"
        />
      );
    }
  };

  return (
    <div className="prose prose-lg prose-gray max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeRaw,
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: 'wrap' }]
        ]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
