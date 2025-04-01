"use client";

import { useState, useEffect, createContext, useContext } from 'react';

// 创建认证上下文
export const AuthContext = createContext(null);

// 认证提供者组件
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 获取当前用户信息
  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/me');
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // 如果没有登录或令牌无效，将用户设为null
        setUser(null);
      }
    } catch (err) {
      console.error('获取用户信息失败', err);
      setError('获取用户信息失败');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
  
  // 登录
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '登录失败');
      }
      
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // 注册
  const register = async (name, email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '注册失败');
      }
      
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // 退出登录
  const logout = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '退出登录失败');
      }
      
      setUser(null);
    } catch (err) {
      console.error('退出登录失败', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // 组件挂载时检查用户登录状态
  useEffect(() => {
    fetchCurrentUser();
  }, []);
  
  // 暴露给子组件的上下文
  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    fetchCurrentUser,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// 自定义Hook，便于组件中使用认证状态
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
} 