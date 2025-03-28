import PostDetailClient from "@/components/PostDetailClient";

export const metadata = {
  title: '文章详情 | 技术博客',
  description: '阅读完整的博客文章内容',
};

export default function PostDetail({ params }) {
  const { id } = params;
  
  return (
    <main className="container mx-auto px-4 py-8">
      <PostDetailClient postId={id} />
    </main>
  );
} 