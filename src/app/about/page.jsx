"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export default function AboutPage() {
  const [hoveredIcon, setHoveredIcon] = useState(null);

  return (
    <main className="container mx-auto px-4 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* 左侧个人信息 */}
          <div className="flex flex-col items-center">
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 mb-4 sm:mb-6 rounded-full overflow-hidden">
              <Image
                src="https://images.cyblog.fun/images/1744356406997-010riz-71744356363_.pic.jpg"
                alt="Cyril"
                fill
                className="object-cover"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 font-serif">Cyril</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-2 text-sm">Developer</p>
            <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">cyril.zhao@outlook.com</p>
            <div className="flex space-x-6 sm:space-x-8 mb-6 sm:mb-8">
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
                <div className={`w-7 h-7 sm:w-8 sm:h-8 relative ${hoveredIcon === 'github' ? 'opacity-70 scale-110' : ''}`}>
                  <Image 
                    src="/images/github.svg"
                    alt="GitHub"
                    width={32}
                    height={32}
                    className="object-contain"
                    style={{ maxWidth: "100%", height: "auto" }}
                  />
                </div>
              </a>

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
                <div className={`w-7 h-7 sm:w-8 sm:h-8 relative ${hoveredIcon === 'xiaohongshu' ? 'opacity-70 scale-110' : ''}`}>
                  <Image 
                    src="/images/xiaohongshu.svg"
                    alt="小红书"
                    width={32}
                    height={32}
                    className="object-contain scale-110"
                    style={{ maxWidth: "100%", height: "auto" }}
                  />
                </div>
              </a>
            </div>
          </div>

          {/* 右侧个人简介 */}
          <div className="prose dark:prose-invert max-w-none">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 font-serif">关于我</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-serif text-base sm:text-lg">
              Hi there, I'm Cyril. Welcome to my corner of the Internet. I write about tech, thought, and life in general.<br/>
              <br/>
              <span className="italic">What you think, you become<br/>
              What you feel, you attract<br/>
              What you imagine, you create.</span><br/>
              <br/>
              <span className="font-sans">目前正在努力成为一名软件工程师，但更重要的是在找自己</span>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
} 