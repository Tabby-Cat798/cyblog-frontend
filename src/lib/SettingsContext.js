"use client";
import React, { createContext, useState, useContext, useEffect } from 'react';

// 创建设置上下文
const SettingsContext = createContext();

// 默认设置值
const defaultSettings = {
  articles: {
    defaultShowViewCount: true,
    defaultShowCommentCount: true,
    defaultAllowComments: true
  },
  isLoading: true
};

// 设置提供者组件
export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // 在客户端组件加载时获取设置
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('获取设置失败:', error);
        // 如果获取失败，保持使用默认设置
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // 更新设置的函数
  const updateSettings = async (newSettings) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSettings)
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        return { success: true };
      } else {
        return { success: false, error: '更新设置失败' };
      }
    } catch (error) {
      console.error('更新设置失败:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // 提供上下文值
  const value = {
    settings,
    isLoading,
    updateSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// 自定义钩子以便在组件中使用
export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
} 