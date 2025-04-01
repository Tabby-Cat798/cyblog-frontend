"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWeixin, faGoogle } from "@fortawesome/free-brands-svg-icons";
import { faEye, faEyeSlash, faExclamationCircle } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  
  const router = useRouter();
  const { login, register } = useAuth();

  // 处理表单输入变化
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // 清除对应字段的错误
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  // 表单验证
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = "请输入邮箱";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "请输入有效的邮箱地址";
    }
    
    if (!formData.password) {
      newErrors.password = "请输入密码";
    } else if (formData.password.length < 6) {
      newErrors.password = "密码长度不能小于6位";
    }
    
    if (!isLogin && !formData.name) {
      newErrors.name = "请输入用户名";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (isLogin) {
        // 登录
        await login(formData.email, formData.password);
        router.push('/');
      } else {
        // 注册
        await register(formData.name, formData.email, formData.password);
        // 注册成功后自动登录
        await login(formData.email, formData.password);
        router.push('/');
      }
    } catch (error) {
      setServerError(error.message || (isLogin ? "登录失败" : "注册失败"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // 切换登录/注册模式
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setServerError("");
  };

  return (
    <div className="max-w-md mx-auto my-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white">
        {isLogin ? "欢迎回来" : "创建账号"}
      </h1>
      
      {serverError && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md flex items-center">
          <FontAwesomeIcon icon={faExclamationCircle} className="mr-2" />
          <span>{serverError}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div className="space-y-1">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              用户名
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.name
                  ? "border-red-500 focus:ring-red-200"
                  : "border-gray-300 dark:border-gray-600 focus:ring-blue-200 dark:focus:ring-blue-800"
              } dark:bg-gray-700 dark:text-white`}
              placeholder="请输入用户名"
            />
            {errors.name && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.name}</p>
            )}
          </div>
        )}
        
        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            邮箱
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.email
                ? "border-red-500 focus:ring-red-200"
                : "border-gray-300 dark:border-gray-600 focus:ring-blue-200 dark:focus:ring-blue-800"
            } dark:bg-gray-700 dark:text-white`}
            placeholder="请输入邮箱"
          />
          {errors.email && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.email}</p>
          )}
        </div>
        
        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            密码
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.password
                  ? "border-red-500 focus:ring-red-200"
                  : "border-gray-300 dark:border-gray-600 focus:ring-blue-200 dark:focus:ring-blue-800"
              } dark:bg-gray-700 dark:text-white`}
              placeholder="请输入密码"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 dark:text-gray-400"
            >
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.password}</p>
          )}
        </div>
        
        {isLogin && (
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              忘记密码?
            </Link>
          </div>
        )}
        
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 px-4 rounded-md text-white font-medium transition ${
            isSubmitting
              ? "bg-blue-400 dark:bg-blue-600 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          }`}
        >
          {isSubmitting
            ? isLogin
              ? "登录中..."
              : "注册中..."
            : isLogin
              ? "登录"
              : "注册"}
        </button>
      </form>
      
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              或者
            </span>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center justify-center"
          >
            <FontAwesomeIcon icon={faWeixin} className="text-green-600 mr-2" />
            <span>微信登录</span>
          </button>
          <button
            type="button"
            className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center justify-center"
          >
            <FontAwesomeIcon icon={faGoogle} className="text-red-600 mr-2" />
            <span>谷歌登录</span>
          </button>
        </div>
      </div>
      
      <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        {isLogin ? "还没有账号? " : "已有账号? "}
        <button
          type="button"
          onClick={toggleMode}
          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          {isLogin ? "立即注册" : "去登录"}
        </button>
      </div>
    </div>
  );
} 