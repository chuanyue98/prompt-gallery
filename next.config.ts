import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // Vercel 推荐模式 (或者不写，Next.js 会自动识别)
  images: {
    unoptimized: true,
  },
  // 移除 basePath 和 assetPrefix，因为 Vercel 默认部署在根路径
};

export default nextConfig;
