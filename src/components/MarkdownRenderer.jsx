"use client";
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { nightOwl } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { prism } from 'react-syntax-highlighter/dist/esm/styles/prism';

import "@/styles/markdown-styles.css"; // 自定义 Markdown 样式

// 与TableOfContents组件共享同样的ID生成逻辑
const generateId = (text) => {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '');
};

const MarkdownRenderer = ({ content }) => {
  const [copiedId, setCopiedId] = useState(null);

  // 复制代码到剪贴板的函数
  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000); // 2秒后重置复制状态
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  // 自定义组件
  const components = {
    // 代码块渲染
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : "";
      const codeId = Math.random().toString(36).substr(2, 9);
      
      return !inline && match ? (
        <div className="code-block-wrapper relative group">
          {language && (
            <div className="code-language-tag absolute top-2 right-2 px-2 py-1 text-xs font-mono text-gray-400 bg-gray-800/50 rounded">
              {language}
            </div>
          )}
          <button
            onClick={() => copyToClipboard(String(children).replace(/\n$/, ""), codeId)}
            className="absolute bottom-2 right-2 p-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:ring-1 hover:ring-gray-500"
            title="复制代码"
          >
            {copiedId === codeId ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
              </svg>
            )}
          </button>
          <SyntaxHighlighter
            style={oneDark}
            language={language}
            PreTag="div"
            className="code-block"
            showLineNumbers={false}
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
    // 标题渲染
    h1: ({ node, children, ...props }) => {
      const id = generateId(children.toString());
      return <h1 id={id} {...props}>{children}</h1>;
    },
    h2: ({ node, children, ...props }) => {
      const id = generateId(children.toString());
      return <h2 id={id} {...props}>{children}</h2>;
    },
    h3: ({ node, children, ...props }) => {
      const id = generateId(children.toString());
      return <h3 id={id} {...props}>{children}</h3>;
    },
    // 增强图片渲染 - 修复嵌套问题
    img({ node, ...props }) {
      // 不再返回包装div，直接返回img元素
      return <img {...props} className="rounded-md max-w-full mx-auto" />;
    },
    // 自定义段落渲染，处理包含图片的段落
    p({ node, children, ...props }) {
      // 检查children是否包含图片
      const hasImage = React.Children.toArray(children).some(
        child => React.isValidElement(child) && child.type === 'img'
      );
      
      // 如果段落包含图片，添加额外的样式
      if (hasImage) {
        return (
          <div className="image-wrapper text-center my-6">
            <p {...props}>{children}</p>
            {/* 如果最后一个子元素是图片且有alt文本，则在段落之后添加caption */}
            {React.Children.toArray(children).map((child, index) => {
              if (React.isValidElement(child) && 
                  child.type === 'img' && 
                  child.props.alt) {
                return (
                  <div key={index} className="image-caption mt-2">
                    {child.props.alt}
                  </div>
                );
              }
              return null;
            })}
          </div>
        );
      }
      
      // 普通段落正常渲染
      return <p {...props}>{children}</p>;
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
    <div className="prose prose-sm prose-gray max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeRaw,
          rehypeSlug,
          [rehypeAutolinkHeadings, { 
            behavior: 'append',
            content: {
              type: 'element',
              tagName: 'span',
              properties: { className: ['anchor-icon'] },
              children: [{ type: 'text', value: ' #' }]
            }
          }]
        ]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
