import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb';

// 获取环境变量中的密钥或使用默认密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // 验证必要字段
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: '邮箱和密码不能为空' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'blogs');
    
    // 查找用户
    const user = await db.collection('users').findOne({ 
      email: body.email 
    });
    
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }
    
    // 检查是否为仅GitHub账号（无密码）
    if (user.github && (!user.password && !user.hashedPassword)) {
      return NextResponse.json(
        { error: '此邮箱已通过GitHub账号注册，请使用GitHub登录', githubUser: true },
        { status: 401 }
      );
    }
    
    // 确定使用哪个密码字段
    const passwordField = user.hashedPassword || user.password;
    
    // 如果没有密码字段，无法继续
    if (!passwordField) {
      return NextResponse.json(
        { error: '此账号未设置密码，请使用其他方式登录', githubUser: !!user.github },
        { status: 401 }
      );
    }
    
    // 验证密码
    const isPasswordValid = bcrypt.compareSync(body.password, passwordField);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '密码错误' },
        { status: 401 }
      );
    }
    
    // 更新最后登录时间
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );
    
    // 创建JWT令牌
    const token = await new SignJWT({ 
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(new TextEncoder().encode(JWT_SECRET));
    
    // 设置Cookie
    const cookieStore = await cookies();
    await cookieStore.set('auth-token', token, { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15768000, // 24小时
      path: '/'
    });
    
    // 返回用户信息（不包含密码）
    const { password, hashedPassword, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      success: true,
      message: '登录成功',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('登录失败:', error);
    return NextResponse.json(
      { error: '登录失败', message: error.message },
      { status: 500 }
    );
  }
} 