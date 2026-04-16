import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // 启用静态导出
  images: {
    unoptimized: true, // 静态导出必须关闭图片优化
  },
  // 针对 GitHub Pages 路径进行配置
  basePath: '/prompt-gallery',
  assetPrefix: '/prompt-gallery',
};

export default nextConfig;
