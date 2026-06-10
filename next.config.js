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
  serverExternalPackages: ['pdf-parse', 'mammoth', '@vercel/kv'],
}
module.exports = nextConfig
