"use client";
import React from 'react';

const PostDetailSkeleton = () => {
  return (
    <div className="max-w-5xl mx-auto animate-pulse">
      {/* 文章头部骨架 */}
      <header className="flex flex-col items-center text-center mb-8">
        {/* 标题骨架 */}
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
        
        {/* 发布信息骨架 */}
        <div className="flex justify-center items-center mb-6">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 mr-4"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </div>
        
        {/* 标签骨架 */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {[1, 2, 3].map((_, index) => (
            <div 
              key={index}
              className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-16"
            ></div>
          ))}
        </div>
      </header>
      
      {/* 文章主体与目录骨架 */}
      <div className="flex flex-col lg:flex-row gap-10">
        {/* 目录侧边栏骨架 */}
        <div className="lg:w-64 h-[400px] bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          {[1, 2, 3, 4, 5].map((_, index) => (
            <div 
              key={index}
              className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-3"
              style={{ width: `${Math.random() * 40 + 60}%` }}
            ></div>
          ))}
        </div>
        
        {/* 文章内容骨架 */}
        <div className="flex-1">
          {/* 段落骨架 */}
          {[1, 2, 3, 4, 5, 6, 7, 8].map((_, index) => (
            <React.Fragment key={index}>
              {/* 段落标题 */}
              {index % 2 === 0 && (
                <div 
                  className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4 mt-8"
                ></div>
              )}
              
              {/* 段落文本 */}
              <div className="space-y-3 mb-6">
                <div 
                  className="h-4 bg-gray-200 dark:bg-gray-700 rounded"
                  style={{ width: '100%' }}
                ></div>
                <div 
                  className="h-4 bg-gray-200 dark:bg-gray-700 rounded"
                  style={{ width: `${Math.random() * 20 + 80}%` }}
                ></div>
                <div 
                  className="h-4 bg-gray-200 dark:bg-gray-700 rounded"
                  style={{ width: `${Math.random() * 30 + 70}%` }}
                ></div>
                <div 
                  className="h-4 bg-gray-200 dark:bg-gray-700 rounded"
                  style={{ width: `${Math.random() * 40 + 60}%` }}
                ></div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
      
      {/* 评论区骨架 */}
      <section className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-8"></div>
        
        {/* 评论列表骨架 */}
        <div className="space-y-6 mb-10">
          {[1, 2].map((_, index) => (
            <div key={index} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* 评论表单骨架 */}
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24 ml-auto"></div>
        </div>
      </section>
    </div>
  );
};

export default PostDetailSkeleton; 