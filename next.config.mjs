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
        {
          protocol: 'http',
          hostname: 'images.cyblog.fun',
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
    webpack: (config, { isServer }) => {
      // 添加别名，将coffee-script指向coffeescript
      config.resolve.alias['coffee-script'] = 'coffeescript';
      return config;
    },
  };
  
  export default nextConfig;
  