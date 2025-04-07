import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/lib/auth";
import { SettingsProvider } from "@/lib/SettingsContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "技术博客 | 分享技术与学习心得",
  description: "个人技术博客，分享Web开发、人工智能、数据科学等领域的技术文章与学习心得",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" className="scroll-smooth">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300`}>
        <AuthProvider>
          <SettingsProvider>
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
