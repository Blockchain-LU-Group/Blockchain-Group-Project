// Client-side component marker for Next.js
'use client';

// Import React hooks for component state and side effects
import { useState, useEffect } from 'react';
// Import Ethereum address type from Viem
import { type Address } from 'viem';

// Interface defining component props for token display
interface TokenDisplayProps {
  address: Address | string | undefined; // Token contract address
  symbol?: string; // Optional token symbol (e.g., 'UA', 'SA')
  name?: string; // Optional token name
  size?: 'sm' | 'md' | 'lg'; // Display size variant
  showAddress?: boolean; // Whether to display full address
  className?: string; // Additional CSS classes
}

// Token configuration mapping - pre-configured token display settings
const TOKEN_CONFIG: Record<string, { symbol: string; name: string; color: string; bgColor: string; icon: string }> = {
  'UA': {
    symbol: 'UA',
    name: 'Underlying Asset',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    icon: '🪙'
  },
  'SA': {
    symbol: 'SA',
    name: 'Strike Asset',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    icon: '💎'
  }
};

// Main token display component
export default function TokenDisplay({ 
  address, // Token contract address
  symbol, // Token symbol
  name, // Token name
  size = 'md', // Default size is medium
  showAddress = false, // Default is hiding address
  className = '' // Default no additional classes
}: TokenDisplayProps) {
  const [tokenInfo, setTokenInfo] = useState<{ symbol: string; name: string; color: string; bgColor: string; icon: string } | null>(null); // Store token display configuration

  // Get token information from deployment info
  useEffect(() => { // Execute when address, symbol, or name changes
    const loadTokenInfo = async () => { // Async function to load token configuration
      if (!address) { // Check if address exists
        setTokenInfo(null); // Clear token info if no address
        return; // Exit early
      }

      // If symbol is provided, use it directly
      if (symbol) { // Check if symbol prop is provided
        const config = TOKEN_CONFIG[symbol.toUpperCase()]; // Get config for symbol (uppercase)
        if (config) { // If config found
          setTokenInfo(config); // Set token info from config
          return; // Exit early
        }
      }

      // Try to match address from deployment info
      try {
        const response = await fetch('/api/deployment'); // Fetch deployment info from API
        const data = await response.json(); // Parse JSON response
        
        if (data.success && data.deployment?.contracts) { // Check if deployment data exists
          const contracts = data.deployment.contracts; // Extract contracts
          const addressStr = String(address).toLowerCase(); // Convert address to lowercase for comparison
          
          // Check if it's UA token
          if (contracts.underlyingAsset?.address?.toLowerCase() === addressStr) { // Compare addresses
            setTokenInfo(TOKEN_CONFIG.UA); // Set UA configuration
            return; // Exit early
          }
          
          // Check if it's SA token
          if (contracts.strikeAsset?.address?.toLowerCase() === addressStr) { // Compare addresses
            setTokenInfo(TOKEN_CONFIG.SA); // Set SA configuration
            return; // Exit early
          }
        }
      } catch (error) { // Handle any errors
        console.error('Failed to load token information:', error); // Log error to console
      }

      // If cannot match, use default display
      setTokenInfo({ // Set fallback configuration
        symbol: symbol || 'TOKEN', // Use provided symbol or default 'TOKEN'
        name: name || 'Token', // Use provided name or default 'Token'
        color: 'text-gray-400', // Gray text color
        bgColor: 'bg-gray-500/20', // Gray background with 20% opacity
        icon: '🔷' // Default blue diamond icon
      });
    };

    loadTokenInfo(); // Call async function
  }, [address, symbol, name]); // Re-run when dependencies change

  if (!address || !tokenInfo) {
    const sizeClasses = size === 'sm' ? { icon: 'w-6 h-6', text: 'text-sm', iconText: 'text-xs' } :
                        size === 'lg' ? { icon: 'w-12 h-12', text: 'text-lg', iconText: 'text-base' } :
                        { icon: 'w-8 h-8', text: 'text-base', iconText: 'text-sm' };
    
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`${sizeClasses.icon} rounded-full bg-gray-500/20 flex items-center justify-center border-2 border-slate-700/50`}>
          <span className={`text-gray-400 ${sizeClasses.iconText}`}>?</span>
        </div>
        <div>
          <p className={`text-gray-400 ${sizeClasses.text}`}>Unknown Token</p>
          {showAddress && address && (
            <p className="text-xs text-gray-500 font-mono mt-0.5">
              {String(address).slice(0, 6)}...{String(address).slice(-4)}
            </p>
          )}
        </div>
      </div>
    );
  }

  const sizeClasses = {
    sm: { icon: 'w-6 h-6', text: 'text-sm', iconText: 'text-xs' },
    md: { icon: 'w-8 h-8', text: 'text-base', iconText: 'text-sm' },
    lg: { icon: 'w-12 h-12', text: 'text-lg', iconText: 'text-base' }
  };

  const sizeConfig = sizeClasses[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizeConfig.icon} ${tokenInfo.bgColor} rounded-full flex items-center justify-center border-2 border-slate-700/50 shadow-lg`}>
        <span className={sizeConfig.iconText}>{tokenInfo.icon}</span>
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${sizeConfig.text} ${tokenInfo.color}`}>
            {tokenInfo.symbol}
          </span>
          <span className={`text-xs ${tokenInfo.color} opacity-70`}>
            {tokenInfo.name}
          </span>
        </div>
        {showAddress && address && (
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            {String(address).slice(0, 6)}...{String(address).slice(-4)}
          </p>
        )}
      </div>
    </div>
  );
}

