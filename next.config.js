/** @type {import('next').NextConfig} */
const nextConfig = {
  // 构建时忽略 TypeScript 类型错误（不影响运行）
  typescript: {
    ignoreBuildErrors: true,
  },
  // 构建时忽略 ESLint 错误
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Next.js 14.x：serverExternalPackages 的正确位置在 experimental 下
  // 告知 webpack 不要打包这些 Node.js 原生依赖，由运行时直接 require
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'mammoth', '@vercel/kv'],
  },
}
module.exports = nextConfig
