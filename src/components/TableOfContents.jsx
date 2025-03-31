"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// 优化 ID 生成逻辑，既能处理特殊函数名，又能保留序号
const generateId = (text) => {
  if (!text) return '';
  
  console.log('开始处理标题:', text);
  
  // 步骤1: 特殊处理带序号的标题
  // 分析原始文本中是否有序号模式（如 "1. 盒模型"）
  const hasNumberPrefix = /^(\d+)[\.\s]+(.+)$/.test(text);
  
  // 步骤2: 转为小写，这与 rehype-slug 的行为一致
  let processed = text.toLowerCase();
  console.log('转小写后:', processed);
  
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
  
  console.log('最终生成ID:', processed);
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
    
    // 匹配 # 开头的标题行
    const headingRegex = /^(#{1,3})\s+(.+)$/gm;
    const headings = [];
    let match;
    
    while ((match = headingRegex.exec(markdown)) !== null) {
      const level = match[1].length; // 标题级别 (# ## ###)
      const text = match[2].trim();
      // 使用与MarkdownRenderer完全一致的ID生成逻辑
      const id = generateId(text);
      
      // 添加调试日志
      console.log(`标题文本: "${text}" -> 生成ID: "${id}"`);
      
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
        console.log('内容渲染完成，初始化目录');
        
        // 如果URL没有锚点，重定向到第一个标题
        if (!window.location.hash && headings.length > 0) {
          console.log('URL没有锚点，重定向到第一个标题:', headings[0].id);
          // 使用 replaceState 而不是直接修改 hash，避免添加浏览历史记录
          const newUrl = new URL(window.location);
          newUrl.hash = headings[0].id;
          window.history.replaceState({}, '', newUrl);
          
          // 将第一个标题设为活动项
          setActiveId(headings[0].id);
          
          // 平滑滚动到第一个标题位置
          setTimeout(() => {
            const headerOffset = 100;
            const elementPosition = firstHeading.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          }, 100);
        }
        
        initializeTableOfContents(headings);
      } else {
        console.log('等待内容渲染完成...');
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
        console.log(`找到标题元素: ${id} (级别: ${level})`);
      } else {
        console.log(`未找到标题元素: ${id} (级别: ${level})`);
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
      console.log(`找到目标元素: #${id}`);
      
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
      console.log(`找不到ID为 "${id}" 的元素，尝试备用方案`);
      
      // 打印出页面上所有标题元素的ID，帮助调试
      console.log('页面上所有标题元素的ID:');
      document.querySelectorAll('h1, h2, h3').forEach(el => {
        console.log(`- ${el.id}`);
      });
      
      // 尝试一些常见的特殊情况处理
      // 1. 数字开头的ID可能有问题，尝试去掉数字
      const withoutNumber = id.replace(/^\d+-/, '');
      const elementWithoutNumber = document.getElementById(withoutNumber);
      
      if (elementWithoutNumber) {
        console.log(`找到替代元素: #${withoutNumber}`);
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
      console.log(`使用hash导航作为最终备用方案`);
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

  return (
    <nav className="toc hidden lg:block">
      <div className="sticky top-8 flex flex-col">
        <h4 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 py-1 z-10">目录</h4>
        <div className="overflow-y-auto max-h-[calc(100vh-8rem)]">
          <ul className="space-y-2 text-sm">
            {headings.map((heading, index) => {
              // 根据级别计算缩进
              let paddingLeft = 0;
              if (heading.level === 3) paddingLeft = 16;
              else if (heading.level > 3) paddingLeft = 24;
              
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
  );
};

export default TableOfContents; 