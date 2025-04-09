import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// 哪些路径不需要记录访问
const EXCLUDED_PATHS = [
  '/api/',
  '/_next/',
  '/favicon.ico',
  '/images/',
  '/robots.txt',
  '/sitemap.xml'
];

// 检查是否应该跳过记录特定路径
function shouldExcludePath(path) {
  return EXCLUDED_PATHS.some(prefix => path.startsWith(prefix));
}

export async function middleware(request) {
  const path = request.nextUrl.pathname;
  
  // 跳过不需要记录的路径
  if (shouldExcludePath(path)) {
    return NextResponse.next();
  }
  
  // 获取IP地址（考虑代理服务器的情况）
  let ip = request.headers.get('x-forwarded-for') || request.ip || '未知IP';
  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }
  
  // 获取用户代理
  const userAgent = request.headers.get('user-agent') || '未知浏览器';
  
  // 获取来源页面
  const referer = request.headers.get('referer') || '';
  
  // 尝试从cookie中获取用户信息
  let userId = null;
  let userName = null;
  
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (token) {
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(JWT_SECRET)
      );
      
      userId = payload.id;
      userName = payload.name;
    }
  } catch (error) {
    // 如果token无效，继续但不记录用户信息
    console.error('访客记录中间件 - JWT验证失败:', error.message);
  }
  
  // 异步记录访问，但不等待其完成，避免影响性能
  fetch(`${request.nextUrl.origin}/api/analytics/visitor`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ip,
      path,
      userAgent,
      referer,
      userId,
      userName,
      timestamp: new Date().toISOString()
    }),
  }).catch(error => {
    console.error('访客记录中间件 - 记录访问失败:', error);
  });
  
  // 继续请求
  return NextResponse.next();
}

// 配置中间件应该运行的路径
export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了以下路径:
     * - api 路由 (/api/*)
     * - 静态文件 (/_next/static/*, /_next/image/*)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 