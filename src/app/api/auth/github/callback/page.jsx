"use client";
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

// 创建一个独立的组件来包含useSearchParams
function GitHubCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("处理中...");
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    async function handleCallback() {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        
        console.log("GitHub回调页面 - 收到参数:", { 
          hasCode: !!code, 
          codeLength: code?.length,
          hasState: !!state
        });

        if (!code) {
          setError("未能获取授权码");
          return;
        }

        // 调用后端API处理GitHub登录
        setStatus("正在与GitHub通信...");
        console.log("开始调用后端API处理GitHub登录...");
        
        const response = await fetch('/api/auth/github', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, state }),
        });

        const data = await response.json();
        console.log("GitHub登录API响应:", { 
          status: response.status,
          success: data.success,
          hasUser: !!data.user,
          error: data.error
        });
        
        if (response.ok && data.success) {
          console.log("登录成功，用户信息:", data.user);
          setUserInfo(data.user);
          setStatus("登录成功，正在跳转...");
          
          // 登录成功，跳转到首页
          setTimeout(() => {
            // 强制刷新页面以确保用户信息更新
            window.location.href = '/';
          }, 3000);
        } else {
          console.error("登录失败:", data.error);
          setError(data.error || "登录失败");
        }
      } catch (err) {
        console.error("GitHub登录处理错误:", err);
        setError("登录处理出错: " + (err.message || err.toString()));
      }
    }

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">GitHub登录</h1>
        
        {error ? (
          <div className="mb-6">
            <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">
              {error}
            </div>
            <button
              onClick={() => router.push('/login')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              返回登录
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{status}</p>
            
            {userInfo && (
              <div className="mt-4 text-left w-full">
                <h3 className="font-medium text-gray-800 dark:text-white mb-2">登录信息:</h3>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-3">
                  <p className="mb-1"><span className="font-medium">用户名:</span> {userInfo.name}</p>
                  <p className="mb-1"><span className="font-medium">邮箱:</span> {userInfo.email}</p>
                  <p className="mb-1"><span className="font-medium">角色:</span> {userInfo.role}</p>
                  {userInfo.avatar && (
                    <div className="mt-2">
                      <span className="font-medium">头像:</span>
                      <div className="mt-2">
                        <Image 
                          src={userInfo.avatar} 
                          alt="用户头像" 
                          width={64} 
                          height={64}
                          className="rounded-full border-2 border-gray-200 dark:border-gray-600"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 主组件使用Suspense包裹内容组件
export default function GitHubCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">GitHub登录</h1>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">加载中...</p>
          </div>
        </div>
      </div>
    }>
      <GitHubCallbackContent />
    </Suspense>
  );
} 