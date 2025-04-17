"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [hoveredIcon, setHoveredIcon] = useState(null);
  
  return (
    <footer className="pt-4 pb-2 mt-auto">
      <div className="container mx-auto px-4">
        {/* 社交媒体图标 */}
        <div className="flex justify-center space-x-8 mb-2">
          {/* 小红书图标 */}
          <a 
            href="https://www.xiaohongshu.com/user/profile/61e60448000000001000596f" 
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
                width={24}
                height={24}
                className="object-contain scale-110"
                style={{ maxWidth: "100%", height: "auto" }}
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
            href="https://github.com/tabby-cat798" 
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
                width={24}
                height={24}
                className="object-contain"
                style={{ maxWidth: "100%", height: "auto" }}
              />
            </div>
          </a>
        </div>
        
        {/* 版权信息 */}
        <div className="text-center text-gray-600 dark:text-gray-400 text-sm">
          
          {/* 备案信息 */}
          <p className="mt-2 text-xs">
            <a 
              href="https://beian.miit.gov.cn/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-blue-500 transition-colors duration-200"
            >
              陕ICP备2024047964号-1
            </a>
          </p>
          <p>Copyright © {currentYear} cyblog.fun. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 