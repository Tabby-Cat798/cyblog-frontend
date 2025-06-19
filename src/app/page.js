"use client";
import { useState, useEffect } from 'react';
import HomeServer from "@/components/HomeServer";
import AnimatedWelcome from "@/components/AnimatedWelcome";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchInitialPosts() {
      try {
        setLoading(true);
        const response = await fetch('/api/posts?limit=9');
        if (!response.ok) {
          throw new Error('获取文章失败');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('获取初始文章失败:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchInitialPosts();
  }, []);

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <section className="mb-16 text-center pt-8">
          <h1 className="text-4xl font-bold mb-4">欢迎光临</h1>
          <h1 className="text-4xl font-bold mb-4">Cyril の 博客</h1>
          <div className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto min-h-[4rem]">
            <AnimatedWelcome />
          </div>
        </section>
        
        <section className="mb-16" id="articles">
          <div className="flex justify-between items-center mb-8 pb-2 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold">最新文章</h2>
          </div>
          <div className="w-full py-20 text-center">
            <p className="text-gray-600 dark:text-gray-400">加载中...</p>
          </div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto px-4 py-8">
        <section className="mb-16 text-center pt-8">
          <h1 className="text-4xl font-bold mb-4">欢迎光临</h1>
          <h1 className="text-4xl font-bold mb-4">Cyril の 博客</h1>
          <div className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto min-h-[4rem]">
            <AnimatedWelcome />
          </div>
        </section>
        
        <section className="mb-16" id="articles">
          <div className="flex justify-between items-center mb-8 pb-2 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold">最新文章</h2>
          </div>
          <div className="w-full py-20 text-center">
            <p className="text-red-600 dark:text-red-400">加载失败: {error}</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <section className="mb-16 text-center pt-8">
        <h1 className="text-4xl font-bold mb-4">欢迎光临</h1>
        <h1 className="text-4xl font-bold mb-4">Cyril の 博客</h1>
        <div className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto min-h-[4rem]">
          <AnimatedWelcome />
        </div>
      </section>
      
      <section className="mb-16" id="articles">
        <div className="flex justify-between items-center mb-8 pb-2 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold">最新文章</h2>
        </div>
        <HomeServer initialData={data} />
      </section>
    </main>
  );
}
