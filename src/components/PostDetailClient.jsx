"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import MarkdownRenderer from './MarkdownRenderer';
import TableOfContents from './TableOfContents';
import CommentSection from './CommentSection';
import { useSettings } from '@/lib/SettingsContext';

const PostDetailClient = ({ postId }) => {
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewCount, setViewCount] = useState(0);

  // 获取全局设置
  const { settings, setPageTitle } = useSettings();
  
  // 确定是否显示阅读量和评论
  const showViewCount = settings?.articles?.defaultShowViewCount ?? true;
  const allowComments = settings?.articles?.defaultAllowComments ?? true;

  // 更新阅览量的函数
  const incrementViewCount = async (id) => {
    try {
      // 只有在允许显示阅读量时才更新阅读量
      if (!showViewCount) return;
      
      const response = await fetch(`/api/posts/${id}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // 更新本地显示的阅览量
        setViewCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('增加阅览量失败:', error);
    }
  };

  useEffect(() => {
    const fetchPost = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/posts/${postId}`);
        if (!response.ok) {
          throw new Error('获取文章失败');
        }
        const data = await response.json();
        setPost(data);
        setViewCount(data.viewCount || 0);
        
        // 设置页面标题
        if (data.title) {
          setPageTitle(data.title);
        }
        
        // 文章加载成功后，增加阅览量
        await incrementViewCount(postId);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
    
    // 组件卸载时清除页面标题
    return () => {
      setPageTitle("");
    };
  }, [postId, showViewCount]);

  if (isLoading) {
    return (
      <div className="w-full py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-20 text-center">
        <p className="text-red-500">{error}</p>
        <Link href="/" className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          返回首页
        </Link>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="w-full py-20 text-center">
        <p className="text-xl text-gray-600 dark:text-gray-400">文章不存在</p>
        <Link href="/" className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          返回首页
        </Link>
      </div>
    );
  }

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

  const formattedDate = formatDate(post.createdAt);

  return (
    <article className="max-w-5xl mx-auto pt-8">
      {/* 文章头部 */}
      <header className="flex flex-col items-center text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">{post.title}</h1>
        
        <div className="flex flex-wrap justify-center items-center text-gray-600 dark:text-gray-400 mb-6">
          <span className="mr-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formattedDate}</span>
          </span>
          
          {showViewCount && (
            <span className="mr-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{viewCount} 次阅读</span>
            </span>
          )}
        </div>

        {/* 标签 */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {post.tags.map((tag, index) => (
              <div
                key={index}
                className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-3 py-1 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800"
              >
                {tag}
              </div>
            ))}
          </div>
        )}

        {/* 封面图部分被移除 */}
      </header>

      {/* 文章主体与目录 */}
      <div className="flex flex-col lg:flex-row gap-10">
        {/* 目录侧边栏 */}
        <TableOfContents content={post.content} />
        
        {/* 文章内容 */}
        <div className="flex-1 prose prose-lg prose-blue dark:prose-invert max-w-none mb-12 pt-0 mt-0">
          <MarkdownRenderer content={post.content} />
        </div>
      </div>

      {/* 使用自定义评论组件，根据全局设置决定是否显示 */}
      {allowComments && <CommentSection postId={postId} />}
    </article>
  );
};

export default PostDetailClient; 