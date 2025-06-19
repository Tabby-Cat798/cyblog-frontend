"use client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/lib/auth";
import { SettingsProvider } from "@/lib/SettingsContext";
import { useEffect, useState } from 'react';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  const [initialSettings, setInitialSettings] = useState({
    articles: {
      defaultShowViewCount: true,
      defaultShowCommentCount: true,
      defaultAllowComments: true
    }
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const settings = await response.json();
          setInitialSettings(settings);
        }
      } catch (error) {
        console.error('获取设置失败:', error);
      } finally {
        setSettingsLoaded(true);
      }
    }

    fetchSettings();
  }, []);

  // 等待设置加载完成再渲染完整页面
  if (!settingsLoaded) {
    return (
      <html lang="zh-CN" className="scroll-smooth">
        <head>
          <title>CyBlog ｜ 技术博客</title>
          <meta name="description" content="CyBlog个人技术博客，分享Web开发、算法、数据结构等领域的技术文章与学习心得" />
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable} font-sans min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300`}>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-600 dark:text-gray-400">加载中...</p>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="zh-CN" className="scroll-smooth">
      <head>
        <title>CyBlog ｜ 技术博客</title>
        <meta name="description" content="CyBlog个人技术博客，分享Web开发、算法、数据结构等领域的技术文章与学习心得" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300`}>
        <AuthProvider>
          <SettingsProvider initialSettings={initialSettings}>
            <Header />
            <main className="flex-1 pt-18 relative z-0">
              {children}
            </main>
            <Footer />
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
