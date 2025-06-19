import PostDetailClient from "@/components/PostDetailClient";
import MarkdownRendererServer from "@/components/MarkdownRendererServer";
import CodeCopyHydrator from "@/components/CodeCopyHydrator";
import TableOfContents from "@/components/TableOfContents";
import CommentSection from "@/components/CommentSection";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from 'mongodb';
import Link from 'next/link';

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
  const { id } = await params;
  
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

// 格式化日期函数
const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    });
  } catch (error) {
    console.error('日期格式化错误:', error);
    return dateString;
  }
};

export default async function PostDetail(props) {
  const { id } = await props.params;
  
  try {
    // 获取文章数据和全局设置
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'blogs');
    
    const [post, settings] = await Promise.all([
      db.collection('articles').findOne({ _id: new ObjectId(id) }),
      db.collection('settings').findOne({})
    ]);
    
    if (!post) {
      return (
        <main className="container mx-auto px-4 py-8 pt-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">文章不存在</h1>
            <p className="text-gray-600 dark:text-gray-400">您访问的文章不存在或已被删除。</p>
            <Link href="/" className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              返回首页
            </Link>
          </div>
        </main>
      );
    }
    
    // 确定是否显示阅读量和评论
    const showViewCount = settings?.articles?.defaultShowViewCount ?? true;
    const allowComments = settings?.articles?.defaultAllowComments ?? true;
    
    const formattedDate = formatDate(post.createdAt);

    return (
      <main className="container mx-auto px-4 py-8 pt-8">
        <article className="max-w-5xl mx-auto pt-8">
          {/* 文章头部 - 服务端渲染 */}
          <header className="flex flex-col items-center text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-6">{post.title}</h1>
            
            <div className="flex flex-wrap justify-center items-center text-gray-600 dark:text-gray-400 mb-6">
              <span className="mr-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{formattedDate}</span>
              </span>
              
              {showViewCount && (
                <span className="mr-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>{post.viewCount || 0} 次阅读</span>
                </span>
              )}
            </div>

            {/* 标签 */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {post.tags.map((tag, index) => (
                  <div
                    key={index}
                    className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-3 py-1 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800"
                  >
                    {tag}
                  </div>
                ))}
              </div>
            )}
          </header>

          {/* 文章主体与目录 */}
          <div className="flex flex-col lg:flex-row gap-10">
            {/* 目录侧边栏 - 客户端渲染 */}
            <TableOfContents content={post.content} />
            
            {/* 文章内容 - 服务端渲染 */}
            <div className="flex-1 prose prose-lg prose-blue dark:prose-invert max-w-none mb-12 pt-0 mt-0">
              <MarkdownRendererServer content={post.content} />
            </div>
          </div>

          {/* 评论区 - 客户端渲染 */}
          {allowComments && <CommentSection postId={id} />}
        </article>
        
        {/* 代码复制功能水合 - 客户端 */}
        <CodeCopyHydrator />
        
        {/* 阅读量更新 - 客户端组件 */}
        <PostDetailClient postId={id} initialData={null} renderMode="viewCountOnly" />
      </main>
    );
  } catch (error) {
    console.error('获取文章数据失败:', error);
    return (
      <main className="container mx-auto px-4 py-8 pt-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">加载失败</h1>
          <p className="text-gray-600 dark:text-gray-400">获取文章数据时发生错误，请稍后重试。</p>
          <Link href="/" className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            返回首页
          </Link>
        </div>
      </main>
    );
  }
} 