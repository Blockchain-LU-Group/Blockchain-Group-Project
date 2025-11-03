/**
 * RootLayout - Root layout component for Next.js application
 * 
 * This is the outermost component of the entire application, defining global HTML structure and configuration.
 * All pages will be wrapped by this layout, so configurations here apply to the entire application.
 * 
 * Call chain:
 * 1. Next.js automatically discovers this file through convention-based routing at startup (filename must be layout.tsx)
 * 2. When user visits any page, Next.js renders RootLayout first
 * 3. Then injects the corresponding page.tsx as children
 * 4. Final output: <RootLayout><Page /></RootLayout>
 */

// ============================================================================
// Import dependencies (explicit calls - visible in code)
// ============================================================================

// Next.js type definition: for configuring page metadata (SEO, title, etc.) node_modules/next/dist/lib/metadata/types/metadata-interface.d.ts
import type { Metadata } from 'next'

// Google font loader: dynamically load Inter font from Google Fonts
// Automatically optimizes font loading, reduces page flickering (FOUT)
import { Inter } from 'next/font/google'

// Global stylesheet: contains Tailwind CSS directives and custom styles
// Trigger call chain: globals.css -> PostCSS (🔵 implicit: Next.js automatic) -> Tailwind CSS (🔵 implicit: Tailwind auto-discovery)
import './globals.css'

// Web3 context provider: provides wallet connection, blockchain interaction, etc.
// Wraps all child components, enabling them to access Web3 functionality (useAccount, useConnect, etc. hooks)
import { Providers } from './providers'

// ============================================================================
// Font configuration
// ============================================================================

/**
 * Configure Inter font
 * - subsets: ['latin'] - only load Latin character set, reducing font file size
 * - Next.js automatically optimizes font loading:
 *   1. Download font files at build time
 *   2. Self-host fonts (independent from Google CDN)
 *   3. Zero layout shift (CSS font-display: swap)
 */
const inter = Inter({ subsets: ['latin'] })

// ============================================================================
// Page metadata (for SEO and browser display)
// ============================================================================

/**
 * Metadata configuration
 * - title: displayed in browser tab and search engine results
 * - description: displayed in search engine result descriptions
 * 
 * Next.js automatically injects these into HTML <head>:
 * <head>
 *   <title>EuropeanCallOption DeFi</title>
 *   <meta name="description" content="European Call Option Trading Platform - Designed for Students" />
 * </head>
 */
export const metadata: Metadata = {
  title: 'EuropeanCallOption DeFi',
  description: 'European Call Option Trading Platform - Designed for Students',
}

// ============================================================================
// Root layout component
// ============================================================================

/**
 * RootLayout component
 * 
 * @param children - Page content (automatically injected by Next.js)
 *                   Example: when visiting /, children is page.tsx content
 *                            when visiting /about, children is about/page.tsx content
 * 
 * Component structure:
 * <html lang="en">               ← Set page language to English (affects search engines and screen readers)
 *   <body className={...}>       ← Apply Inter font to entire page
 *     <Providers>                ← Web3 context provider (provides wallet connection, etc.)
 *       {children}               ← Page content (page.tsx) will be inserted here
 *     </Providers>
 *   </body>
 * </html>
 * 
 * Why wrap with Providers?
 * - WagmiProvider: manages Web3 connection state (wallet address, network, etc.)
 * - QueryClientProvider: caches blockchain data, optimizes performance
 * - All child components can access these features through React hooks
 * 
 * Rendering flow:
 * 1. Next.js matches route and finds corresponding page.tsx
 * 2. Renders RootLayout first (shell)
 * 3. Passes page.tsx as children
 * 4. Generates complete HTML sent to browser
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* 
          Providers wraps all content, providing global Web3 context
          This allows all child components to use useAccount(), useConnect(), etc. hooks
        */}
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}




