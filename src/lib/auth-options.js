import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { jwtVerify } from 'jose';

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-jwt-secret-key';

// NextAuth的authOptions配置
export const authOptions = {
  // 这里可以根据需要添加各种认证提供者
  providers: [],
  callbacks: {
    async session({ session, token }) {
      try {
        // 获取JWT令牌
        const cookieStore = cookies();
        const authToken = cookieStore.get('auth-token');
        
        if (authToken) {
          // 验证JWT
          const { payload } = await jwtVerify(
            authToken.value,
            new TextEncoder().encode(JWT_SECRET)
          );
          
          // 使用ID查询用户
          const client = await clientPromise;
          const db = client.db(process.env.MONGODB_DB || 'blogs');
          
          const user = await db.collection('users').findOne({
            _id: new ObjectId(payload.id)
          });
          
          if (user) {
            // 更新session中的用户信息
            session.user = {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              avatar: user.avatar,
              role: user.role || 'user'
            };
          }
        }
        
        return session;
      } catch (error) {
        console.error('Session callback error:', error);
        return session;
      }
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30天
  }
};

// 从JWT令牌获取用户
export async function getUserFromToken(token) {
  try {
    if (!token) return null;
    
    // 验证JWT
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET)
    );
    
    // 使用ID查询用户
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'blogs');
    
    const user = await db.collection('users').findOne({
      _id: new ObjectId(payload.id)
    });
    
    if (!user) return null;
    
    // 移除敏感信息
    const { password, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      _id: userWithoutPassword._id.toString(),
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export default authOptions; 