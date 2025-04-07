/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'cyblog-images.oss-cn-beijing.aliyuncs.com',
          port: '',
          pathname: '/**',
        },
        {
          protocol: 'https',
          hostname: 'ui-avatars.com',
          port: '',
          pathname: '/**',
        },
        {
          protocol: 'https',
          hostname: 'avatars.githubusercontent.com',
          port: '',
          pathname: '/**',
        },
      ],
      formats: ['image/webp'],
    },
    allowedDevOrigins: ['127.0.0.1', 'localhost'],
    serverExternalPackages: ['mongodb'],
    onDemandEntries: {
      maxInactiveAge: 60 * 1000,
      pagesBufferLength: 5,
    },
  };
  
  export default nextConfig;
  