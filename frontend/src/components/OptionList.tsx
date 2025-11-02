'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, type Address } from 'viem';
import Link from 'next/link';
import TokenDisplay from './TokenDisplay';

// Factory contract ABI
const OPTION_FACTORY_ABI = [
  {
    "inputs": [],
    "name": "getAllOptions",
    "outputs": [{"internalType": "address[]", "name": "addresses", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_optionAddress", "type": "address"}],
    "name": "matchOption",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

// Option contract ABI (for reading option information)
const EUROPEAN_CALL_OPTION_ABI = [
  {
    "inputs": [],
    "name": "underlyingAsset",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "strikeAsset",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "strikePrice",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "expirationTime",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "contractSize",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "issuer",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "holder",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "status",
    "outputs": [{"internalType": "enum EuropeanCallOption.OptionStatus", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

interface OptionListProps {
  factoryAddress: Address;
  onMatchSuccess?: () => void;
}

export default function OptionList({ factoryAddress, onMatchSuccess }: OptionListProps) {
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const [optionAddresses, setOptionAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchingOption, setMatchingOption] = useState<Address | null>(null);
  const [error, setError] = useState<string>('');

  // Read all option list (including matched ones)
  const { data: allOptions, refetch: refetchAll, isLoading: isLoadingOptions } = useReadContract({
    address: factoryAddress,
    abi: OPTION_FACTORY_ABI,
    functionName: 'getAllOptions',
    query: {
      enabled: !!factoryAddress,
    },
  });

  // Auto polling: refresh list every 10 seconds
  useEffect(() => {
    if (!factoryAddress) return;

    const interval = setInterval(() => {
      refetchAll();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [factoryAddress, refetchAll]);

  // Update option address list
  useEffect(() => {
    if (allOptions && Array.isArray(allOptions)) {
      setOptionAddresses(allOptions as Address[]);
      setLoading(isLoadingOptions);
    } else {
      setOptionAddresses([]);
      setLoading(isLoadingOptions);
    }
  }, [allOptions, isLoadingOptions]);

  // Handle match success
  useEffect(() => {
    if (isConfirmed && matchingOption) {
      setMatchingOption(null);
      if (onMatchSuccess) {
        onMatchSuccess();
      }
      // Reload list
      refetchAll();
    }
  }, [isConfirmed, matchingOption, onMatchSuccess, refetchAll]);

  // Handle matching
  const handleMatch = async (optionAddress: Address) => {
    if (!isConnected) {
      setError('Please connect wallet first');
      return;
    }

    setError('');
    setMatchingOption(optionAddress);

    try {
      await writeContract({
        address: factoryAddress,
        abi: OPTION_FACTORY_ABI,
        functionName: 'matchOption',
        args: [optionAddress],
      });
    } catch (error: any) {
      const errorMessage = error?.shortMessage || error?.message || 'Match failed';
      setError(errorMessage);
      setMatchingOption(null);
      console.error('Match failed:', error);
    }
  };

  const statusNames = ['Created', 'Active', 'Expired', 'Exercised'];
  const statusColors = {
    0: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    1: 'bg-green-500/20 text-green-400 border-green-500/30',
    2: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    3: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  if (!factoryAddress) {
    return (
      <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50">
        <p className="text-gray-400">Please set factory contract address first</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mb-4"></div>
            <p className="text-gray-400">Loading option list...</p>
          </div>
        </div>
      </div>
    );
  }

  if (optionAddresses.length === 0) {
    return (
      <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50">
        <div className="text-center py-12">
          <p className="text-gray-400 mb-2">No options available</p>
          <p className="text-sm text-gray-500">
            Click the <span className="text-blue-400">➕ Create Option</span> button at the top of the page to create a new option
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Refresh button and status */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          List auto-refreshes every 10 seconds, or click the button below to manually refresh
        </div>
         <button
           onClick={() => refetchAll()}
           disabled={isLoadingOptions}
           className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
         >
          {isLoadingOptions ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Refreshing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh List
            </>
          )}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-500/20 backdrop-blur-sm rounded-lg border border-red-500/30">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Match success message */}
      {hash && isConfirmed && (
        <div className="p-4 bg-green-500/20 backdrop-blur-sm rounded-lg border border-green-500/30">
          <p className="text-sm text-green-400">✅ Match successful!</p>
        </div>
      )}

      {/* Option List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {optionAddresses.map((optionAddress) => (
          <OptionCard
            key={optionAddress}
            optionAddress={optionAddress}
            onMatch={handleMatch}
            isMatching={matchingOption === optionAddress && (isPending || isConfirming)}
            isConnected={isConnected}
          />
        ))}
      </div>
    </div>
  );
}

// Single option card component
interface OptionCardProps {
  optionAddress: Address;
  onMatch: (address: Address) => void;
  isMatching: boolean;
  isConnected: boolean;
}

function OptionCard({ optionAddress, onMatch, isMatching, isConnected }: OptionCardProps) {
  const { data: underlyingAsset } = useReadContract({
    address: optionAddress,
    abi: EUROPEAN_CALL_OPTION_ABI,
    functionName: 'underlyingAsset',
  });

  const { data: strikeAsset } = useReadContract({
    address: optionAddress,
    abi: EUROPEAN_CALL_OPTION_ABI,
    functionName: 'strikeAsset',
  });

  const { data: strikePrice } = useReadContract({
    address: optionAddress,
    abi: EUROPEAN_CALL_OPTION_ABI,
    functionName: 'strikePrice',
  });

  const { data: expirationTime } = useReadContract({
    address: optionAddress,
    abi: EUROPEAN_CALL_OPTION_ABI,
    functionName: 'expirationTime',
  });

  const { data: contractSize } = useReadContract({
    address: optionAddress,
    abi: EUROPEAN_CALL_OPTION_ABI,
    functionName: 'contractSize',
  });

  const { data: issuer } = useReadContract({
    address: optionAddress,
    abi: EUROPEAN_CALL_OPTION_ABI,
    functionName: 'issuer',
  });

  const { data: holder } = useReadContract({
    address: optionAddress,
    abi: EUROPEAN_CALL_OPTION_ABI,
    functionName: 'holder',
  });

  const { data: status } = useReadContract({
    address: optionAddress,
    abi: EUROPEAN_CALL_OPTION_ABI,
    functionName: 'status',
  });

  const statusNames = ['Created', 'Active', 'Expired', 'Exercised'];
  const statusColors = {
    0: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    1: 'bg-green-500/20 text-green-400 border-green-500/30',
    2: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    3: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  const isLoading = !underlyingAsset || !strikePrice || !expirationTime || !contractSize;

  if (isLoading) {
    return (
      <div className="p-4 bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-700 rounded w-3/4"></div>
          <div className="h-4 bg-slate-700 rounded w-1/2"></div>
          <div className="h-4 bg-slate-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50 hover:border-blue-500/50 transition-all">
      {/* Option Address */}
      <div className="mb-3">
        <p className="text-xs text-gray-400 mb-1">Option Address</p>
        <p className="text-sm font-mono text-white break-all">
          {optionAddress.slice(0, 6)}...{optionAddress.slice(-4)}
        </p>
      </div>

      {/* Token Display */}
      <div className="mb-4 space-y-2">
        <div className="p-2 bg-slate-700/30 rounded-lg border border-slate-600/30">
          <p className="text-xs text-gray-400 mb-1.5">Underlying Asset</p>
          {underlyingAsset ? (
            <TokenDisplay 
              address={underlyingAsset as Address}
              size="sm"
              showAddress={false}
            />
          ) : (
            <p className="text-xs text-gray-500">-</p>
          )}
        </div>
        <div className="p-2 bg-slate-700/30 rounded-lg border border-slate-600/30">
          <p className="text-xs text-gray-400 mb-1.5">Strike Asset</p>
          {strikeAsset ? (
            <TokenDisplay 
              address={strikeAsset as Address}
              size="sm"
              showAddress={false}
            />
          ) : (
            <p className="text-xs text-gray-500">-</p>
          )}
        </div>
      </div>

      {/* Option Parameters */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Strike Price</span>
          <span className="text-sm font-semibold text-blue-400">
            {strikePrice ? formatEther(strikePrice) : '-'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Contract Size</span>
          <span className="text-sm font-semibold text-blue-400">
            {contractSize ? formatEther(contractSize) : '-'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Expiration Time</span>
          <span className="text-xs text-white">
            {expirationTime
              ? new Date(Number(expirationTime) * 1000).toLocaleDateString('en-US')
              : '-'}
          </span>
        </div>
        {status !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Status</span>
            <span className={`px-2 py-1 rounded text-xs border ${
              statusColors[status as keyof typeof statusColors] || statusColors[0]
            }`}>
              {statusNames[status] || '-'}
            </span>
          </div>
        )}
        {holder !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Holder</span>
            <span className="text-xs text-white font-mono">
              {holder && holder !== '0x0000000000000000000000000000000000000000'
                ? `${holder.slice(0, 6)}...${holder.slice(-4)}`
                : 'Not matched'}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <Link
          href={`/?option=${optionAddress}`}
          className="block w-full text-center px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg text-sm font-semibold transition-all"
        >
          View Details
        </Link>
        {holder && holder !== '0x0000000000000000000000000000000000000000' ? (
          <div className="px-4 py-2 bg-slate-700/30 border border-slate-600/50 rounded-lg text-center">
            <p className="text-xs text-green-400 font-semibold mb-1">
              ✅ Matched
            </p>
            <p className="text-xs text-gray-400">
              Holder: {holder.slice(0, 6)}...{holder.slice(-4)}
            </p>
          </div>
        ) : (
          <button
            onClick={() => onMatch(optionAddress)}
            disabled={!isConnected || isMatching || (status !== undefined && status !== 0)}
            className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isMatching ? '⏳ Matching...' : '🎯 Match Option'}
          </button>
        )}
      </div>
    </div>
  );
}

