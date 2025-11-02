/**
 * Providers - Web3 上下文提供者 (🔵 隐式调用：TS 编译器)
 * 
 * 这个文件配置了整个 DApp 的 Web3 基础设施，提供：
 * 1. 钱包连接功能（通过 WagmiProvider）
 * 2. 区块链数据查询和缓存（通过 QueryClientProvider）
 * 
 * 调用链中的位置：
 * - 被 layout.tsx 引用并包裹所有页面内容
 * - 所有子组件可以使用 Wagmi hooks（useAccount, useConnect 等）
 * 
 * 为什么需要 'use client'？
 * - 这是 Next.js 13+ 的客户端组件标记
 * - Wagmi 需要在浏览器环境中运行（访问 window.ethereum 等）
 * - 标记为客户端组件后，这个文件及其子组件都在浏览器端渲染
 */

'use client'

// ============================================================================
// 导入依赖
// ============================================================================

import * as React from 'react';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';

// Wagmi: React Hooks for Ethereum - Web3 连接的核心库
// - WagmiProvider: 提供 Web3 上下文
// - createConfig: 创建 Wagmi 配置
// - http: HTTP 传输协议（用于连接 RPC 节点）
import { WagmiProvider, createConfig, http } from 'wagmi'

// TanStack Query: 强大的数据获取和缓存库
// - QueryClient: 查询客户端，管理缓存和重新获取策略
// - QueryClientProvider: 提供查询上下文
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Wagmi Chains: 预配置的区块链网络
// - sepolia: 以太坊测试网（用于部署测试）
// - hardhat: 本地开发网络（用于本地测试）
import { sepolia, hardhat } from 'wagmi/chains'

// defineChain 函数的主要作用是定义一个区块链网络的配置信息，包括该网络的链 ID、RPC 节点地址
import { defineChain } from 'viem';

import '@rainbow-me/rainbowkit/styles.css'; // 用于构建以太坊钱包连接界面的 React 库

// ============================================================================
// React Query 客户端配置
// ============================================================================

/**
 * React Query 客户端
 * 
 * 作用：
 * - 缓存区块链数据（余额、合约状态等），减少 RPC 调用
 * - 自动重新获取过期数据
 * - 优化性能，提供更好的用户体验
 * 
 * 默认配置：
 * - staleTime: 数据多久后被视为过期
 * - cacheTime: 数据在缓存中保留多久
 * - refetchOnWindowFocus: 窗口重新获得焦点时是否重新获取
 */
const queryClient = new QueryClient()

// ============================================================================
// Wagmi 配置
// ============================================================================

// 定义与 Hardhat 兼容的 localhost 网络
const localhost = defineChain({
  id: 31337,
  name: 'Localhost 8545',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
  },
});

/**
 * Wagmi 配置对象
 * 
 * 定义了 DApp 支持的区块链网络、钱包连接方式和 RPC 端点
 */
const config = getDefaultConfig({
  appName: 'EuropeanCallOption DeFi',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID',
  /**
   * chains: 支持的区块链网络列表
   * 
   * - sepolia: 以太坊 Sepolia 测试网
   *   - 用途：部署和测试智能合约
   *   - 获取测试币：https://sepoliafaucet.com/
   *   - 区块浏览器：https://sepolia.etherscan.io/
   * 
   * - hardhat: 本地 Hardhat 网络
   *   - 用途：本地开发和测试
   *   - 运行：npx hardhat node
   *   - 优点：快速、可预测、易于调试
   */
  chains: [sepolia, localhost],

  /**
   * transports: RPC 传输配置
   * 
   * 定义如何连接到每个区块链网络的节点
   * 
   * - sepolia: 使用默认的公共 RPC（Wagmi 内置）
   *   http() 会自动使用 Wagmi 提供的公共 RPC
   * 
   * - hardhat: 连接到本地 Hardhat 节点
   *   http('http://127.0.0.1:8545') 连接到本地运行的节点
   *   默认端口：8545
   * 
   * 生产环境建议：
   * - 使用 Infura、Alchemy 等服务提供商的 RPC
   * - 例如：http('https://sepolia.infura.io/v3/YOUR_API_KEY')
   */
  transports: {
    [sepolia.id]: http(),
    [hardhat.id]: http(),
  },
})

// ============================================================================
// Providers 组件
// ============================================================================

/**
 * Providers 组件
 * 
 * @param children - 子组件（来自 layout.tsx）
 * 
 * 组件结构：
 * <WagmiProvider>              ← 外层：提供 Web3 连接能力
 *   <QueryClientProvider>      ← 内层：提供数据查询和缓存
 *     {children}               ← 你的页面和组件
 *   </QueryClientProvider>
 * </WagmiProvider>
 * 
 * 为什么需要这种嵌套？
 * 1. WagmiProvider 提供钱包连接状态（地址、余额、网络等）
 * 2. QueryClientProvider 缓存这些数据，避免重复请求
 * 3. 两者配合，提供高性能的 Web3 应用体验
 * 
 * 子组件可以使用的 Hooks：
 * - useAccount(): 获取当前连接的钱包地址和状态
 * - useConnect(): 连接钱包
 * - useDisconnect(): 断开钱包连接
 * - useBalance(): 获取余额
 * - useReadContract(): 读取智能合约数据
 * - useWriteContract(): 调用智能合约函数
 * - useSwitchChain(): 切换区块链网络
 * 
 * 使用示例：
 * ```tsx
 * function MyComponent() {
 *   const { address, isConnected } = useAccount()
 *   const { connect, connectors } = useConnect()
 *   
 *   return (
 *     <div>
 *       {isConnected ? (
 *         <p>已连接: {address}</p>
 *       ) : (
 *         <button onClick={() => connect({ connector: connectors[0] })}>
 *           连接钱包
 *         </button>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // 追踪组件是否已经完成挂载
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {mounted && children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
