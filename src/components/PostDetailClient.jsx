"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import MarkdownRenderer from './MarkdownRenderer';
import TableOfContents from './TableOfContents';
import PostDetailSkeleton from './PostDetailSkeleton';

const PostDetailClient = ({ postId }) => {
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState('');
  const [viewCount, setViewCount] = useState(0);
  // 添加内容渐入状态
  const [contentVisible, setContentVisible] = useState(false);

  // 更新阅览量的函数
  const incrementViewCount = async (id) => {
    try {
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
        
        // 文章加载成功后，增加阅览量
        await incrementViewCount(postId);
        
        // 文章加载完成后，短暂延迟显示内容，创建渐入效果
        setTimeout(() => {
          setContentVisible(true);
        }, 100);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    // 评论提交逻辑（未实现）
    alert('评论功能尚未实现');
    setComment('');
  };

  // 显示骨架屏
  if (isLoading) {
    return <PostDetailSkeleton />;
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

  // 模拟评论数据
  const mockComments = [
    {
      id: 1,
      author: '用户A',
      content: '这篇文章很有帮助，感谢分享！',
      createdAt: new Date(Date.now() - 86400000 * 2) // 2天前
    },
    {
      id: 2,
      author: '用户B',
      content: '文章内容详实，讲解清晰，期待更多相关内容。',
      createdAt: new Date(Date.now() - 86400000) // 1天前
    }
  ];

  return (
    <article className={`max-w-5xl mx-auto transition-all duration-700 ${
      contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
    }`}>
      {/* 文章头部 */}
      <header className="flex flex-col items-center text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>
        
        <div className="flex flex-wrap justify-center items-center text-gray-600 dark:text-gray-400 mb-6">
          <span className="mr-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formattedDate}</span>
          </span>
          
          <span className="mr-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>{viewCount} 次阅读</span>
          </span>
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

      {/* 评论区 */}
      <section className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-2xl font-bold mb-8">评论 ({mockComments.length})</h3>
        
        {/* 评论列表 */}
        <div className="space-y-6 mb-10">
          {mockComments.map(comment => (
            <div key={comment.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <div className="font-medium">{comment.author}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {comment.createdAt.toLocaleDateString('zh-CN')}
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
            </div>
          ))}
        </div>
        
        {/* 评论表单 */}
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
          <h4 className="text-xl font-semibold mb-4">发表评论</h4>
          <form onSubmit={handleCommentSubmit}>
            <textarea
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 mb-4"
              rows="4"
              placeholder="写下你的评论..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            ></textarea>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors float-right"
            >
              发表评论
            </button>
          </form>
        </div>
      </section>
    </article>
  );
};

export default PostDetailClient; 