import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // 获取Cookie存储
    const cookieStore = await cookies();
    
    // 删除认证Cookie
    await cookieStore.delete('auth-token');
    
    return NextResponse.json({
      success: true,
      message: '已成功退出登录'
    });
  } catch (error) {
    console.error('退出登录失败:', error);
    return NextResponse.json(
      { error: '退出登录失败', message: error.message },
      { status: 500 }
    );
  }
} 