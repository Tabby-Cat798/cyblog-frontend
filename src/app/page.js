import HomeClient from "@/components/HomeClient";

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">欢迎来到技术博客</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          这里分享关于Web开发、人工智能、数据科学等领域的技术文章与学习心得
        </p>
      </section>
      
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-8 pb-2 border-b border-gray-200 dark:border-gray-700">
          最新文章
        </h2>
        <HomeClient />
      </section>
    </main>
  );
}
