"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [hoveredIcon, setHoveredIcon] = useState(null);
  
  return (
    <footer className="py-4 mt-auto">
      <div className="container mx-auto px-4">
        {/* 社交媒体图标 */}
        <div className="flex justify-center space-x-8 mb-2">
          {/* 小红书图标 */}
          <a 
            href="https://www.xiaohongshu.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="transition-all duration-200"
            aria-label="小红书"
            onMouseEnter={() => setHoveredIcon('xiaohongshu')}
            onMouseLeave={() => setHoveredIcon(null)}
          >
            <div className={`w-6 h-6 relative ${hoveredIcon === 'xiaohongshu' ? 'opacity-70 scale-110' : ''}`}>
              <Image 
                src="/images/xiaohongshu.svg"
                alt="小红书" 
                fill
                className="object-contain"
              />
            </div>
          </a>
          
          {/* 博客图标 */}
          <Link 
            href="/"
            className="transition-all duration-200"
            aria-label="CyBlog"
            onMouseEnter={() => setHoveredIcon('blog')}
            onMouseLeave={() => setHoveredIcon(null)}
          >
            <div className={`w-6 h-6 relative ${hoveredIcon === 'blog' ? 'opacity-70 scale-110' : ''}`}>
              <Image 
                src="/images/logo.png" 
                alt="CyBlog"
                fill
                className="object-contain"
              />
            </div>
          </Link>
          
          {/* GitHub图标 */}
          <a 
            href="https://github.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="transition-all duration-200"
            aria-label="GitHub"
            onMouseEnter={() => setHoveredIcon('github')}
            onMouseLeave={() => setHoveredIcon(null)}
          >
            <div className={`w-6 h-6 relative ${hoveredIcon === 'github' ? 'opacity-70 scale-110' : ''}`}>
              <Image 
                src="/images/github.svg"
                alt="GitHub"
                fill
                className={`object-contain ${hoveredIcon === 'github' ? 'invert dark:invert-0' : 'dark:invert'}`}
              />
            </div>
          </a>
        </div>
        
        {/* 版权信息 */}
        <div className="text-center text-gray-600 dark:text-gray-400 text-sm">
          <p>© {currentYear} 由 CyBlog 授权</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 