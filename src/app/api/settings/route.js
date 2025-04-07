import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';

// 获取全局设置
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'blogs');
    
    // 查询设置集合，获取全局设置文档
    const settings = await db.collection('settings').findOne({ _id: 'global' });
    
    // 如果没有找到设置，返回默认设置
    if (!settings) {
      return NextResponse.json({
        articles: {
          defaultShowViewCount: true,
          defaultShowCommentCount: true,
          defaultAllowComments: true
        }
      });
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('获取设置失败:', error);
    return NextResponse.json(
      { error: '获取设置失败' },
      { status: 500 }
    );
  }
}

// 更新全局设置 (需要管理员权限)
export async function PUT(request) {
  try {
    // 验证管理员权限
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: '需要管理员权限' },
        { status: 403 }
      );
    }
    
    const newSettings = await request.json();
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'blogs');
    
    // 更新设置文档，如果不存在则创建
    const result = await db.collection('settings').updateOne(
      { _id: 'global' },
      { $set: newSettings },
      { upsert: true }
    );
    
    // 获取更新后的设置
    const updatedSettings = await db.collection('settings').findOne({ _id: 'global' });
    
    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('更新设置失败:', error);
    return NextResponse.json(
      { error: '更新设置失败' },
      { status: 500 }
    );
  }
} 