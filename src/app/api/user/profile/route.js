import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { uploadToOSS } from "@/lib/ossService";

// 环境变量中获取JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function PATCH(request) {
  try {
    // 获取认证Token
    const cookieStore = await cookies();
    const token = await cookieStore.get("auth-token");

    if (!token) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 验证Token
    const { payload } = await jwtVerify(
      token.value,
      new TextEncoder().encode(JWT_SECRET)
    );

    // 连接数据库
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection("users");

    // 查找用户
    const user = await usersCollection.findOne({
      _id: new ObjectId(payload.id),
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    // 获取表单数据
    const formData = await request.formData();
    const name = formData.get("name");
    
    // 创建更新对象
    const updateData = {
      updatedAt: new Date(),
    };

    // 更新名称
    if (name && name !== user.name) {
      updateData.name = name;
    }

    // 处理头像上传
    const avatar = formData.get("avatar");
    if (avatar && avatar.size > 0) {
      try {
        // 将文件读取为Buffer
        const fileBuffer = await avatar.arrayBuffer();
        
        // 上传到阿里云OSS
        const avatarUrl = await uploadToOSS(
          Buffer.from(fileBuffer), 
          avatar.name, 
          'avatars'
        );
        
        // 更新用户头像URL
        updateData.avatar = avatarUrl;
      } catch (error) {
        console.error("上传头像失败:", error);
        return NextResponse.json({ 
          error: "上传头像失败", 
          message: error.message 
        }, { status: 500 });
      }
    }

    // 更新用户数据
    await usersCollection.updateOne(
      { _id: new ObjectId(payload.id) },
      { $set: updateData }
    );

    // 获取更新后的用户数据
    const updatedUser = await usersCollection.findOne(
      { _id: new ObjectId(payload.id) },
      { projection: { hashedPassword: 0 } }
    );

    return NextResponse.json({
      message: "个人资料已更新",
      user: updatedUser,
    });
  } catch (error) {
    console.error("更新个人资料时出错:", error);
    return NextResponse.json(
      { error: "更新个人资料失败" },
      { status: 500 }
    );
  }
} 