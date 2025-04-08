import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// 环境变量中获取JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 获取文章评论列表
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    
    if (!postId) {
      return NextResponse.json(
        { error: '缺少文章ID参数' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'blogs');
    
    // 查询评论并按时间降序排列
    const comments = await db.collection('comments')
      .find({ postId })
      .sort({ createdAt: -1 })
      .toArray();
    
    // 查询用户信息并关联到评论 - 使用聚合所有用户ID以减少数据库查询
    const userIds = [...new Set(comments
      .filter(comment => comment.userId)
      .map(comment => comment.userId))];
    
    const users = {};
    if (userIds.length > 0) {
      const usersData = await db.collection('users')
        .find({
          _id: { $in: userIds.map(id => new ObjectId(id)) }
        })
        .project({ name: 1, avatar: 1, role: 1 })
        .toArray();
      
      // 创建用户ID到用户信息的映射
      usersData.forEach(user => {
        users[user._id.toString()] = {
          name: user.name,
          avatar: user.avatar,
          role: user.role || 'user'
        };
      });
    }
    
    // 为每个评论附加用户信息
    comments.forEach(comment => {
      if (comment.userId && users[comment.userId]) {
        comment.user = users[comment.userId];
      }
    });
    
    return NextResponse.json(comments);
  } catch (error) {
    console.error('获取评论失败:', error);
    return NextResponse.json(
      { error: '获取评论失败' },
      { status: 500 }
    );
  }
}

// 发表评论
export async function POST(request) {
  try {
    // 验证用户身份
    const cookieStore = await cookies();
    const token = await cookieStore.get('auth-token');
    
    if (!token) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }
    
    try {
      // 验证JWT
      const { payload } = await jwtVerify(
        token.value,
        new TextEncoder().encode(JWT_SECRET)
      );
      
      // 获取用户ID
      const userId = payload.id;
      
      if (!userId) {
        return NextResponse.json(
          { error: '无效的令牌' },
          { status: 401 }
        );
      }
      
      const body = await request.json();
      
      // 验证必要字段
      if (!body.postId || !body.content) {
        return NextResponse.json(
          { error: '评论内容和文章ID不能为空' },
          { status: 400 }
        );
      }
      
      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_DB || 'blogs');
      
      // 查找用户确认存在
      const user = await db.collection('users').findOne({
        _id: new ObjectId(userId)
      });
      
      if (!user) {
        return NextResponse.json(
          { error: '用户不存在' },
          { status: 404 }
        );
      }
      
      // 检查用户状态，如果是inactive则不允许发表评论
      if (user.status === 'inactive') {
        return NextResponse.json(
          { error: '您的账号已被禁用，无法发表评论' },
          { status: 403 }
        );
      }
      
      const now = new Date();
      
      // 创建评论对象 - 只存储用户ID引用
      const comment = {
        postId: body.postId,
        content: body.content,
        userId: userId,  // 只存储用户ID，不存储冗余信息
        parentId: body.parentId || null, // 如果有parentId，则是回复评论
        createdAt: now,
        updatedAt: now,
        status: 'published', // 评论状态：published, pending, rejected
        likes: 0
      };
      
      const result = await db.collection('comments').insertOne(comment);
      
      // 返回评论，并附带用户基本信息用于前端显示
      return NextResponse.json({
        success: true,
        message: '评论发布成功',
        comment: {
          ...comment,
          _id: result.insertedId,
          user: {
            name: user.name,
            avatar: user.avatar
          }
        }
      }, { status: 201 });
      
    } catch (error) {
      // JWT验证失败
      return NextResponse.json(
        { error: '无效的认证信息' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('发表评论失败:', error);
    return NextResponse.json(
      { error: '发表评论失败', message: error.message },
      { status: 500 }
    );
  }
} 