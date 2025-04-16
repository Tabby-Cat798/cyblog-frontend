import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/lib/auth";
import { SettingsProvider } from "@/lib/SettingsContext";
import clientPromise from '@/lib/mongodb';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "CyBlog ｜ 技术博客",
  description: "CyBlog个人技术博客，分享Web开发、算法、数据结构等领域的技术文章与学习心得",
};

// 设置ISR重新验证时间为1小时
export const revalidate = 3600;

// 服务器端获取设置数据
async function getSettings() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'blogs');
    
    // 查询设置集合，获取全局设置文档
    const settings = await db.collection('settings').findOne({ _id: 'global' });
    
    // 如果没有找到设置，返回默认设置
    if (!settings) {
      return {
        articles: {
          defaultShowViewCount: true,
          defaultShowCommentCount: true,
          defaultAllowComments: true
        }
      };
    }
    
    return settings;
  } catch (error) {
    console.error('获取设置失败:', error);
    // 返回默认设置
    return {
      articles: {
        defaultShowViewCount: true,
        defaultShowCommentCount: true,
        defaultAllowComments: true
      }
    };
  }
}

export default async function RootLayout({ children }) {
  // 在服务器组件中获取设置，应用ISR缓存
  const initialSettings = await getSettings();

  return (
    <html lang="zh-CN" className="scroll-smooth">
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
