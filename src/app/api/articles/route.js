// api/articles/route.js
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: '标题和内容不能为空' },
        { status: 400 }
      );
    }
    
    const now = new Date();
    const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    
    const article = {
      title: body.title,
      summary: body.summary || '',
      tags: body.tags || [],
      content: body.content,
      viewCount: body.viewCount || 0,
      status: body.status || 'published',
      createdAt: beijingTime
    };
    
    const client = await clientPromise;
    const db = client.db('blogs');
    const result = await db.collection('articles').insertOne(article);
    
    return NextResponse.json({
      success: true,
      message: '文章发布成功',
      articleId: result.insertedId
    }, { status: 201 });
    
  } catch (error) {
    console.error('发布文章失败:', error);
    return NextResponse.json(
      { error: '发布文章失败', message: error.message },
      { status: 500 }
    );
  }
}