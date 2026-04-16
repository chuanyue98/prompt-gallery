import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // 启用静态导出
  images: {
    unoptimized: true, // 静态导出必须关闭图片优化
  },
  // 如果你的仓库名是 prompt-gallery，请取消下面两行的注释
  // basePath: '/prompt-gallery',
  // assetPrefix: '/prompt-gallery',
};

export default nextConfig;
