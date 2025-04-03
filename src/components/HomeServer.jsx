"use client";
import React, { useState } from 'react';
import BlogList from './BlogList';
import PaginationClient from './PaginationClient';

// 客户端组件，支持按类型筛选文章
export default function HomeServer({ initialData }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [filteredPosts, setFilteredPosts] = useState(initialData.posts);
  
  // 按类型筛选文章
  const filterPosts = (type) => {
    setActiveFilter(type);
    
    if (type === 'all') {
      setFilteredPosts(initialData.posts);
    } else {
      const filtered = initialData.posts.filter(post => post.type === type);
      setFilteredPosts(filtered);
    }
  };
  
  // 检查数据是否存在
  if (!initialData.posts || initialData.posts.length === 0) {
    return (
      <div className="w-full py-20 text-center">
        <p className="text-gray-600 dark:text-gray-400">暂无文章</p>
      </div>
    );
  }

  return (
    <div>
      {/* 添加筛选按钮 */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => filterPosts('all')}
          className={`px-4 py-2 rounded-md transition-colors cursor-pointer ${
            activeFilter === 'all' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          全部
        </button>
        <button
          onClick={() => filterPosts('technology')}
          className={`px-4 py-2 rounded-md transition-colors cursor-pointer ${
            activeFilter === 'technology' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          软件技术
        </button>
        <button
          onClick={() => filterPosts('daily')}
          className={`px-4 py-2 rounded-md transition-colors cursor-pointer ${
            activeFilter === 'daily' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          日常生活
        </button>
      </div>
      
      {/* 使用BlogList组件显示文章列表 */}
      <BlogList posts={filteredPosts} />
      
      {/* 使用客户端分页组件处理分页逻辑 - 只有在显示全部文章时才显示分页 */}
      {activeFilter === 'all' && initialData.pagination && initialData.pagination.pages > 1 && (
        <PaginationClient 
          initialPage={initialData.pagination.page} 
          totalPages={initialData.pagination.pages} 
          initialData={initialData}
        />
      )}
    </div>
  );
} 