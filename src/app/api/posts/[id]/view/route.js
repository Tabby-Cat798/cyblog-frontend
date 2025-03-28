import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// POST 请求增加文章阅览量
export async function POST(request, { params }) {
  try {
    const id = params.id;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: '无效的文章ID' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'blogs');
    
    // 查找文章并增加阅览量
    const result = await db.collection('articles').updateOne(
      { _id: new ObjectId(id) },
      { $inc: { viewCount: 1 } } // 使用 $inc 操作符增加 viewCount 字段的值
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: '文章不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      message: '阅览量更新成功'
    });
  } catch (error) {
    console.error('更新阅览量失败:', error);
    return NextResponse.json(
      { error: '更新阅览量失败' },
      { status: 500 }
    );
  }
} 