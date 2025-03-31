/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      domains: ['cyblog-images.oss-cn-beijing.aliyuncs.com'],
      // 可选：配置图像优化
      formats: ['image/webp'],
    },
  };
  
  export default nextConfig;
  