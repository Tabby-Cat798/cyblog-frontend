import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

import "@/styles/markdown-styles.css";

// 优化 ID 生成逻辑，与客户端组件保持一致
const generateId = (text) => {
  if (!text) return '';
  
  // 步骤1: 特殊处理带序号的标题
  // 分析原始文本中是否有序号模式（如 "1. 盒模型"）
  const hasNumberPrefix = /^(\d+)[\.\s]+(.+)$/.test(text);
  
  // 步骤2: 转为小写，这与 rehype-slug 的行为一致
  let processed = text.toLowerCase();
  
  // 步骤3: 根据不同情况处理
  if (hasNumberPrefix) {
    // 对带序号标题进行特殊处理
    processed = processed.replace(/^(\d+)[\.\s]+(.+)$/, (_, num, rest) => {
      // 保留数字前缀并将空格替换为连字符
      return `${num}-${rest.replace(/[^\p{L}\p{N}]+/gu, '-')}`;
    });
    // 清理多余的连字符
    processed = processed.replace(/-+/g, '-').replace(/^-|-$/g, '');
  } else {
    // 对其他标题（如函数名）进行标准 rehype-slug 处理
    processed = processed.replace(/[^\p{L}\p{N}]+/gu, '');
  }
  
  return processed;
};

const MarkdownRendererServer = ({ content }) => {
  // 自定义组件
  const components = {
    // 代码块渲染 - 服务端渲染版本
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : "";
      
      return !inline && match ? (
        <div className="code-block-wrapper relative group" data-code={String(children).replace(/\n$/, "")}>
          {language && (
            <div className="code-language-tag absolute top-2 right-2 px-2 py-1 text-xs font-mono text-gray-400 bg-gray-800/50 rounded">
              {language}
            </div>
          )}
          {/* 复制按钮占位符，将在客户端水合 */}
          <button
            className="copy-btn absolute bottom-2 right-2 p-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:ring-1 hover:ring-gray-500"
            title="复制代码"
            data-copy-target="true"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
              <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
            </svg>
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
    h4: ({ node, children, ...props }) => {
      const id = generateId(children.toString());
      return <h4 id={id} {...props}>{children}</h4>;
    },
    h5: ({ node, children, ...props }) => {
      const id = generateId(children.toString());
      return <h5 id={id} {...props}>{children}</h5>;
    },
    h6: ({ node, children, ...props }) => {
      const id = generateId(children.toString());
      return <h6 id={id} {...props}>{children}</h6>;
    },
    // 增强图片渲染
    img({ node, ...props }) {
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
    },
    // 自定义列表渲染
    ul({ node, ordered, ...props }) {
      return <ul className="markdown-list" {...props} />;
    },
    ol({ node, ordered, ...props }) {
      return <ol className="markdown-list" {...props} />;
    },
    li({ node, ordered, ...props }) {
      return <li className="markdown-list-item" {...props} />;
    }
  };

  return (
    <div className="prose prose-sm prose-gray max-w-none dark:prose-invert markdown-container">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeRaw,
          rehypeSlug,
        ]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRendererServer; 