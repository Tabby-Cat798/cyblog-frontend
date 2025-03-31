"use client";
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const BlogCard = ({ post }) => {
  const {
    _id,
    title,
    summary,
    coverImage,
    createdAt,
    tags = [],
    status,
    viewCount = 0
  } = post;

  // 格式化日期 - 处理ISO格式时间
  const formatDate = (dateString) => {
    try {
      // 解析ISO格式时间字符串为Date对象
      const date = new Date(dateString);
      // 使用Date对象原生方法转换为正确的北京时区日期
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC' // 使用UTC时区
      });
    } catch (error) {
      console.error('日期格式化错误:', error);
      return dateString;
    }
  };

  const formattedDate = formatDate(createdAt);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      <div className="relative h-48 w-full">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-gray-500 dark:text-gray-400">无封面图片</span>
          </div>
        )}
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag, index) => (
            <span 
              key={index} 
              className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-2 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
        
        <Link href={`/posts/${_id}`}>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 mb-2 line-clamp-2">
            {title}
          </h2>
        </Link>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3 flex-grow">
          {summary}
        </p>
        
        <div className="flex justify-between items-center mt-auto text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>{viewCount}</span>
          </div>
          <span>{formattedDate}</span>
        </div>
      </div>
    </div>
  );
};

export default BlogCard;