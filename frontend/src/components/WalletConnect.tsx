'use client';

import { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { formatEther } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface WalletConnectProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}

export default function WalletConnect({ onConnect, onDisconnect }: WalletConnectProps) {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address: address,
  });

  useEffect(() => {
    if (isConnected && address && onConnect) {
      onConnect(address);
    } else if (!isConnected && onDisconnect) {
      onDisconnect();
    }
  }, [isConnected, address, onConnect, onDisconnect]);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="p-6 bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex-1 min-w-0">
          {isConnected && address ? (
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                <span className="text-sm font-medium text-white">
                  Connected: <span className="text-blue-400 font-mono">{formatAddress(address)}</span>
                </span>
              </div>
              {balance && (
                <div className="text-sm text-gray-400 ml-6 flex items-center">
                  <svg className="w-4 h-4 mr-1 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                  Balance: <span className="font-mono font-semibold text-yellow-400">{parseFloat(formatEther(balance.value)).toFixed(4)}</span> {balance.symbol}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-400">
              🔐 Please connect your wallet to use EuropeanCallOption DeFi service
            </div>
          )}
        </div>
        <div>
          <ConnectButton />
        </div>
      </div>
    </div>
  );
}