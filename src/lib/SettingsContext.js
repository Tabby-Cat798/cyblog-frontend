"use client";
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

// 创建设置上下文
const SettingsContext = createContext();

// 默认设置值
const defaultSettings = {
  articles: {
    defaultShowViewCount: true,
    defaultShowCommentCount: true,
    defaultAllowComments: true
  },
  pageTitle: ""
};

// 设置提供者组件
export function SettingsProvider({ initialSettings, children }) {
  // 使用从服务器组件传递的初始设置，并添加pageTitle
  const [settings, setSettings] = useState({
    ...initialSettings,
    pageTitle: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  // 获取页面标题 - 使用useCallback稳定函数引用
  const setPageTitle = useCallback((title) => {
    setSettings(prev => ({...prev, pageTitle: title}));
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
        // 保留当前的pageTitle
        setSettings(prev => ({
          ...data,
          pageTitle: prev.pageTitle
        }));
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

  // 可选：添加一个刷新设置的函数，用于需要获取最新设置的场景
  const refreshSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({
          ...data,
          pageTitle: prev.pageTitle
        }));
      }
    } catch (error) {
      console.error('刷新设置失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 提供上下文值
  const value = {
    settings,
    isLoading,
    updateSettings,
    setPageTitle,
    refreshSettings
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