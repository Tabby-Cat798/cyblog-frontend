import React from 'react';
import BlogList from './BlogList';
import PaginationClient from './PaginationClient';

// 服务器组件，接收从page.js中获取的初始数据
export default function HomeServer({ initialData }) {
  const { posts, pagination } = initialData;
  
  // 检查数据是否存在
  if (!posts || posts.length === 0) {
    return (
      <div className="w-full py-20 text-center">
        <p className="text-gray-600 dark:text-gray-400">暂无文章</p>
      </div>
    );
  }

  return (
    <div>
      {/* 使用BlogList组件显示文章列表 */}
      <BlogList posts={posts} />
      
      {/* 使用客户端分页组件处理分页逻辑 */}
      {pagination && pagination.pages > 1 && (
        <PaginationClient 
          initialPage={pagination.page} 
          totalPages={pagination.pages} 
          initialData={initialData}
        />
      )}
    </div>
  );
} 