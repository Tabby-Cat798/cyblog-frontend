import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// 此路由用于手动触发页面重新验证
export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // 检查安全密钥是否正确（应该与环境变量中设置的匹配）
    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json(
        { error: '无效的重新验证请求' },
        { status: 401 }
      );
    }

    // 获取要重新验证的路径
    const path = searchParams.get('path') || '/';
    
    // 触发重新验证
    revalidatePath(path);

    return NextResponse.json({
      revalidated: true,
      timestamp: Date.now(),
      path
    });
  } catch (error) {
    console.error('重新验证失败:', error);
    return NextResponse.json(
      { 
        revalidated: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// 添加GET方法以支持手动测试
export async function GET(request) {
  return NextResponse.json({
    message: '重新验证API可用。请使用POST请求触发重新验证，并提供正确的secret参数。'
  });
} 