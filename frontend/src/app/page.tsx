/**
 * Home Page - MiniLender DeFi 主页 
 * 
 * 这是应用的首页，显示欢迎信息和项目介绍
 * 
 * 调用链:
 * 1. 用户访问 / 路径
 * 2. Next.js 自动加载此 page.tsx（通过约定式路由）(🔵 隐式：TypeScript 编译器)
 * 3. 通过 layout.tsx 的 Providers 包裹，提供 Web3 功能
 * 
 * 为什么使用 'use client'？
 * - 这是 Next.js 13+ 的客户端组件标记
 * - 虽然当前页面是静态的，但标记为客户端组件是为了：
 *   1. 与 layout.tsx 中的 Providers（客户端组件）兼容
 *   2. 未来可能需要添加交互功能（钱包连接、状态管理等）
 *   3. 保持组件树的一致性（父组件 Providers 是客户端组件）
 */

'use client'

// ============================================================================
// 主页组件
// ============================================================================

/**
 * Home 组件 - 应用主页
 * 
 * 页面结构：
 * <main>                         ← 全屏容器，渐变背景
 *   <div>                        ← 内容卡片，白色背景
 *     <div>标题部分</div>         ← 项目标题和描述
 *     <div>分隔线</div>           ← 视觉分隔
 *     <div>欢迎信息</div>         ← 欢迎横幅
 *     <div>特性网格</div>         ← 三个特性卡片（安全、快速、去中心化）
 *     <div>状态指示</div>         ← 应用就绪状态
 *   </div>
 * </main>
 * 
 * 设计原则：
 * - 响应式布局：移动端单列，桌面端多列
 * - 现代化 UI：使用渐变、圆角、阴影
 * - 清晰的视觉层次：通过字体大小、颜色、间距区分内容重要性
 */
export default function Home() {
  // ============================================================================
  // 渲染
  // ============================================================================
  return (
    // 主容器
    // - min-h-screen: 最小高度为视口高度（确保全屏显示）
    // - bg-gradient-to-br: 从左上到右下的渐变背景
    // - from-blue-50 to-indigo-100: 浅蓝色到浅靛蓝色渐变（柔和的背景）
    // - flex items-center justify-center: Flexbox 居中布局（水平和垂直）
    // - p-4: 内边距 1rem（防止内容贴边）
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* 
        内容卡片容器
        - max-w-4xl: 最大宽度 56rem（保持内容可读性，不会太宽）
        - w-full: 宽度 100%（在小屏幕上占满可用空间）
        - bg-white: 白色背景（与渐变背景形成对比）
        - rounded-2xl: 大圆角 1rem（现代化设计）
        - shadow-2xl: 超大阴影（增强卡片的立体感）
        - p-8 md:p-12: 内边距，移动端 2rem，桌面端 3rem（响应式间距）
      */}
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
        
        {/* ====================================================================
            标题部分
            ==================================================================== */}
        {/* 
          标题容器
          - text-center: 文本居中对齐
          - mb-8: 下边距 2rem（与下方内容分离）
        */}
        <div className="text-center mb-8">
          {/* 
            主标题
            - text-4xl md:text-6xl: 字体大小，移动端 2.25rem，桌面端 3.75rem
            - font-bold: 字体粗细 700（醒目的标题）
            - text-gray-900: 深灰色（#111827，接近黑色但更柔和）
            - mb-4: 下边距 1rem
          */}
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            MiniLender DeFi
          </h1>
          
          {/* 
            副标题 1 - 平台类型
            - text-xl md:text-2xl: 字体大小，移动端 1.25rem，桌面端 1.5rem
            - text-gray-600: 中等灰色（#4B5563，比主标题浅，形成层次）
            - mb-2: 下边距 0.5rem
          */}
          <p className="text-xl md:text-2xl text-gray-600 mb-2">
            去中心化借贷平台
          </p>
          
          {/* 
            副标题 2 - 目标用户
            - text-lg: 字体大小 1.125rem
            - text-gray-500: 浅灰色（#6B7280，最浅的文字，优先级最低）
          */}
          <p className="text-lg text-gray-500">
            专为学生设计的区块链金融服务
          </p>
        </div>

        {/* ====================================================================
            分隔线
            ==================================================================== */}
        {/* 
          水平分隔线
          - border-t: 顶部边框
          - border-gray-200: 边框颜色浅灰色（#E5E7EB，不抢眼）
          - my-8: 上下边距各 2rem（与上下内容分离）
        */}
        <div className="border-t border-gray-200 my-8"></div>

        {/* ====================================================================
            欢迎信息和特性展示
            ==================================================================== */}
        {/* 
          欢迎信息容器
          - space-y-4: 子元素之间垂直间距 1rem（统一间距）
          - text-center: 文本居中对齐
        */}
        <div className="space-y-4 text-center">
          
          {/* 欢迎横幅 */}
          {/* 
            - bg-blue-50: 浅蓝色背景（#EFF6FF，柔和的强调色）
            - border border-blue-200: 蓝色边框（#BFDBFE，与背景搭配）
            - rounded-lg: 圆角 0.5rem（柔和的边缘）
            - p-6: 内边距 1.5rem
          */}
        

          {/* 
            特性网格容器
            - grid: CSS Grid 布局
            - md:grid-cols-3: 桌面端 3 列，移动端 1 列（响应式布局）
            - gap-4: 网格间距 1rem
            - mt-8: 上边距 2rem（与欢迎横幅分离）
          */}
          <div className="grid md:grid-cols-3 gap-4 mt-8">
            
            {/* ================================================================
                特性卡片 1：安全可靠
                ================================================================ */}
            {/* 
              - bg-gradient-to-br: 从左上到右下的渐变
              - from-purple-50 to-purple-100: 浅紫色渐变（#FAF5FF → #F3E8FF）
              - rounded-lg: 圆角 0.5rem
              - p-6: 内边距 1.5rem
            */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
              {/* 
                图标
                - text-3xl: 字体大小 1.875rem（大号 emoji）
                - mb-2: 下边距 0.5rem
              */}
              <div className="text-3xl mb-2">🔒</div>
              {/* 
                特性标题
                - font-semibold: 字体粗细 600
                - text-gray-800: 深灰色（#1F2937）
                - mb-1: 下边距 0.25rem
              */}
              <h3 className="font-semibold text-gray-800 mb-1">安全可靠</h3>
              {/* 
                特性描述
                - text-sm: 字体大小 0.875rem（小号文字）
                - text-gray-600: 中等灰色（#4B5563）
              */}
              <p className="text-sm text-gray-600">智能合约保障资金安全</p>
            </div>

            {/* ================================================================
                特性卡片 2：快速便捷
                ================================================================ */}
            {/* 
              - from-green-50 to-green-100: 浅绿色渐变（#F0FDF4 → #DCFCE7）
            */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="font-semibold text-gray-800 mb-1">快速便捷</h3>
              <p className="text-sm text-gray-600">即时借贷，无需等待</p>
            </div>

            {/* ================================================================
                特性卡片 3：去中心化
                ================================================================ */}
            {/* 
              - from-orange-50 to-orange-100: 浅橙色渐变（#FFF7ED → #FFEDD5）
            */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6">
              <div className="text-3xl mb-2">🌐</div>
              <h3 className="font-semibold text-gray-800 mb-1">去中心化</h3>
              <p className="text-sm text-gray-600">完全透明的链上交易</p>
            </div>
          </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            {/* 
              欢迎标题
              - text-2xl: 字体大小 1.5rem
              - font-semibold: 字体粗细 600（半粗体，介于普通和粗体之间）
              - text-blue-900: 深蓝色（#1E3A8A，与蓝色背景搭配）
              - mb-2: 下边距 0.5rem
            */}
            <h2 className="text-2xl font-semibold text-blue-900 mb-2">
              欢迎来到 MiniLender DeFi
            </h2>
            {/* 
              欢迎描述
              - text-blue-700: 中等蓝色（#1D4ED8，比标题浅一级）
            */}
            <p className="text-blue-700">
              基于区块链技术的创新借贷解决方案
            </p>
          </div>
        </div>

        {/* ====================================================================
            状态指示器
            ==================================================================== */}
        {/* 
          状态容器
          - mt-8: 上边距 2rem
          - text-center: 文本居中对齐
        */}
        <div className="mt-8 text-center">
          {/* 
            状态徽章
            - inline-flex: 内联 Flexbox（宽度自适应内容）
            - items-center: 垂直居中对齐（图标和文字对齐）
            - bg-green-100: 浅绿色背景（#D1FAE5，表示成功/就绪状态）
            - text-green-800: 深绿色文字（#166534，与背景搭配）
            - px-4: 左右内边距 1rem
            - py-2: 上下内边距 0.5rem
            - rounded-full: 完全圆角（药丸形状）
          */}
          <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full">
            {/* 
              脉冲指示器
              - w-2 h-2: 宽高各 0.5rem（小圆点）
              - bg-green-500: 绿色背景（#22C55E，鲜艳的绿色）
              - rounded-full: 完全圆角（圆形）
              - mr-2: 右边距 0.5rem（与文字分离）
              - animate-pulse: Tailwind 内置动画（淡入淡出效果，表示活动状态）
            */}
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            {/* 
              状态文字
              - text-sm: 字体大小 0.875rem
              - font-medium: 字体粗细 500（中等粗细）
            */}
            <span className="text-sm font-medium">应用已就绪</span>
          </div>
        </div>
      </div>
    </main>
  )
}

// ============================================================================
// Tailwind CSS 响应式断点说明
// ============================================================================
/**
 * Tailwind CSS 默认断点：
 * - sm: 640px   - 小屏幕（手机横屏、小平板）
 * - md: 768px   - 中等屏幕（平板、小笔记本）- 本页面使用
 * - lg: 1024px  - 大屏幕（笔记本）
 * - xl: 1280px  - 超大屏幕（桌面显示器）
 * - 2xl: 1536px - 超超大屏幕（大桌面显示器）
 * 
 * 本页面使用 md: 断点的原因：
 * - 在 768px 以下（移动端）：单列布局，较小字体
 * - 在 768px 以上（桌面端）：多列布局，较大字体
 * - 这个断点适合大多数平板和笔记本的切换点
 */

