/**
 * RootLayout - Next.js 应用的根布局组件
 * 
 * 这是整个应用的最外层组件，定义了全局的 HTML 结构和配置。
 * 所有页面都会被这个布局包裹，因此这里的配置会应用到整个应用。
 * 
 * 调用链:
 * 1. Next.js 启动时通过约定路由自动发现此文件（文件名必须是 layout.tsx）
 * 2. 用户访问任何页面时，Next.js 会先渲染 RootLayout
 * 3. 然后将对应的 page.tsx 作为 children 注入
 * 4. 最终输出: <RootLayout><Page /></RootLayout>
 */

// ============================================================================
// 导入依赖（显式调用 - 代码中可见）
// ============================================================================

// Next.js 类型定义：用于配置页面元数据（SEO、标题等） node_modules/next/dist/lib/metadata/types/metadata-interface.d.ts
import type { Metadata } from 'next'

// Google 字体加载器：从 Google Fonts 动态加载 Inter 字体
// 自动优化字体加载，减少页面闪烁（FOUT）
import { Inter } from 'next/font/google'

// 全局样式表：包含 Tailwind CSS 指令和自定义样式
// 触发调用链: globals.css -> PostCSS (🔵 隐式：Next.js 自动) -> Tailwind CSS (🔵 隐式：Tailwind 自动查找)
import './globals.css'

// Web3 上下文提供者：提供钱包连接、区块链交互等功能
// 包裹所有子组件，使它们可以访问 Web3 功能（useAccount, useConnect 等 hooks）
import { Providers } from './providers'

// ============================================================================
// 字体配置
// ============================================================================

/**
 * 配置 Inter 字体
 * - subsets: ['latin'] - 只加载拉丁字符集，减小字体文件大小
 * - Next.js 会自动优化字体加载：
 *   1. 在构建时下载字体文件
 *   2. 自托管字体（不依赖 Google CDN）
 *   3. 零布局偏移（CSS font-display: swap）
 */
const inter = Inter({ subsets: ['latin'] })

// ============================================================================
// 页面元数据（用于 SEO 和浏览器显示）
// ============================================================================

/**
 * 元数据配置
 * - title: 显示在浏览器标签页，搜索引擎结果中
 * - description: 显示在搜索引擎结果的描述部分
 * 
 * Next.js 会自动将这些信息注入到 HTML <head> 中：
 * <head>
 *   <title>MiniLender DeFi - 去中心化借贷平台</title>
 *   <meta name="description" content="专为学生设计的去中心化借贷平台" />
 * </head>
 */
export const metadata: Metadata = {
  title: 'MiniLender DeFi - 去中心化借贷平台',
  description: '专为学生设计的去中心化借贷平台',
}

// ============================================================================
// 根布局组件
// ============================================================================

/**
 * RootLayout 组件
 * 
 * @param children - 子页面内容（由 Next.js 自动注入）
 *                   例如：访问 / 时，children 是 page.tsx 的内容
 *                        访问 /about 时，children 是 about/page.tsx 的内容
 * 
 * 组件结构说明:
 * <html lang="zh-CN">               ← 设置页面语言为简体中文（影响搜索引擎和屏幕阅读器）
 *   <body className={...}>          ← 应用 Inter 字体到整个页面
 *     <Providers>                   ← Web3 上下文提供者（提供钱包连接等功能）
 *       {children}                  ← 页面内容（page.tsx）会被插入这里
 *     </Providers>
 *   </body>
 * </html>
 * 
 * 为什么需要 Providers 包裹？
 * - WagmiProvider: 管理 Web3 连接状态（钱包地址、网络等）
 * - QueryClientProvider: 缓存区块链数据，优化性能
 * - 所有子组件都可以通过 React hooks 访问这些功能
 * 
 * 渲染流程:
 * 1. Next.js 匹配路由，找到对应的 page.tsx
 * 2. 先渲染 RootLayout（外壳）
 * 3. 将 page.tsx 作为 children 传入
 * 4. 最终生成完整的 HTML 发送给浏览器
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        {/* 
          Providers 包裹所有内容，提供全局的 Web3 上下文
          这样所有子组件都可以使用 useAccount(), useConnect() 等 hooks
        */}
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}




