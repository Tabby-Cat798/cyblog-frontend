"use client";
import React, { useEffect, useRef, useState } from 'react';
import { init } from '@waline/client';
// 样式已在globals.css中通过CDN导入

export default function WalineComments({ articleId, articleTitle, articlePath }) {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const walineServerUrl = process.env.NEXT_PUBLIC_WALINE_SERVER;
    
    if (!walineServerUrl) {
      setError('Waline服务器URL未配置');
      return;
    }
    
    // 包装在try-catch中，防止任何初始化错误
    const initWaline = () => {
      try {
        // 使用最简化的配置
        init({
          el: containerRef.current,
          serverURL: walineServerUrl,
          path: window.location.pathname
        });
      } catch (err) {
        console.error('Waline初始化失败:', err);
        setError(`初始化失败: ${err.message}`);
      }
    };
    
    // 延迟加载以确保DOM完全就绪
    const timer = setTimeout(initWaline, 100);
    
    return () => {
      clearTimeout(timer);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  if (error) {
    return (
      <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-2xl font-bold mb-8">评论</h3>
        <div className="p-4 bg-red-50 text-red-500 rounded-lg">
          评论系统加载失败: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
      <h3 className="text-2xl font-bold mb-8">评论</h3>
      <div ref={containerRef} className="waline-container" />
    </div>
  );
}