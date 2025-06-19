"use client";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import PostDetailClient from "@/components/PostDetailClient";

export default function PostDetail() {
  const params = useParams();
  const id = params.id;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPost() {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/posts/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('文章不存在');
          } else {
            setError('获取文章失败');
          }
          return;
        }
        
        const postData = await response.json();
        
        // 序列化数据
        const initialData = {
          ...postData,
          _id: postData._id.toString(),
          createdAt: postData.createdAt instanceof Date ? postData.createdAt.toISOString() : postData.createdAt,
          updatedAt: postData.updatedAt instanceof Date ? postData.updatedAt.toISOString() : postData.updatedAt
        };
        
        setPost(initialData);
        
        // 动态设置页面标题
        if (typeof document !== 'undefined') {
          document.title = `${postData.title} | CyBlog`;
        }
        
      } catch (err) {
        console.error('获取文章数据失败:', err);
        setError('获取文章数据时发生错误，请稍后重试');
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8 pt-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">加载中...</h1>
          <p className="text-gray-600 dark:text-gray-400">正在获取文章内容</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto px-4 py-8 pt-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">
            {error === '文章不存在' ? '文章不存在' : '加载失败'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {error === '文章不存在' 
              ? '您访问的文章不存在或已被删除。' 
              : error
            }
          </p>
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="container mx-auto px-4 py-8 pt-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">文章不存在</h1>
          <p className="text-gray-600 dark:text-gray-400">您访问的文章不存在或已被删除。</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 pt-8">
      <PostDetailClient postId={id} initialData={post} />
    </main>
  );
} 