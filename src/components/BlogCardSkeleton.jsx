"use client";
import React from 'react';

const BlogCardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden h-full">
      {/* 图片占位区域 */}
      <div className="relative h-48 w-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
      
      <div className="p-4 flex flex-col h-full">
        {/* 标签占位区域 */}
        <div className="flex gap-2 mb-2">
          {[1, 2].map((_, index) => (
            <div 
              key={index} 
              className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"
            />
          ))}
        </div>
        
        {/* 标题占位区域 */}
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2 w-3/4" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4 w-2/4" />
        
        {/* 摘要占位区域 */}
        <div className="space-y-2 flex-grow">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-4/6" />
        </div>
        
        {/* 底部信息占位区域 */}
        <div className="flex justify-between items-center mt-4">
          <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default BlogCardSkeleton; 