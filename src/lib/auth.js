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
        // 特殊处理：如果是GitHub用户
        if (data.githubUser) {
          throw new Error(data.error || '此账号需要使用GitHub登录');
        }
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
  
  // GitHub登录
  const githubLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/github');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'GitHub登录初始化失败');
      }
      
      // 重定向到GitHub授权页面
      window.location.href = data.authUrl;
      
      // 注意：此处不会设置用户状态，因为页面会重定向到GitHub
      // 用户状态将在回调处理后通过fetchCurrentUser获取
      
      return data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
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
  
  // 组件挂载时获取用户信息
  useEffect(() => {
    fetchCurrentUser();
  }, []);
  
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        register,
        githubLogin,
        fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// 使用认证的钩子
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth必须在AuthProvider内部使用');
  }
  return context;
} 