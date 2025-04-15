import { NextResponse } from 'next/server';

// 此路由用于手动触发页面重新验证
export async function POST(request) {
  try {
    // 验证请求来源
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.REVALIDATE_TOKEN}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { path, postId } = await request.json();

    // 重新验证首页
    await NextResponse.revalidate('/');
    
    // 如果提供了文章ID，重新验证该文章
    if (postId) {
      await NextResponse.revalidate(`/posts/${postId}`);
    }

    return new Response('Revalidation successful', { status: 200 });
  } catch (error) {
    console.error('重新验证失败:', error);
    return new Response('Revalidation failed', { status: 500 });
  }
}

// 添加GET方法以支持手动测试
export async function GET(request) {
  return NextResponse.json({
    message: '重新验证API可用。请使用POST请求触发重新验证，并提供正确的secret参数。'
  });
} 