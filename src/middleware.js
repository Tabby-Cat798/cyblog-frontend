import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { headers } from 'next/headers';

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

// 用于存储最近访问的IP和时间
const recentVisits = new Map();

// 清理过期记录的函数
function cleanupOldRecords() {
  const now = Date.now();
  for (const [ip, data] of recentVisits.entries()) {
    if (now - data.timestamp > 1000) { // 1秒后清理记录
      recentVisits.delete(ip);
    }
  }
}

export async function middleware(request) {
  // 获取请求信息
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
  
  // 排除本地IP
  if (ip === '127.0.0.1' || ip === '::1') {
    return NextResponse.next();
  }

  // 排除不需要记录的路径
  const path = request.nextUrl.pathname;
  if (
    path.startsWith('/api') ||
    path.startsWith('/_next') ||
    path.startsWith('/static') ||
    path.includes('.')
  ) {
    return NextResponse.next();
  }

  // 检查是否是预渲染请求
  const now = Date.now();
  const recentVisit = recentVisits.get(ip);

  // 如果是根路径访问，记录时间
  if (path === '/') {
    recentVisits.set(ip, { timestamp: now });
    cleanupOldRecords();
  } 
  // 如果不是根路径，检查是否在时间窗口内
  else if (recentVisit && now - recentVisit.timestamp < 500) {
    return NextResponse.next();
  }

  // 获取用户信息
  const token = request.cookies.get('token')?.value;
  let userId = null;
  let userName = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET)
      );
      if (payload && payload.id && payload.name) {
        userId = payload.id;
        userName = payload.name;
      }
    } catch (error) {
      console.error('Token验证失败:', error);
    }
  }

  // 异步记录访问信息
  const logData = {
    ip,
    path,
    userAgent: headersList.get('user-agent') || '',
    referer: headersList.get('referer') || '',
    userId,
    userName,
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