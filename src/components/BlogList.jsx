"use client";
import React, { useState, useEffect } from 'react';
import BlogCard from './BlogCard';

const BlogList = ({ posts = [] }) => {
  // 加载状态
  const [isLoading, setIsLoading] = useState(true);
  // 交错渐入的可见文章
  const [visiblePosts, setVisiblePosts] = useState([]);
  
  // 处理初始加载和交错渐入效果
  useEffect(() => {
    if (posts.length === 0) {
      // 如果没有文章，仍然显示为加载中一段时间，然后显示"暂无文章"
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
    
    // 简短的加载延迟
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
      
      // 清空当前可见博文
      setVisiblePosts([]);
      
      // 逐个添加博文，实现交错效果
      posts.forEach((post, index) => {
        setTimeout(() => {
          setVisiblePosts(prev => [...prev, post]);
        }, 100 * index); // 每隔100ms添加一个博文
      });
    }, 0); // 减少加载延迟
    
    return () => clearTimeout(loadingTimer);
  }, [posts]);
  
  // 显示简单的加载中效果
  if (isLoading) {
    return (
      <div className="w-full py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
      </div>
    );
  }
  
  // 没有文章时显示暂无文章
  if (posts.length === 0) {
    return (
      <div className="w-full py-20 text-center">
        <h3 className="text-xl text-gray-600 dark:text-gray-400">暂无文章</h3>
      </div>
    );
  }
  
  // 有文章且不在加载中，显示交错渐入的文章列表
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {visiblePosts.map((post) => (
        <BlogCard key={post._id} post={post} />
      ))}
    </div>
  );
};

export default BlogList; 