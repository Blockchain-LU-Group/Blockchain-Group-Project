'use client';

import { useState, useEffect } from 'react';
import { type Address } from 'viem';

interface TokenDisplayProps {
  address: Address | string | undefined;
  symbol?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  showAddress?: boolean;
  className?: string;
}

// Token configuration mapping
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

export default function TokenDisplay({ 
  address, 
  symbol, 
  name, 
  size = 'md',
  showAddress = false,
  className = ''
}: TokenDisplayProps) {
  const [tokenInfo, setTokenInfo] = useState<{ symbol: string; name: string; color: string; bgColor: string; icon: string } | null>(null);

  // Get token information from deployment info
  useEffect(() => {
    const loadTokenInfo = async () => {
      if (!address) {
        setTokenInfo(null);
        return;
      }

      // If symbol is provided, use it directly
      if (symbol) {
        const config = TOKEN_CONFIG[symbol.toUpperCase()];
        if (config) {
          setTokenInfo(config);
          return;
        }
      }

      // Try to match address from deployment info
      try {
        const response = await fetch('/api/deployment');
        const data = await response.json();
        
        if (data.success && data.deployment?.contracts) {
          const contracts = data.deployment.contracts;
          const addressStr = String(address).toLowerCase();
          
          // Check if it's UA token
          if (contracts.underlyingAsset?.address?.toLowerCase() === addressStr) {
            setTokenInfo(TOKEN_CONFIG.UA);
            return;
          }
          
          // Check if it's SA token
          if (contracts.strikeAsset?.address?.toLowerCase() === addressStr) {
            setTokenInfo(TOKEN_CONFIG.SA);
            return;
          }
        }
      } catch (error) {
        console.error('Failed to load token information:', error);
      }

      // If cannot match, use default display
      setTokenInfo({
        symbol: symbol || 'TOKEN',
        name: name || 'Token',
        color: 'text-gray-400',
        bgColor: 'bg-gray-500/20',
        icon: '🔷'
      });
    };

    loadTokenInfo();
  }, [address, symbol, name]);

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

