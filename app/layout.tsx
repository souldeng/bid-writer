import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "标智 BidAI · 政务申报标书智能生成",
  description: "专注数字资源体系建设领域的政务申报标书智能生成平台",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@600;700&family=Noto+Sans+SC:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
