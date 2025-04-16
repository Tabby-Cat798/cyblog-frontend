"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import MarkdownRenderer from './MarkdownRenderer';
import TableOfContents from './TableOfContents';
import CommentSection from './CommentSection';
import { useSettings } from '@/lib/SettingsContext';

const PostDetailClient = ({ postId, initialData }) => {
  const [post, setPost] = useState(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState(null);
  const [viewCount, setViewCount] = useState(initialData?.viewCount || 0);

  // 获取全局设置
  const { settings, setPageTitle } = useSettings();
  
  // 确定是否显示阅读量和评论
  const showViewCount = settings?.articles?.defaultShowViewCount ?? true;
  const allowComments = settings?.articles?.defaultAllowComments ?? true;
  
  // 添加诊断日志检查settings的值
  console.log('[阅览量系统] 全局设置状态:', {
    settings: settings,
    showViewCount: showViewCount,
    allowComments: allowComments
  });

  // 更新阅览量的函数
  const incrementViewCount = async (id) => {
    try {
      // 检查localStorage是否可用
      let storageAvailable = false;
      try {
        const testKey = "__test__";
        localStorage.setItem(testKey, testKey);
        storageAvailable = localStorage.getItem(testKey) === testKey;
        localStorage.removeItem(testKey);
        console.log('[阅览量] localStorage可用:', storageAvailable);
      } catch (e) {
        console.warn('[阅览量] localStorage不可用:', e);
        storageAvailable = false;
      }
      
      // 即使localStorage不可用，我们也尝试增加阅览量（跳过去重检查）
      if (!storageAvailable) {
        console.log('[阅览量] 由于localStorage不可用，将直接增加阅览量');
        // 直接发送请求增加阅览量
        const response = await fetch(`/api/posts/${id}/view`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (response.ok) {
          setViewCount(prev => prev + 1);
          console.log('[阅览量] API请求成功，阅览量已增加（localStorage不可用模式）');
        } else {
          console.warn('[阅览量] API请求失败:', await response.text());
        }
        return;
      }
      
      // localStorage可用，执行正常流程
      let viewedPosts;
      try {
        viewedPosts = JSON.parse(localStorage.getItem('viewedPosts') || '{}');
      } catch (e) {
        console.warn('[阅览量] 解析localStorage数据失败，将重置:', e);
        viewedPosts = {};
      }
      
      // 输出当前localStorage状态
      console.log('[阅览量] 检查状态:', { 
        文章ID: id,
        上次访问时间: viewedPosts[id] ? new Date(viewedPosts[id]).toLocaleString() : '从未访问',
        所有记录文章数: Object.keys(viewedPosts).length,
        显示设置: showViewCount
      });
      
      // 检查上次访问时间，如果超过24小时才算新的访问
      const currentTime = new Date().getTime();
      const lastViewTime = viewedPosts[id] || 0;
      const twentyFourHours = 24 * 60 * 60 * 1000; // 24小时的毫秒数
      
      if (currentTime - lastViewTime > twentyFourHours) {
        // 输出即将更新的信息
        console.log('[阅览量] 需要更新:', { 
          文章ID: id, 
          时间差: `${Math.floor((currentTime - lastViewTime) / (60 * 60 * 1000))}小时`,
          将更新为: new Date(currentTime).toLocaleString()
        });
        
        // 使用try-catch来处理localStorage写入操作
        try {
          // 更新本地存储中的访问时间记录
          viewedPosts[id] = currentTime;
          localStorage.setItem('viewedPosts', JSON.stringify(viewedPosts));
          
          // 验证localStorage是否成功更新
          const verifyStorage = JSON.parse(localStorage.getItem('viewedPosts') || '{}');
          console.log('[阅览量] 存储结果:', {
            成功: verifyStorage[id] === currentTime,
            当前时间戳: verifyStorage[id],
            期望时间戳: currentTime,
            相应日期: new Date(verifyStorage[id]).toLocaleString()
          });
        } catch (e) {
          console.warn('[阅览量] 更新localStorage失败，将继续增加阅览量:', e);
        }
        
        // 无论localStorage是否成功更新，都发送请求增加阅览量
        let apiSuccess = false;
        try {
          // 发送请求增加阅览量
          const response = await fetch(`/api/posts/${id}/view`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            // 更新本地显示的阅览量，即使不显示也要更新状态
            setViewCount(prev => prev + 1);
            console.log('[阅览量] API请求成功，阅览量已增加');
            apiSuccess = true;
          } else {
            console.warn('[阅览量] API请求失败:', await response.text());
          }
        } catch (e) {
          console.error('[阅览量] API请求发生错误:', e);
        }
        
        // 如果API请求失败但localStorage更新成功，则回滚localStorage（为下次尝试保留机会）
        if (!apiSuccess) {
          try {
            delete viewedPosts[id]; // 删除本次记录
            localStorage.setItem('viewedPosts', JSON.stringify(viewedPosts));
            console.log('[阅览量] 由于API请求失败，已回滚localStorage记录');
          } catch (e) {
            console.warn('[阅览量] 回滚localStorage失败:', e);
          }
        }
      } else {
        const hoursLeft = Math.floor((twentyFourHours - (currentTime - lastViewTime)) / (60 * 60 * 1000));
        console.log('[阅览量] 无需更新:', { 
          文章ID: id, 
          距离上次访问: `${Math.floor((currentTime - lastViewTime) / (60 * 60 * 1000))}小时`,
          需再等待: `${hoursLeft}小时后才会再次计数`
        });
      }
    } catch (error) {
      console.error('[阅览量] 处理失败:', error);
      
      // 即使主要流程失败，仍然尝试直接增加阅览量
      try {
        console.log('[阅览量] 主流程失败，尝试应急增加阅览量');
        const response = await fetch(`/api/posts/${id}/view`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (response.ok) {
          setViewCount(prev => prev + 1);
          console.log('[阅览量] 应急API请求成功');
        }
      } catch (e) {
        console.error('[阅览量] 应急增加阅览量也失败:', e);
      }
    }
  };

  useEffect(() => {
    const fetchPost = async () => {
      // 如果已经有初始数据，不需要重新获取
      if (initialData) {
        setPost(initialData);
        // 确保设置正确的初始阅览量
        setViewCount(initialData.viewCount || 0);
        
        // 在客户端环境下更新阅览量，即使有初始数据
        if (typeof window !== 'undefined') {
          try {
            console.log('[阅览量] 使用初始数据时尝试更新阅览量');
            await incrementViewCount(postId);
          } catch (err) {
            console.error('[阅览量] 初始数据模式更新失败:', err);
          }
        }
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/posts/${postId}`);
        if (!response.ok) {
          throw new Error('获取文章失败');
        }
        const data = await response.json();
        setPost(data);
        // 设置正确的阅览量
        setViewCount(data.viewCount || 0);
        
        // 设置页面标题
        if (data.title) {
          document.title = `${data.title} | CyBlog`;
        }
        
        // 在客户端环境下才执行增加阅览量的操作
        if (typeof window !== 'undefined') {
          await incrementViewCount(postId);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (postId && !initialData) {
      fetchPost();
    }
    
    // 组件卸载时重置标题
    return () => {
      document.title = "CyBlog ｜ 技术博客";
    };
  }, [postId, initialData]);

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

  // 检查是否为纯GitHub账号（无密码）
  const isGithubOnlyAccount = post?.github && (!post.password && !post.hashedPassword);

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