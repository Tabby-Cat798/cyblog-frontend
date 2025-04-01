"use client";
import React, { useState } from 'react';
import BlogList from './BlogList';

// 客户端分页组件，处理分页交互和数据获取
export default function PaginationClient({ initialPage = 1, totalPages = 1, initialData }) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [posts, setPosts] = useState(initialData?.posts || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 处理页面变化
  const handlePageChange = async (newPage) => {
    if (newPage <= 0 || newPage > totalPages || newPage === currentPage) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/posts?page=${newPage}&limit=9`);
      if (!response.ok) {
        throw new Error('获取文章失败');
      }
      const data = await response.json();
      setPosts(data.posts || []);
      setCurrentPage(newPage);
      // 滚动到页面顶部
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('分页获取文章失败:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 加载状态
  if (isLoading) {
    return (
      <div className="w-full py-10 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="w-full py-10 text-center">
        <p className="text-red-500">{error}</p>
        <button 
          onClick={() => handlePageChange(currentPage)} 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <>
      {/* 当页面切换时，重新渲染文章列表 */}
      {currentPage !== initialPage && <BlogList posts={posts} />}
      
      {/* 分页控件 */}
      <div className="flex justify-center mt-10 space-x-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
        >
          上一页
        </button>
        
        <div className="flex space-x-1">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => handlePageChange(i + 1)}
              className={`w-10 h-10 rounded-lg ${
                currentPage === i + 1
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
        >
          下一页
        </button>
      </div>
    </>
  );
} 