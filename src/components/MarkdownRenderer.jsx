"use client";
import React, { useState, useEffect } from "react";
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

// 优化 ID 生成逻辑，既能处理特殊函数名，又能保留序号
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

const MarkdownRenderer = ({ content }) => {
  const [visibleContent, setVisibleContent] = useState('');
  const [isRendering, setIsRendering] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  // 渐进式内容加载效果
  useEffect(() => {
    // 如果内容为空，直接返回
    if (!content || content.length === 0) {
      setIsRendering(false);
      return;
    }
    
    // 分块加载内容，每块约2000字符
    const chunkSize = 2000;
    const contentLength = content.length;
    let currentLength = 0;
    
    // 设置渲染标志
    setIsRendering(true);
    
    // 创建一个递归函数来逐步加载内容
    const loadNextChunk = () => {
      if (currentLength >= contentLength) {
        setIsRendering(false);
        return;
      }
      
      // 计算下一个块的大小
      let nextChunk = Math.min(currentLength + chunkSize, contentLength);
      
      // 尝试找到段落边界，避免在段落中间断开
      if (nextChunk < contentLength) {
        const paragraphEnd = content.indexOf('\n\n', nextChunk - 100);
        if (paragraphEnd !== -1 && paragraphEnd < nextChunk + 100) {
          nextChunk = paragraphEnd + 2;
        }
      }
      
      // 更新可见内容
      setVisibleContent(content.substring(0, nextChunk));
      currentLength = nextChunk;
      
      // 如果还有内容需要加载，则安排下一次更新
      if (currentLength < contentLength) {
        setTimeout(loadNextChunk, 50);
      } else {
        setIsRendering(false);
      }
    };
    
    // 开始加载第一块
    loadNextChunk();
  }, [content]);

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
    <div className="prose prose-sm prose-gray max-w-none dark:prose-invert markdown-container relative">
      {/* 渲染进度指示器 */}
      {isRendering && (
        <div className="fixed top-4 right-4 z-50 bg-blue-500 text-white px-3 py-1 rounded-full text-sm animate-pulse">
          渲染中...
        </div>
      )}
      
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeRaw,
          rehypeSlug,
        ]}
        components={components}
      >
        {visibleContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
