import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { SignJWT } from 'jose';
import { ObjectId } from 'mongodb';

// 环境变量获取
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_SITE_URL + '/api/auth/github/callback';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const PROXY_SERVICE_URL = process.env.GITHUB_PROXY_SERVICE_URL; // 国外代理服务URL

// GitHub登录初始化 - 通过代理生成授权URL
export async function GET() {
  try {
    // 检查GitHub配置
    if (!CLIENT_ID) {
      return NextResponse.json(
        { error: 'GitHub OAuth配置不完整' },
        { status: 500 }
      );
    }

    // 检查代理服务配置
    if (!PROXY_SERVICE_URL) {
      return NextResponse.json(
        { error: '代理服务配置不完整' },
        { status: 500 }
      );
    }

    // 生成随机state防止CSRF攻击
    const state = Math.random().toString(36).substring(2, 15);
    
    // 将state存储在cookie中，用于后续验证
    const cookieStore = await cookies();
    await cookieStore.set('github-oauth-state', state, { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 600, // 10分钟
      path: '/'
    });
    
    // 构建GitHub授权URL (与普通方式相同)
    const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
    githubAuthUrl.searchParams.append('client_id', CLIENT_ID);
    githubAuthUrl.searchParams.append('redirect_uri', REDIRECT_URI);
    githubAuthUrl.searchParams.append('state', state);
    githubAuthUrl.searchParams.append('scope', 'read:user user:email');

    return NextResponse.json({ 
      success: true,
      authUrl: githubAuthUrl.toString(),
      useProxy: true
    });
  } catch (error) {
    console.error('GitHub登录初始化失败:', error);
    return NextResponse.json(
      { error: '登录初始化失败', message: error.message },
      { status: 500 }
    );
  }
}

// 通过代理处理GitHub回调
export async function POST(request) {
  try {
    const { code, state } = await request.json();
    
    console.log('GitHub代理回调处理开始 - 收到code和state:', { codeLength: code?.length, state });
    
    // 验证state以防止CSRF攻击
    const cookieStore = await cookies();
    const storedState = await cookieStore.get('github-oauth-state');
    
    console.log('验证state:', { 
      storedState: storedState?.value,
      receivedState: state,
      isValid: storedState && storedState.value === state 
    });
    
    if (!storedState || storedState.value !== state) {
      return NextResponse.json(
        { error: '无效的状态参数，可能是CSRF攻击' },
        { status: 400 }
      );
    }
    
    // 清除state cookie
    await cookieStore.delete('github-oauth-state');
    
    // 使用代理服务请求GitHub访问令牌
    console.log('开始通过代理服务获取GitHub访问令牌...');
    const proxyTokenUrl = `${PROXY_SERVICE_URL}/token`;
    const tokenResponse = await fetch(proxyTokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI
      })
    });
    
    const tokenData = await tokenResponse.json();
    console.log('获取GitHub访问令牌结果:', { 
      success: !tokenData.error, 
      hasToken: !!tokenData.access_token,
      error: tokenData.error
    });
    
    if (tokenData.error || !tokenData.access_token) {
      return NextResponse.json(
        { error: '获取GitHub访问令牌失败', message: tokenData.error_description },
        { status: 400 }
      );
    }
    
    const accessToken = tokenData.access_token;
    
    // 通过代理服务获取用户信息
    console.log('开始通过代理服务获取GitHub用户资料...');
    const proxyUserUrl = `${PROXY_SERVICE_URL}/user`;
    const userResponse = await fetch(proxyUserUrl, {
      method: 'GET',
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    const userData = await userResponse.json();
    console.log('GitHub用户资料:', { 
      id: userData.id,
      login: userData.login,
      name: userData.name,
      avatar: userData.avatar_url 
    });
    
    if (!userData || !userData.id) {
      return NextResponse.json(
        { error: '获取GitHub用户信息失败' },
        { status: 400 }
      );
    }
    
    // 通过代理服务获取用户邮箱
    console.log('开始通过代理服务获取GitHub用户邮箱...');
    const proxyEmailsUrl = `${PROXY_SERVICE_URL}/emails`;
    const emailsResponse = await fetch(proxyEmailsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    const emailsData = await emailsResponse.json();
    const primaryEmail = emailsData.find(email => email.primary && email.verified)?.email || userData.email;
    console.log('GitHub用户邮箱:', { 
      primaryEmail,
      emailsCount: emailsData.length,
      allEmails: emailsData.map(e => ({ email: e.email, primary: e.primary, verified: e.verified }))
    });
    
    if (!primaryEmail) {
      return NextResponse.json(
        { error: '未能获取GitHub验证邮箱' },
        { status: 400 }
      );
    }
    
    // 以下数据库操作与常规GitHub登录相同
    // 连接数据库
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'blogs');
    const usersCollection = db.collection('users');
    
    // 查找是否已存在GitHub关联的账户
    let user = await usersCollection.findOne({
      'github.id': userData.id.toString()
    });
    
    console.log('数据库查询用户 - GitHub ID:', { 
      githubId: userData.id.toString(),
      userFound: !!user 
    });
    
    // 如果没有找到GitHub关联的账户，尝试通过邮箱查找
    if (!user) {
      user = await usersCollection.findOne({
        email: primaryEmail
      });
      console.log('数据库查询用户 - 邮箱:', { 
        email: primaryEmail,
        userFound: !!user 
      });
    }
    
    const now = new Date();
    
    // 如果用户存在，更新GitHub信息
    if (user) {
      console.log('更新现有用户的GitHub信息', { 
        userId: user._id.toString(),
        name: user.name 
      });
      
      await usersCollection.updateOne(
        { _id: user._id },
        {
          $set: {
            github: {
              id: userData.id.toString(),
              username: userData.login,
              name: userData.name,
              avatar: userData.avatar_url
            },
            lastLogin: now,
            updatedAt: now
          }
        }
      );
    } else {
      // 创建新用户
      console.log('创建新用户账户');
      
      // 提取显示名称（优先使用GitHub姓名，其次是用户名）
      const displayName = userData.name || userData.login;
      
      user = {
        name: displayName,
        email: primaryEmail,
        role: 'user',
        github: {
          id: userData.id.toString(),
          username: userData.login,
          name: userData.name,
          avatar: userData.avatar_url
        },
        avatar: userData.avatar_url,
        createdAt: now,
        updatedAt: now,
        lastLogin: now
      };
      
      const result = await usersCollection.insertOne(user);
      user._id = result.insertedId;
    }
    
    // 生成JWT令牌
    console.log('为用户生成认证令牌');
    
    const expires = new Date();
    expires.setDate(expires.getDate() + 7); // 7天过期
    
    const token = await new SignJWT({ 
      userId: user._id.toString(),
      role: user.role || 'user'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expires.getTime() / 1000)
      .sign(new TextEncoder().encode(JWT_SECRET));
    
    // 设置认证Cookie
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires,
      path: '/',
      sameSite: 'lax'
    });
    
    console.log('认证Cookie已设置');
    
    // 返回用户信息（不包含敏感数据）
    const { password, ...userWithoutPassword } = user;
    
    console.log('GitHub代理登录成功，返回用户信息', {
      id: userWithoutPassword._id.toString(),
      name: userWithoutPassword.name,
      email: userWithoutPassword.email,
      role: userWithoutPassword.role,
      avatar: userWithoutPassword.avatar
    });
    
    return NextResponse.json({
      success: true,
      message: 'GitHub登录成功',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('GitHub代理登录处理失败:', error);
    return NextResponse.json(
      { error: '登录处理失败', message: error.message },
      { status: 500 }
    );
  }
} 