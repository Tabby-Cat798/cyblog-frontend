"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon, faBars, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/lib/auth';

const Header = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  // 切换暗色模式
  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDarkMode(true);
    }
  };

  // 检查系统主题偏好或已保存的主题
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    }
  }, []);
  
  // 监听滚动事件，用于改变导航栏样式
  useEffect(() => {
    // 初始化scrolled状态
    setScrolled(window.scrollY > 10);
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm' : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
            技术博客
          </Link>
          
          <nav className="hidden md:flex space-x-8">
            <NavLink href="/" active={pathname === '/'}>首页</NavLink>
            <NavLink href="/posts" active={pathname.startsWith('/posts')}>文章</NavLink>
            <NavLink href="/about" active={pathname === '/about'}>关于</NavLink>
            {user && <NavLink href="/profile" active={pathname === '/profile'}>我的</NavLink>}
            {user && user.role === 'admin' && (
              <div className="relative group">
                <button className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
                  管理
                </button>
                <div className="absolute top-full left-0 mt-1 w-32 bg-white dark:bg-gray-800 shadow-lg rounded-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <Link
                    href="/admin"
                    className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    控制台
                  </Link>
                  <Link
                    href="/admin/settings"
                    className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    设置
                  </Link>
                </div>
              </div>
            )}
          </nav>
          
          <div className="flex items-center space-x-4">
            {/* 主题切换按钮 */}
            <button
              aria-label="切换暗色模式"
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-700/60 transition"
            >
              <FontAwesomeIcon
                icon={isDarkMode ? faSun : faMoon}
                className="w-5 h-5"
              />
            </button>

            {/* 用户认证区域 */}
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            ) : user ? (
              <div className="relative group">
                <button className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    {user.avatar ? (
                      <Image 
                        src={user.avatar} 
                        alt={user.name} 
                        width={32} 
                        height={32} 
                        className="object-cover" 
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-700">{user.name?.charAt(0)}</span>
                    )}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline text-gray-700 dark:text-gray-300">{user.name}</span>
                </button>
                
                {/* 下拉菜单 */}
                <div className="absolute right-0 mt-2 w-48 py-2 bg-white dark:bg-gray-800 rounded-md shadow-lg hidden group-hover:block">
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
            
            {/* 移动端菜单按钮 */}
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

      {/* 移动端导航菜单 */}
      <div
        className={`fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMenuOpen(false)}
      ></div>

      <div
        className={`fixed top-0 right-0 w-64 h-full bg-white dark:bg-gray-800 shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
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
                  pathname === "/"
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                首页
              </Link>
            </li>
            <li>
              <Link
                href="/posts"
                className={`block py-2 px-4 rounded-lg ${
                  pathname.startsWith("/posts")
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                文章
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className={`block py-2 px-4 rounded-lg ${
                  pathname === "/about"
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                关于
              </Link>
            </li>
            
            {user && (
              <li>
                <Link
                  href="/profile"
                  className={`block py-2 px-4 rounded-lg ${
                    pathname === "/profile"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  我的
                </Link>
              </li>
            )}
            
            {/* 移动端管理员链接 */}
            {user && user.role === 'admin' && (
              <>
                <li className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="px-4 text-sm text-gray-500 dark:text-gray-400">管理</p>
                </li>
                <li>
                  <Link
                    href="/admin"
                    className="block py-2 px-4 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    控制台
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/settings"
                    className="block py-2 px-4 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    设置
                  </Link>
                </li>
              </>
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
    >
      {children}
    </Link>
  );
};

export default Header; 