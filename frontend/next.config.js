/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    webpack: (config) => {
      config.resolve.fallback = {  /**Fallback = "备用方案" = 当 Webpack 找不到某个模块时，该怎么办？ */
        ...config.resolve.fallback,
        fs: false,  // "找不到 fs 模块？忽略它！"
        net: false, // "找不到 net 模块？忽略它！"
        tls: false,  // "找不到 tls 模块？忽略它！"
      };
      return config;
    },
  };
  
module.exports = nextConfig; // 把 nextConfig 对象导出，让 Next.js 能够读取和使用这个配置。
  
/**
 * Next.js 是一个框架
  ├─ 安装在：node_modules/next/
  ├─ 通过命令使用：next dev
  └─ 通过配置控制：next.config.js
 * 
 */
  
  
  