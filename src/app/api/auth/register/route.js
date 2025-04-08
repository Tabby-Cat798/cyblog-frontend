import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import clientPromise from '@/lib/mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // 验证必要字段
    if (!body.email || !body.password || !body.name) {
      return NextResponse.json(
        { error: '邮箱、密码和昵称不能为空' },
        { status: 400 }
      );
    }
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: '邮箱格式不正确' },
        { status: 400 }
      );
    }
    
    // 验证密码长度
    if (body.password.length < 6) {
      return NextResponse.json(
        { error: '密码长度不能少于6个字符' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'blogs');
    
    // 检查邮箱是否已注册
    const existingUser = await db.collection('users').findOne({ 
      email: body.email 
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: '该邮箱已被注册' },
        { status: 409 }
      );
    }
    
    // 检查用户名是否已存在
    const existingUsername = await db.collection('users').findOne({
      name: body.name
    });
    
    if (existingUsername) {
      return NextResponse.json(
        { error: '该用户名已被使用' },
        { status: 409 }
      );
    }
    
    // 哈希密码
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(body.password, salt);
    
    // 创建用户
    const now = new Date();
    const user = {
      email: body.email,
      name: body.name,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
      role: 'user', // 默认角色
      // 使用ui-avatars.com服务生成默认头像，但直接请求不通过Next.js的Image组件
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(body.name)}&background=random&size=256`, 
      isVerified: false, // 邮箱验证状态
      lastLogin: null,
      status: 'active' // 用户状态：active(正常), inactive(禁用)
    };
    
    const result = await db.collection('users').insertOne(user);
    
    // 返回用户信息（不包含密码）
    const { password, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      success: true,
      message: '注册成功',
      user: {
        ...userWithoutPassword,
        _id: result.insertedId
      }
    }, { status: 201 });
  } catch (error) {
    console.error('注册失败:', error);
    return NextResponse.json(
      { error: '注册失败', message: error.message },
      { status: 500 }
    );
  }
} 