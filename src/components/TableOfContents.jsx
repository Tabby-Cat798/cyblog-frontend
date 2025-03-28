"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// 提取一个公共函数，确保ID生成逻辑一致
const generateId = (text) => {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '');
};

const TableOfContents = ({ content }) => {
  const [activeId, setActiveId] = useState('');
  const router = useRouter();
  // 添加一个ref来记录最近是否为手动点击
  const recentClickRef = useRef(false);
  const clickTimeoutRef = useRef(null);

  // 解析文章内容，提取标题
  const extractHeadings = (markdown) => {
    if (!markdown) return [];
    
    // 匹配 # 开头的标题行
    const headingRegex = /^(#{1,3})\s+(.+)$/gm;
    const headings = [];
    let match;
    
    while ((match = headingRegex.exec(markdown)) !== null) {
      const level = match[1].length; // 标题级别 (# ## ###)
      const text = match[2].trim();
      // 使用与MarkdownRenderer完全一致的ID生成逻辑
      const id = generateId(text);
      
      headings.push({ level, text, id });
    }
    
    return headings;
  };

  // 监听滚动事件，更新激活的目录项
  useEffect(() => {
    const headings = extractHeadings(content);
    if (headings.length === 0) return;

    // 筛选出二级标题的ID和元素对应关系
    const headingElements = {};
    const h2Headings = headings.filter(heading => heading.level === 2);
    
    h2Headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        headingElements[id] = element;
      }
    });

    // 使用更有效的方式设置活动标题
    const observer = new IntersectionObserver(
      (entries) => {
        // 如果是最近的点击操作，跳过自动高亮
        if (recentClickRef.current) return;
        
        // 筛选所有可见的标题
        const visibleHeadings = entries
          .filter(entry => entry.isIntersecting)
          .map(entry => entry.target.id)
          // 只保留二级标题
          .filter(id => h2Headings.some(h => h.id === id));

        // 如果有可见标题，设置第一个为活动项
        if (visibleHeadings.length > 0) {
          setActiveId(visibleHeadings[0]);
        }
      },
      {
        // 调整rootMargin使标题更早被检测到
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0.1,
      }
    );

    // 只观察二级标题元素
    Object.values(headingElements).forEach(element => {
      observer.observe(element);
    });

    // 初始检查当前可见的二级标题
    if (!recentClickRef.current) {
      setTimeout(() => {
        const visibleHeading = h2Headings.find(({ id }) => {
          const element = document.getElementById(id);
          if (!element) return false;
          
          const rect = element.getBoundingClientRect();
          return rect.top >= 0 && rect.top <= window.innerHeight / 2;
        });
        
        if (visibleHeading) {
          setActiveId(visibleHeading.id);
        } else if (h2Headings.length > 0) {
          // 如果没有可见的二级标题，默认激活第一个
          setActiveId(h2Headings[0].id);
        }
      }, 100);
    }

    return () => {
      Object.values(headingElements).forEach(element => {
        observer.unobserve(element);
      });
      // 清除超时器
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, [content]);

  // 简化后的handleClickHeading函数
  const handleClickHeading = (id) => {
    // 标记为用户点击操作，避免自动高亮覆盖
    recentClickRef.current = true;
    setActiveId(id);
    
    // 直接使用window.location.hash进行导航
    window.location.hash = id;
    
    // 2秒后恢复自动高亮
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    clickTimeoutRef.current = setTimeout(() => {
      recentClickRef.current = false;
    }, 2000);
  };

  const headings = extractHeadings(content);

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav className="toc hidden lg:block">
      <div className="sticky top-8 overflow-y-auto max-h-[calc(100vh-4rem)]">
        <h4 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">目录</h4>
        <ul className="space-y-2 text-sm">
          {headings.map((heading, index) => {
            // 根据级别计算缩进
            let paddingLeft = 0;
            if (heading.level === 3) paddingLeft = 16;
            else if (heading.level > 3) paddingLeft = 24;
            
            return (
              <li 
                key={index} 
                style={{ paddingLeft: `${paddingLeft}px` }}
                className="transition-colors duration-200"
              >
                <a
                  href={`#${heading.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleClickHeading(heading.id);
                  }}
                  className={`block py-1 border-l-2 pl-2 ${
                    heading.level === 2 && activeId === heading.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-medium'
                      : heading.level === 2
                        ? 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {heading.text}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};

export default TableOfContents; 