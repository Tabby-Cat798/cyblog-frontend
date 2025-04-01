import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// 环境变量中获取JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function PATCH(request) {
  try {
    // 获取认证Token
    const cookieStore = cookies();
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

    // 获取请求数据
    const requestData = await request.json();
    const { currentPassword, newPassword } = requestData;

    // 验证当前密码
    if (!bcrypt.compareSync(currentPassword, user.hashedPassword)) {
      return NextResponse.json({ error: "当前密码不正确" }, { status: 400 });
    }

    // 验证新密码长度
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "新密码长度不能小于6位" },
        { status: 400 }
      );
    }

    // 生成新密码的哈希值
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(newPassword, salt);

    // 更新用户密码
    await usersCollection.updateOne(
      { _id: new ObjectId(payload.id) },
      {
        $set: {
          hashedPassword: hashedPassword,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      message: "密码已成功更新",
    });
  } catch (error) {
    console.error("更新密码时出错:", error);
    return NextResponse.json({ error: "更新密码失败" }, { status: 500 });
  }
} 