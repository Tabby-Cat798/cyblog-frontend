import clientPromise from '../lib/mongodb';
import HomeServer from "@/components/HomeServer";
import AnimatedWelcome from "@/components/AnimatedWelcome";
import Link from "next/link";
import Image from "next/image";

// 设置ISR重新验证时间为1分钟
export const revalidate = 60;

// 从数据库直接获取数据而非通过API
async function getInitialPosts() {
  try {
    // 尝试直接从MongoDB获取数据
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'blogs');
    
    // 获取文章并按创建时间降序排序
    const posts = await db
      .collection('articles')
      .find({ status: 'published' })
      .sort({ createdAt: -1 })
      .limit(9)
      .toArray();
    
    // 获取总文章数
    const total = await db.collection('articles').countDocuments({ status: 'published' });
    
    // 序列化MongoDB对象，确保可以传递给客户端组件
    const serializedPosts = posts.map(post => ({
      ...post,
      _id: post._id.toString(), // 将ObjectId转换为字符串
      createdAt: post.createdAt instanceof Date ? post.createdAt.toISOString() : post.createdAt,
      updatedAt: post.updatedAt instanceof Date ? post.updatedAt.toISOString() : post.updatedAt
    }));
    
    return {
      posts: serializedPosts,
      pagination: {
        total,
        page: 1,
        limit: 9,
        pages: Math.ceil(total / 9)
      }
    };
  } catch (error) {
    console.error('直接获取文章数据失败:', error);
    // 返回空数据
    return {
      posts: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 9,
        pages: 0
      }
    };
  }
}

export default async function Home() {
  // 直接从数据库获取数据，而不是通过API
  const data = await getInitialPosts();
  
  return (
    <main className="container mx-auto px-4 py-8">
      <section className="mb-16 text-center pt-8">
        <h1 className="text-4xl font-bold mb-4">欢迎光临</h1>
        <h1 className="text-4xl font-bold mb-4">Cyril の 博客</h1>
        <div className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto min-h-0 min-h-[4rem]">
          <AnimatedWelcome />
        </div>
      </section>
      
      <section className="mb-16" id="articles">
        <div className="flex justify-between items-center mb-8 pb-2 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold">最新文章</h2>
        </div>
        <HomeServer initialData={data} />
      </section>
    </main>
  );
}
