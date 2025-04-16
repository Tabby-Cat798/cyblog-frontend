"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera, faSpinner, faExclamationCircle, faCheck } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/lib/auth";

export default function ProfilePage() {
  const { user, loading, error, fetchCurrentUser } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  
  // 当用户数据加载完成后，填充表单数据
  useEffect(() => {
    if (user) {
      setFormData({
        ...formData,
        name: user.name || "",
        email: user.email || "",
      });
      if (user.avatar) {
        setAvatarPreview(user.avatar);
      }
    }
  }, [user]);
  
  // 如果未登录，重定向到登录页面
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);
  
  // 渲染骨架屏UI
  const renderSkeleton = () => {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
        
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded-t mr-4"></div>
          <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded-t mr-4"></div>
          <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded-t"></div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 mb-6">
            <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700"></div>
            <div className="flex-1">
              <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
          <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded mt-6 ml-auto"></div>
        </div>
      </div>
    );
  };
  
  // 处理表单输入变化
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  // 处理头像选择
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        setUpdateError('请选择图片文件');
        return;
      }
      
      // 验证文件大小（2MB）
      if (file.size > 2 * 1024 * 1024) {
        setUpdateError('图片大小不能超过2MB');
        return;
      }
      
      setAvatar(file);
      
      // 创建文件预览
      const reader = new FileReader();
      reader.onloadend = () => {
        // 图片加载完成后，处理图片预览
        setAvatarPreview(reader.result);
        
        // 在此处可以添加图片压缩代码，以减少上传数据量
        // 这里简化处理，直接使用原图
      };
      reader.readAsDataURL(file);
    }
  };
  
  // 更新个人资料
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdateError("");
    setUpdateSuccess("");
    setIsUpdating(true);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      
      if (avatar) {
        formDataToSend.append("avatar", avatar);
      }
      
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        body: formDataToSend,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "更新个人资料失败");
      }
      
      setUpdateSuccess("个人资料已更新");
      fetchCurrentUser(); // 重新获取用户信息以更新界面
    } catch (error) {
      setUpdateError(error.message);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // 更新密码
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setUpdateError("");
    setUpdateSuccess("");
    
    // 验证新密码
    if (formData.newPassword !== formData.confirmPassword) {
      setUpdateError("新密码与确认密码不匹配");
      return;
    }
    
    if (formData.newPassword.length < 6) {
      setUpdateError("新密码长度不能小于6位");
      return;
    }
    
    setIsUpdating(true);
    
    try {
      const response = await fetch("/api/user/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "更新密码失败");
      }
      
      setUpdateSuccess("密码已更新");
      setFormData({
        ...formData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setUpdateError(error.message);
    } finally {
      setIsUpdating(false);
    }
  };
  
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto my-12">
        {renderSkeleton()}
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto my-12">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">个人资料</h1>
      
      {/* 标签页导航 */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab("profile")}
          className={`py-2 px-4 font-medium ${
            activeTab === "profile"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
              : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
          }`}
        >
          个人信息
        </button>
        <button
          onClick={() => setActiveTab("password")}
          className={`py-2 px-4 font-medium ${
            activeTab === "password"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
              : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
          } ${user?.github ? "opacity-50 cursor-not-allowed" : ""}`}
          disabled={user?.github}
          title={user?.github ? "GitHub登录用户无法修改密码" : ""}
        >
          修改密码
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`py-2 px-4 font-medium ${
            activeTab === "settings"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
              : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
          }`}
        >
          账号设置
        </button>
      </div>
      
      {/* 消息提示 */}
      {updateError && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md flex items-center">
          <FontAwesomeIcon icon={faExclamationCircle} className="mr-2" />
          <span>{updateError}</span>
        </div>
      )}
      
      {updateSuccess && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md flex items-center">
          <FontAwesomeIcon icon={faCheck} className="mr-2" />
          <span>{updateSuccess}</span>
        </div>
      )}
      
      {/* 个人信息表单 */}
      {activeTab === "profile" && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            {/* 头像上传 */}
            <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  {avatarPreview ? (
                    <Image 
                      src={avatarPreview} 
                      alt="头像预览" 
                      width={96} 
                      height={96} 
                      className="object-cover w-full h-full" 
                    />
                  ) : (
                    <span className="text-3xl font-medium text-gray-400">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <label 
                  htmlFor="avatar" 
                  className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-blue-700 transition"
                >
                  <FontAwesomeIcon icon={faCamera} className="w-3.5 h-3.5" />
                  <input 
                    type="file" 
                    id="avatar" 
                    accept="image/*"
                    className="hidden" 
                    onChange={handleAvatarChange} 
                  />
                </label>
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-1">
                  {user?.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  {user?.email}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  建议上传正方形图片，文件大小不超过2MB
                </p>
              </div>
            </div>
            
            {/* 用户名 */}
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            {/* 邮箱 (显示为禁用状态) */}
            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                邮箱
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 dark:text-gray-500">
                邮箱不可修改，如需更换请联系管理员
              </p>
            </div>
            
            <button
              type="submit"
              disabled={isUpdating}
              className={`py-2 px-4 rounded-md text-white font-medium transition ${
                isUpdating
                  ? "bg-blue-400 dark:bg-blue-600 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              }`}
            >
              {isUpdating ? "保存中..." : "保存更改"}
            </button>
          </form>
        </div>
      )}
      
      {/* 修改密码表单 */}
      {activeTab === "password" && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          {user?.github ? (
            <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-md">
              <h3 className="font-medium mb-2">无法修改密码</h3>
              <p>您是通过GitHub账号登录的，无法设置或修改密码。如需使用密码登录，请使用相同邮箱注册一个新账户。</p>
            </div>
          ) : (
            <form onSubmit={handlePasswordUpdate} className="space-y-6">
              <div className="space-y-1">
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  当前密码
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              
              <div className="space-y-1">
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  新密码
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 dark:bg-gray-700 dark:text-white"
                  required
                  minLength={6}
                />
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  密码长度至少6位，建议使用字母、数字和符号的组合
                </p>
              </div>
              
              <div className="space-y-1">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  确认新密码
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isUpdating}
                className={`py-2 px-4 rounded-md text-white font-medium transition ${
                  isUpdating
                    ? "bg-blue-400 dark:bg-blue-600 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                }`}
              >
                {isUpdating ? "更新中..." : "更新密码"}
              </button>
            </form>
          )}
        </div>
      )}
      
      {/* 账号设置 */}
      {activeTab === "settings" && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="space-y-6">
            <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                账号信息
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">创建时间</p>
                  <p className="text-gray-800 dark:text-white">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleString() : "未知"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">上次登录</p>
                  <p className="text-gray-800 dark:text-white">
                    {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : "未知"}
                  </p>
                </div>
                {user?.github && (
                  <div className="col-span-2 mt-2">
                    <p className="text-gray-500 dark:text-gray-400">关联GitHub</p>
                    <div className="flex items-center mt-1">
                      <Image 
                        src={user.avatar} 
                        alt="GitHub头像" 
                        width={24} 
                        height={24}
                        className="rounded-full mr-2"
                      />
                      <p className="text-gray-800 dark:text-white">{user.github.username}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                账号注销
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                注销账号将删除您的所有数据，此操作不可撤销。
              </p>
              <button
                className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition"
              >
                删除账号
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 