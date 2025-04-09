import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request) {
  try {
    const data = await request.json();
    
    // 基本验证
    if (!data.ip || !data.path) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    // 构建访客记录对象
    const visitorLog = {
      ip: data.ip,
      path: data.path,
      userAgent: data.userAgent || '未知浏览器',
      referer: data.referer || '',
      userId: data.userId || null,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date()
    };
    
    // 连接数据库
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'blogs');
    
    // 插入访客记录
    await db.collection('visitor_logs').insertOne(visitorLog);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('记录访客信息失败:', error);
    return NextResponse.json(
      { error: '内部服务器错误' },
      { status: 500 }
    );
  }
} 