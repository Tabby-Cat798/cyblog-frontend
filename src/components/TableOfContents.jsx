"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

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

const TableOfContents = ({ content }) => {
  const [activeId, setActiveId] = useState('');
  const router = useRouter();
  // 添加一个ref来记录最近是否为手动点击
  const recentClickRef = useRef(false);
  const clickTimeoutRef = useRef(null);

  // 解析文章内容，提取标题
  const extractHeadings = (markdown) => {
    if (!markdown) return [];
    
    // 匹配 # 开头的标题行，支持h1-h6所有级别
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const headings = [];
    let match;
    
    while ((match = headingRegex.exec(markdown)) !== null) {
      const level = match[1].length; // 标题级别 (# ## ### #### ##### ######)
      const text = match[2].trim();
      // 使用与MarkdownRenderer完全一致的ID生成逻辑
      const id = generateId(text);
      
      headings.push({ level, text, id });
    }
    
    return headings;
  };

  // 监听内容渲染完成
  useEffect(() => {
    const checkContentReady = () => {
      const headings = extractHeadings(content);
      if (headings.length === 0) return;

      // 尝试找到第一个标题元素
      const firstHeading = document.getElementById(headings[0].id);
      
      if (firstHeading) {
        initializeTableOfContents(headings);
      } else {
        setTimeout(checkContentReady, 100);
      }
    };

    checkContentReady();
  }, [content]);

  // 初始化目录
  const initializeTableOfContents = (headings) => {
    // 筛选出所有标题的ID和元素对应关系（不只是二级标题）
    const headingElements = {};
    
    headings.forEach(({ id, level }) => {
      const element = document.getElementById(id);
      if (element) {
        headingElements[id] = element;
      }
    });

    // 使用 Intersection Observer 追踪阅读位置
    const observer = new IntersectionObserver(
      (entries) => {
        // 如果是最近的点击操作，跳过自动高亮
        if (recentClickRef.current) return;
        
        // 筛选所有可见的标题
        const visibleHeadings = entries
          .filter(entry => entry.isIntersecting)
          .map(entry => ({
            id: entry.target.id,
            // 计算元素在视口中的位置，越接近顶部的元素优先级越高
            position: Math.abs(entry.boundingClientRect.top)
          }))
          .sort((a, b) => a.position - b.position); // 按接近顶部的程度排序

        // 如果有可见标题，设置第一个为活动项
        if (visibleHeadings.length > 0) {
          setActiveId(visibleHeadings[0].id);
          // 用户滚动时不更新URL，只更新高亮
        }
      },
      {
        // 调整观察区域，提前检测即将进入视口的标题
        rootMargin: '-80px 0px -70% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1], // 增加多个阈值以提高精度
      }
    );

    // 观察所有标题元素
    Object.values(headingElements).forEach(element => {
      observer.observe(element);
    });

    // 初始检查当前可见的标题
    if (!recentClickRef.current) {
      setTimeout(() => {
        // 获取所有可见的标题元素
        const visibleHeadings = headings
          .map(({ id }) => {
            const element = document.getElementById(id);
            if (!element) return null;
            
            const rect = element.getBoundingClientRect();
            // 判断元素是否在视口中
            const isVisible = rect.top >= 0 && rect.top <= window.innerHeight / 2;
            
            return isVisible ? { id, position: rect.top } : null;
          })
          .filter(Boolean) // 过滤掉不可见的标题
          .sort((a, b) => a.position - b.position); // 按接近顶部的程度排序
        
        if (visibleHeadings.length > 0) {
          setActiveId(visibleHeadings[0].id);
        } else if (headings.length > 0) {
          // 如果没有可见的标题，默认激活第一个
          setActiveId(headings[0].id);
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
  };

  // 改进点击标题时的导航方法
  const handleClickHeading = (id) => {
    // 标记为用户点击操作，避免自动高亮覆盖
    recentClickRef.current = true;
    setActiveId(id);
    
    // 更新URL
    window.location.hash = id;
    
    // 尝试找到对应的标题元素
    const element = document.getElementById(id);
    if (element) {
      // 考虑导航栏高度，设置偏移量
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      // 使用平滑滚动
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    } else {
      // 1. 数字开头的ID可能有问题，尝试去掉数字
      const withoutNumber = id.replace(/^\d+-/, '');
      const elementWithoutNumber = document.getElementById(withoutNumber);
      
      if (elementWithoutNumber) {
        const headerOffset = 100;
        const elementPosition = elementWithoutNumber.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
        return;
      }
      
      // 2. 最后使用传统的 hash 导航作为备用
      window.location.hash = id;
    }
    
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

  // 创建一个状态用于移动端目录的显示/隐藏
  const [showMobileToc, setShowMobileToc] = useState(false);

  return (
    <>
      {/* 桌面端目录 */}
      <nav className="toc hidden lg:block">
        <div className="sticky top-8 flex flex-col">
          <h4 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 py-1 z-10">目录</h4>
          <div className="overflow-y-auto max-h-[calc(100vh-8rem)]">
            <ul className="space-y-2 text-sm">
              {headings.map((heading, index) => {
                // 根据级别计算缩进
                let paddingLeft = 0;
                if (heading.level === 2) paddingLeft = 8;
                else if (heading.level === 3) paddingLeft = 16;
                else if (heading.level === 4) paddingLeft = 24;
                else if (heading.level === 5) paddingLeft = 32;
                else if (heading.level === 6) paddingLeft = 40;
                
                // 判断当前项是否为活动项
                const isActive = activeId === heading.id;
                
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
                        isActive
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-medium'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                    >
                      {heading.text}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </nav>

      {/* 移动端目录按钮和弹出层 */}
      <div className="lg:hidden fixed bottom-20 right-4 z-30">
        <button 
          onClick={() => setShowMobileToc(!showMobileToc)}
          className="bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
          aria-label="显示目录"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>
      </div>

      {/* 移动端目录弹出层 */}
      {showMobileToc && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-end">
          <div className="bg-white dark:bg-gray-900 w-3/4 h-full overflow-y-auto p-4 mt-16">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">目录</h4>
              <button 
                onClick={() => setShowMobileToc(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ul className="space-y-3 text-sm">
              {headings.map((heading, index) => {
                // 根据级别计算缩进
                let paddingLeft = 0;
                if (heading.level === 2) paddingLeft = 8;
                else if (heading.level === 3) paddingLeft = 16;
                else if (heading.level === 4) paddingLeft = 24;
                else if (heading.level === 5) paddingLeft = 32;
                else if (heading.level === 6) paddingLeft = 40;
                
                // 判断当前项是否为活动项
                const isActive = activeId === heading.id;
                
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
                        setShowMobileToc(false); // 点击后关闭移动端目录
                      }}
                      className={`block py-2 border-l-2 pl-2 ${
                        isActive
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-medium'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                    >
                      {heading.text}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

export default TableOfContents; 