import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { jwtVerify } from 'jose';

// 只记录这些路径的访问
const INCLUDED_PATHS = [
  '/',           // 首页
  '/posts',      // 文章列表页
  '/about',     // 关于页面
  '/profile',   // 用户中心
];

// 检查是否应该记录特定路径
function shouldRecordPath(path) {
  // 对于文章详情页，路径格式为 /posts/[id]，其中id是MongoDB的ObjectId
  if (path.match(/^\/posts\/[a-zA-Z0-9]+$/)) {
    return true;
  }
  
  // 其他指定路径
  return INCLUDED_PATHS.includes(path);
}

// 创建节流函数
const createThrottle = (delay = 1000) => {
  const timers = new Map();
  
  return (ip) => {
    if (timers.has(ip)) {
      return true; // 表示需要节流
    }
    
    timers.set(ip, setTimeout(() => {
      timers.delete(ip);
    }, delay));
    
    return false; // 表示不需要节流
  };
};

// 创建节流函数实例，1秒的延迟
const throttle = createThrottle(1000);

export async function middleware(request) {
  // 获取请求信息
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
  
  // 排除本地IP
  if (ip === '127.0.0.1' || ip === '::1') {
    return NextResponse.next();
  }

  // 获取路径
  const path = request.nextUrl.pathname;
  
  // 只记录指定路径
  if (!shouldRecordPath(path)) {
    return NextResponse.next();
  }

  // 使用节流函数检查是否需要记录
  if (throttle(ip)) {
    return NextResponse.next();
  }

  // 获取用户信息
  const token = request.cookies.get('auth-token')?.value;
  let userId = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET)
      );
      userId = payload.id;
    } catch (error) {
      // token无效，继续作为未登录用户处理
    }
  }

  // 异步记录访问信息
  const logData = {
    ip,
    path,
    userAgent: headersList.get('user-agent') || '',
    referer: headersList.get('referer') || '',
    userId,
    timestamp: new Date()
  };

  // 使用fetch发送数据到API
  fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/analytics/visitor`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(logData),
  }).catch(error => {
    console.error('记录访问信息失败:', error);
  });

  return NextResponse.next();
}

// 配置中间件应该运行的路径
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了:
     * - api (API路由)
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (网站图标)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 