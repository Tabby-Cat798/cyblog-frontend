import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// 获取单个评论
export async function GET(request, props) {
  const params = await props.params;
  try {
    const id = params.id;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: '无效的评论ID' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'blogs');
    
    const comment = await db.collection('comments').findOne({
      _id: new ObjectId(id)
    });
    
    if (!comment) {
      return NextResponse.json(
        { error: '评论不存在' },
        { status: 404 }
      );
    }
    
    // 如果评论有用户ID，查询用户信息
    if (comment.userId) {
      const user = await db.collection('users')
        .findOne(
          { _id: new ObjectId(comment.userId) },
          { projection: { name: 1, avatar: 1 } } // 只获取必要的字段
        );
      
      if (user) {
        comment.user = {
          name: user.name,
          avatar: user.avatar
        };
      }
    }
    
    return NextResponse.json(comment);
  } catch (error) {
    console.error('获取评论详情失败:', error);
    return NextResponse.json(
      { error: '获取评论详情失败' },
      { status: 500 }
    );
  }
}

// 更新评论
export async function PATCH(request, props) {
  const params = await props.params;
  try {
    const id = params.id;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: '无效的评论ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    if (!body.content) {
      return NextResponse.json(
        { error: '评论内容不能为空' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'blogs');
    
    // 更新评论
    const result = await db.collection('comments').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          content: body.content,
          updatedAt: new Date()
        } 
      }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: '评论不存在' },
        { status: 404 }
      );
    }
    
    // 获取更新后的评论
    const updatedComment = await db.collection('comments').findOne({
      _id: new ObjectId(id)
    });
    
    // 添加用户信息
    if (updatedComment.userId) {
      const user = await db.collection('users')
        .findOne(
          { _id: new ObjectId(updatedComment.userId) },
          { projection: { name: 1, avatar: 1 } }
        );
      
      if (user) {
        updatedComment.user = {
          name: user.name,
          avatar: user.avatar
        };
      }
    }
    
    return NextResponse.json({
      success: true,
      message: '评论已更新',
      comment: updatedComment
    });
  } catch (error) {
    console.error('更新评论失败:', error);
    return NextResponse.json(
      { error: '更新评论失败' },
      { status: 500 }
    );
  }
}

// 删除评论
export async function DELETE(request, props) {
  const params = await props.params;
  try {
    const id = params.id;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: '无效的评论ID' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'blogs');
    
    // 删除评论
    const result = await db.collection('comments').deleteOne({
      _id: new ObjectId(id)
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: '评论不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: '评论已删除'
    });
  } catch (error) {
    console.error('删除评论失败:', error);
    return NextResponse.json(
      { error: '删除评论失败' },
      { status: 500 }
    );
  }
} 