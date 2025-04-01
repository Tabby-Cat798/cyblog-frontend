/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      domains: ['cyblog-images.oss-cn-beijing.aliyuncs.com'],
      // 可选：配置图像优化
      formats: ['image/webp'],
    },
    // 添加外部包配置，处理MongoDB库
    experimental: {
      serverComponentsExternalPackages: ['mongodb'],
    },
    // 允许在构建期间出错时继续构建而不是中断
    onDemandEntries: {
      // 服务器保持页面在内存中的时间（毫秒）
      maxInactiveAge: 60 * 1000,
      // 同时保持在内存中的页面数
      pagesBufferLength: 5,
    },
  };
  
  export default nextConfig;
  