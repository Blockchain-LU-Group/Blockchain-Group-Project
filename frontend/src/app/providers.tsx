/**
 * Providers - Web3 context provider (🔵 implicit call: TS compiler)
 * 
 * This file configures the entire DApp's Web3 infrastructure, providing:
 * 1. Wallet connection functionality (through WagmiProvider)
 * 2. Blockchain data querying and caching (through QueryClientProvider)
 * 
 * Position in call chain:
 * - Referenced by layout.tsx and wraps all page content
 * - All child components can use Wagmi hooks (useAccount, useConnect, etc.)
 * 
 * Why is 'use client' needed?
 * - This is Next.js 13+ client component marker
 * - Wagmi needs to run in browser environment (access window.ethereum, etc.)
 * - After marking as client component, this file and its children render on browser side
 */

'use client'

// ============================================================================
// Import dependencies
// ============================================================================

import * as React from 'react';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';

// Wagmi: React Hooks for Ethereum - core library for Web3 connection
// - WagmiProvider: provides Web3 context
// - createConfig: creates Wagmi configuration
// - http: HTTP transport protocol (for connecting to RPC nodes)
import { WagmiProvider, createConfig, http } from 'wagmi'

// TanStack Query: powerful data fetching and caching library
// - QueryClient: query client, manages caching and refetch strategies
// - QueryClientProvider: provides query context
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Wagmi Chains: pre-configured blockchain networks
// - sepolia: Ethereum testnet (for deployment testing)
// - hardhat: local development network (for local testing)
import { sepolia, hardhat } from 'wagmi/chains'

// defineChain function's main purpose is to define blockchain network configuration, including chain ID, RPC node addresses
import { defineChain } from 'viem';

import '@rainbow-me/rainbowkit/styles.css'; // React library for building Ethereum wallet connection UI

// ============================================================================
// React Query client configuration
// ============================================================================

/**
 * React Query client
 * 
 * Purpose:
 * - Cache blockchain data (balance, contract state, etc.), reducing RPC calls
 * - Automatically refetch stale data
 * - Optimize performance, provide better user experience
 * 
 * Default configuration:
 * - staleTime: how long before data is considered stale
 * - cacheTime: how long data stays in cache
 * - refetchOnWindowFocus: whether to refetch when window regains focus
 */
const queryClient = new QueryClient()

// ============================================================================
// Wagmi configuration
// ============================================================================

// Define localhost network compatible with Hardhat
const localhost = defineChain({
  id: 31337, // Hardhat chain ID
  name: 'Localhost 8545', // Network name
  nativeCurrency: { // Native currency configuration
    decimals: 18, // ETH has 18 decimals
    name: 'Ether', // Currency name
    symbol: 'ETH', // Currency symbol
  },
  rpcUrls: { // RPC endpoint URLs
    default: { // Default RPC URL
      http: ['http://127.0.0.1:8545'], // Local Hardhat node URL
    },
  },
});

/**
 * Wagmi configuration object
 * 
 * Defines blockchain networks supported by DApp, wallet connection methods, and RPC endpoints
 */
const config = getDefaultConfig({
  appName: 'EuropeanCallOption DeFi', // Application name
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // WalletConnect project ID
  /**
   * chains: list of supported blockchain networks
   * 
   * - sepolia: Ethereum Sepolia testnet
   *   - Purpose: deploy and test smart contracts
   *   - Get test tokens: https://sepoliafaucet.com/
   *   - Block explorer: https://sepolia.etherscan.io/
   * 
   * - hardhat: local Hardhat network
   *   - Purpose: local development and testing
   *   - Run command: npx hardhat node
   *   - Advantages: fast, predictable, easy to debug
   */
  chains: [sepolia, localhost], // Supported networks

  /**
   * transports: RPC transport configuration
   * 
   * Defines how to connect to nodes of each blockchain network
   * 
   * - sepolia: use default public RPC (Wagmi built-in)
   *   http() automatically uses Wagmi's provided public RPC
   * 
   * - hardhat: connect to local Hardhat node
   *   http('http://127.0.0.1:8545') connects to locally running node
   *   Default port: 8545
   * 
   * Production recommendations:
   * - Use RPC from service providers like Infura, Alchemy
   * - Example: http('https://sepolia.infura.io/v3/YOUR_API_KEY')
   */
  transports: {
    [sepolia.id]: http(), // Sepolia RPC transport
    [hardhat.id]: http(), // Hardhat RPC transport
  },
})

// ============================================================================
// Providers component
// ============================================================================

/**
 * Providers component
 * 
 * @param children - Child components (from layout.tsx)
 * 
 * Component structure:
 * <WagmiProvider>              ← Outer layer: provides Web3 connection capability
 *   <QueryClientProvider>      ← Inner layer: provides data querying and caching
 *     {children}               ← Your pages and components
 *   </QueryClientProvider>
 * </WagmiProvider>
 * 
 * Why is this nesting needed?
 * 1. WagmiProvider provides wallet connection state (address, balance, network, etc.)
 * 2. QueryClientProvider caches this data, avoiding duplicate requests
 * 3. Both work together to provide high-performance Web3 application experience
 * 
 * Hooks available to child components:
 * - useAccount(): get currently connected wallet address and state
 * - useConnect(): connect wallet
 * - useDisconnect(): disconnect wallet
 * - useBalance(): get balance
 * - useReadContract(): read smart contract data
 * - useWriteContract(): call smart contract functions
 * - useSwitchChain(): switch blockchain network
 * 
 * Usage example:
 * ```tsx
 * function MyComponent() {
 *   const { address, isConnected } = useAccount()
 *   const { connect, connectors } = useConnect()
 *   
 *   return (
 *     <div>
 *       {isConnected ? (
 *         <p>Connected: {address}</p>
 *       ) : (
 *         <button onClick={() => connect({ connector: connectors[0] })}>
 *           Connect Wallet
 *         </button>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // Track whether component has mounted
  const [mounted, setMounted] = React.useState(false); // Initialize mounted state as false
  React.useEffect(() => setMounted(true), []); // Set mounted to true after component mounts

  return (
    <WagmiProvider config={config}> {/* Provide Wagmi configuration to all children */}
      <QueryClientProvider client={queryClient}> {/* Provide query client for data caching */}
        <RainbowKitProvider> {/* Provide RainbowKit UI components */}
          {mounted && children} {/* Only render children after mount to prevent hydration mismatch */}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
