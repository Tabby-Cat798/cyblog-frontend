import PostDetailClient from "@/components/PostDetailClient";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from 'mongodb';

// 设置 ISR 重新验证时间为 1 小时
export const revalidate = 3600;

// 预生成所有文章页面的静态参数
export async function generateStaticParams() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'blogs');
    const posts = await db.collection('articles').find({ status: 'published' }).toArray();
    
    return posts.map(post => ({
      id: post._id.toString()
    }));
  } catch (error) {
    console.error('生成静态参数失败:', error);
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { id } = params;
  
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'blogs');
    const post = await db.collection('articles').findOne({ _id: new ObjectId(id) });
    
    if (!post) {
      return {
        title: '文章不存在 | CyBlog',
        description: '请求的文章不存在',
      };
    }
    
    return {
      title: `${post.title} | CyBlog`,
      description: post.excerpt || '阅读完整的博客文章内容',
    };
  } catch (error) {
    console.error('获取文章元数据失败:', error);
    return {
      title: '加载失败 | CyBlog',
      description: '获取文章信息失败',
    };
  }
}

export default async function PostDetail(props) {
  const { id } = props.params;
  
  try {
    // 获取初始数据
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'blogs');
    const post = await db.collection('articles').findOne({ _id: new ObjectId(id) });
    
    if (!post) {
      return (
        <main className="container mx-auto px-4 py-8 pt-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">文章不存在</h1>
            <p className="text-gray-600 dark:text-gray-400">您访问的文章不存在或已被删除。</p>
          </div>
        </main>
      );
    }
    
    // 序列化数据
    const initialData = {
      ...post,
      _id: post._id.toString(),
      createdAt: post.createdAt instanceof Date ? post.createdAt.toISOString() : post.createdAt,
      updatedAt: post.updatedAt instanceof Date ? post.updatedAt.toISOString() : post.updatedAt
    };

    return (
      <main className="container mx-auto px-4 py-8 pt-8">
        <PostDetailClient postId={id} initialData={initialData} />
      </main>
    );
  } catch (error) {
    console.error('获取文章数据失败:', error);
    return (
      <main className="container mx-auto px-4 py-8 pt-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">加载失败</h1>
          <p className="text-gray-600 dark:text-gray-400">获取文章数据时发生错误，请稍后重试。</p>
        </div>
      </main>
    );
  }
} 