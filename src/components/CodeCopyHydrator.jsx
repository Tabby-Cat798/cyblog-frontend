"use client";
import { useEffect } from "react";

const CodeCopyHydrator = () => {
  // 复制代码到剪贴板的函数
  const copyToClipboard = async (text, button) => {
    try {
      await navigator.clipboard.writeText(text);
      // 移除所有视觉反馈 - 静默复制
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  useEffect(() => {
    // 查找所有需要水合的复制按钮
    const copyButtons = document.querySelectorAll('[data-copy-target="true"]');
    const handlers = new Map();
    
    copyButtons.forEach((button) => {
      // 获取对应的代码块容器
      const codeWrapper = button.closest('.code-block-wrapper');
      if (codeWrapper) {
        const codeContent = codeWrapper.getAttribute('data-code');
        
        // 创建点击事件处理器
        const handleClick = () => {
          if (codeContent) {
            copyToClipboard(codeContent, button);
          }
        };
        
        // 存储处理器以便后续清理
        handlers.set(button, handleClick);
        
        // 添加点击事件监听器
        button.addEventListener('click', handleClick);
      }
    });
    
    // 清理函数
    return () => {
      handlers.forEach((handler, button) => {
        button.removeEventListener('click', handler);
      });
      handlers.clear();
    };
  }, []);

  // 这个组件不渲染任何内容，只负责水合功能
  return null;
};

export default CodeCopyHydrator; 