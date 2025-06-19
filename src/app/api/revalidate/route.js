import { NextResponse } from 'next/server';

// 此路由在CSR模式下不再需要，但保留以避免404错误
export async function POST(request) {
  return NextResponse.json({
    message: '当前使用CSR模式，不需要手动重新验证',
    mode: 'CSR',
    timestamp: Date.now()
  });
}

// 添加GET方法以支持手动测试
export async function GET(request) {
  return NextResponse.json({
    message: '当前使用CSR模式，不需要手动重新验证',
    mode: 'CSR',
    timestamp: Date.now()
  });
} 