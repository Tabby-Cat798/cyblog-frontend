"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon, faBars, faXmark, faList } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/lib/auth';
import { useSettings } from '@/lib/SettingsContext';

// 鼓励语数组
const encouragements = [
  "「async/await 教会我：有些事不必阻塞人生，但要学会优雅等待」",
  "「在Chrome DevTools里调试的不是代码，是自己混乱的思考路径」",
  "「真正的响应式设计，是凌晨三点改需求时依然稳定的血压」",
  "「用!important就像在代码里摔门——有效但缺乏格调」",
  "「看见NaN !== NaN的那一刻，我接受了人类的孤独本质」",
  "「TypeScript说：安全感不是天生的，是类型标注给的」",
  "「git rebase的本质：把草稿纸上的涂鸦重写成史诗」",
  "「我的代码像React组件——状态越复杂，生命周期越迷茫」",
  "「Vue的响应式像初恋——你以为双向绑定，其实是单向沦陷」",
  "「每个console.log都是对宇宙的一次哲学提问」",
  "「border-radius让像素世界变柔软」",
  "「用Flexbox布局的不仅是DIV，还有成年人的情绪管理」",
  "「写递归函数前先问自己：是否真的理解人生基线条件？」"

];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollDirection, setScrollDirection] = useState("up");
  const [lastScrollY, setLastScrollY] = useState(0);
  const [tableOfContents, setTableOfContents] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [encouragement, setEncouragement] = useState("");
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const { settings } = useSettings();
  const isPostDetail = pathname.startsWith('/posts');
  const [currentPostTitle, setCurrentPostTitle] = useState("");

  // 设置客户端状态
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 获取随机鼓励语
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * encouragements.length);
    setEncouragement(encouragements[randomIndex]);
  }, []);

  // 检测设备是否为移动端
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // 初始检查
    checkIsMobile();
    
    // 窗口大小改变时重新检查
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // 获取文章目录
  useEffect(() => {
    if (isPostDetail) {
      // 延迟获取目录，确保目录已经渲染完成
      const timer = setTimeout(() => {
        const headings = Array.from(document.querySelectorAll('article h2, article h3'))
          .map(heading => ({
            id: heading.id,
            text: heading.textContent,
            level: heading.tagName === 'H2' ? 2 : 3
          }))
          .filter(heading => heading.id); // 只保留有ID的标题
        
        setTableOfContents(headings.slice(0, 5)); // 只显示前5个目录项
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isPostDetail]);

  // 获取文章标题
  useEffect(() => {
    if (isPostDetail) {
      const postTitle = document.querySelector('article h1')?.textContent;
      if (postTitle) {
        setCurrentPostTitle(postTitle);
      }
    }
  }, [isPostDetail, pathname]);

  const quote = "编程不仅仅是代码，更是一种艺术";
  
  const getPageTitle = () => {
    if (settings?.pageTitle) return settings.pageTitle;
    
    if (pathname === '/') return encouragement || quote;
    if (pathname === '/about') return "关于我们";
    if (pathname.startsWith('/posts/')) return currentPostTitle || "文章详情";
    if (pathname === '/posts') return "所有文章";
    if (pathname === '/login') return encouragement || "欢迎回来";
    if (pathname === '/profile') return encouragement || "个人空间";
    
    // 对于其他页面也返回激励语
    return encouragement || quote;
  };
  
  useEffect(() => {
    setScrolled(window.scrollY > 10);
    setLastScrollY(window.scrollY);
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 10);
      
      if (currentScrollY > lastScrollY + 5) {
        setScrollDirection("down");
      } else if (currentScrollY < lastScrollY - 5) {
        setScrollDirection("up");
      }
      
      setLastScrollY(currentScrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // 点击目录项
  const handleTocItemClick = (id) => {
    const element = document.getElementById(id);
    if (element) {
      // 考虑导航栏高度，设置偏移量
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      // 关闭菜单
      setIsMenuOpen(false);
      
      // 使用平滑滚动
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };
  
  // 显示移动端的鼓励语或目录
  const renderMobileContent = () => {
    if (!isPostDetail || !isMobile) return null;
    
    if (scrollDirection === "up" || !scrolled) {
      // 向上滚动或在顶部时显示鼓励语
      return (
        <div className="text-center text-sm italic text-gray-600 dark:text-gray-400 hidden md:hidden">
          {encouragement}
        </div>
      );
    } else {
      // 向下滚动时显示目录项
      return (
        <div className="hidden md:hidden">
          {tableOfContents.length > 0 ? (
            <button
              onClick={() => setIsMenuOpen(true)}
              className="text-sm text-blue-600 dark:text-blue-400 flex items-center"
            >
              <FontAwesomeIcon icon={faList} className="mr-1" /> 查看目录
            </button>
          ) : null}
        </div>
      );
    }
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-[30] transition-all duration-300 ${
        scrolled ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm' : 'bg-transparent'
      }`}
      suppressHydrationWarning
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* 左侧Logo */}
          <Link href="/" className="flex items-center text-2xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
            <span>CyBlog</span>
          </Link>
          
          <div className="flex-1 flex justify-center relative overflow-hidden h-10">
            {/* 桌面导航 - 只在非移动端显示 */}
            <nav className={`absolute inset-0 md:flex hidden justify-center items-center space-x-8 transition-all duration-300 ease-in-out transform ${
              scrollDirection === "down" && scrolled 
                ? "opacity-0 -translate-y-full pointer-events-none" 
                : "opacity-100 translate-y-0"
            }`}>
              <NavLink href="/" active={isClient && pathname === '/'}>首页</NavLink>
              <NavLink href="/#articles" active={isClient && pathname.startsWith('/posts')}>文章</NavLink>
              <NavLink href="/about" active={isClient && pathname === '/about'}>我的</NavLink>
            </nav>
            
            {/* 移动端鼓励语或目录 */}
            {renderMobileContent()}
            
            {/* 桌面滚动标题 */}
            <div className={`absolute inset-0 md:flex hidden justify-center items-center transition-all duration-300 ease-in-out transform ${
              scrollDirection === "down" && scrolled 
                ? "opacity-100 translate-y-0" 
                : "opacity-0 translate-y-full pointer-events-none"
            }`}>
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="relative px-4 py-1 rounded-full transition-all duration-200 hover:bg-blue-600 group"
                aria-label="回到顶部"
              >
                <span className="text-lg text-gray-800 dark:text-gray-200 group-hover:text-white group-hover:opacity-0 transition-all">
                  {getPageTitle()}
                </span>
                <span className="absolute inset-0 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200">
                  回到顶部
                </span>
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* 登录状态显示 */}
            {!loading && user ? (
              <div className="relative group">
                {/* 在移动端，头像点击直接跳转到个人资料页面 */}
                {isMobile ? (
                  <Link href="/profile">
                    <img
                      src={user.avatar || "/default-avatar.png"}
                      alt={user.name || "用户头像"}
                      className="w-8 h-8 rounded-full border-2 border-transparent hover:border-blue-400 transition-all duration-200"
                    />
                  </Link>
                ) : (
                  <div className="flex items-center space-x-2 px-1.5 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                    <img
                      src={user.avatar || "/default-avatar.png"}
                      alt={user.name || "用户头像"}
                      className="w-8 h-8 rounded-full border-2 border-transparent group-hover:border-blue-400 transition-all duration-200"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[100px] truncate">{user.name}</span>
                  </div>
                )}
                
                {/* 桌面端下拉菜单 - 只在非移动端显示 */}
                <div className="absolute right-0 mt-2 w-48 py-2 bg-white rounded-md shadow-lg hidden group-hover:block dark:bg-gray-800">
                  <div className="absolute top-[-10px] left-0 right-0 h-[10px] bg-transparent"></div>
                  <Link 
                    href="/profile" 
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    个人资料
                  </Link>
                  <button 
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    退出登录
                  </button>
                </div>
              </div>
            ) : (
              <Link 
                href="/login" 
                className="py-2 px-4 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                登录
              </Link>
            )}
            
            <button
              aria-label="菜单"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 md:hidden text-gray-600 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-700/60 rounded-md transition"
            >
              <FontAwesomeIcon
                icon={isMenuOpen ? faXmark : faBars}
                className="w-5 h-5"
              />
            </button>
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 bg-gray-900/60 z-[999] transition-all duration-300 ${
          isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMenuOpen(false)}
        style={{ 
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
        suppressHydrationWarning
      ></div>

      <div
        className={`fixed top-0 right-0 w-64 h-screen bg-white dark:bg-gray-800 shadow-lg z-[1000] transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        suppressHydrationWarning
      >
        <div className="sticky top-0 flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">菜单</h2>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <FontAwesomeIcon icon={faXmark} className="h-6 w-6" />
          </button>
        </div>

        <nav className="p-4">
          <ul className="space-y-3">
            <li>
              <Link
                href="/"
                className={`block py-2 px-4 rounded-lg ${
                  isClient && pathname === "/"
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                onClick={() => setIsMenuOpen(false)}
                suppressHydrationWarning
              >
                首页
              </Link>
            </li>

            <li>
              <Link
                href="/#articles"
                className={`block py-2 px-4 rounded-lg ${
                  isClient && pathname.startsWith("/posts")
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                onClick={() => setIsMenuOpen(false)}
                suppressHydrationWarning
              >
                文章
              </Link>
            </li>

            <li>
              <Link
                href="/about"
                className={`block py-2 px-4 rounded-lg ${
                  isClient && pathname === "/about"
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                onClick={() => setIsMenuOpen(false)}
                suppressHydrationWarning
              >
                我的
              </Link>
            </li>

            
            {user && (
              <li>
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 px-4 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  退出登录
                </button>
              </li>
            )}
            
            
          </ul>
        </nav>
      </div>
    </header>
  );
};

// 导航链接组件
const NavLink = ({ href, active, children }) => {
  return (
    <Link 
      href={href} 
      className={`${
        active 
          ? 'text-blue-600 dark:text-blue-400 font-medium' 
          : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
      } transition-colors duration-200`}
      suppressHydrationWarning
    >
      {children}
    </Link>
  );
};

export default Header; 