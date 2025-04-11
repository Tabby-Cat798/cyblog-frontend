"use client";
import React from 'react';
import { TypeAnimation } from 'react-type-animation';

const AnimatedWelcome = () => {
  return (
    <TypeAnimation
      sequence={[
        '这里分享关于Web开发、全栈开发的技术文章', // 第一句
        2000, // 停顿时间
        '这里分享关于数据结构、算法设计的学习心得', // 第二句
        2000, // 停顿时间
        '让我们一起探索技术的无限可能', // 第三句
        2000, // 停顿时间
      ]}
      speed={60} // 打字速度
      className="inline-block min-h-[30px]"
      repeat={Infinity} // 循环播放
    />
  );
};

export default AnimatedWelcome; 