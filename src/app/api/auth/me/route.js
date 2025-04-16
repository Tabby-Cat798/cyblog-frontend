import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// 获取环境变量中的密钥或使用默认密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET() {
  try {
    // 获取Cookie
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
      
      // 获取用户ID - 兼容两种可能的字段名
      const userId = payload.userId || payload.id;
      
      if (!userId) {
        return NextResponse.json(
          { error: '无效的令牌 - 缺少用户ID' },
          { status: 401 }
        );
      }
      
      console.log('从JWT解析出用户ID:', userId);
      
      // 从数据库获取最新的用户信息
      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_DB || 'blogs');
      
      const user = await db.collection('users').findOne({
        _id: new ObjectId(userId)
      });
      
      if (!user) {
        return NextResponse.json(
          { error: '用户不存在' },
          { status: 404 }
        );
      }
      
      // 返回用户信息（不包含密码）
      const { password, ...userWithoutPassword } = user;
      
      return NextResponse.json({
        success: true,
        user: userWithoutPassword
      });
    } catch (error) {
      // JWT验证失败
      return NextResponse.json(
        { error: '无效的令牌' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return NextResponse.json(
      { error: '获取用户信息失败', message: error.message },
      { status: 500 }
    );
  }
} 