// Client-side component marker for Next.js
'use client';

// Import React hooks for component state and side effects
import { useState, useEffect } from 'react';
// Import Wagmi hooks for wallet and contract interactions
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
// Import Viem utilities for formatting ether values and address type
import { formatEther, type Address } from 'viem';
// Import Next.js Link component for client-side navigation
import Link from 'next/link';
// Import token display component
import TokenDisplay from './TokenDisplay';

/**
 * Factory contract ABI - Application Binary Interface for OptionFactory contract
 * Defines functions available in the factory contract for creating and managing options
 */
const OPTION_FACTORY_ABI = [
  {
    "inputs": [], // No parameters required
    "name": "getAllOptions", // Function name to retrieve all option addresses
    "outputs": [{"internalType": "address[]", "name": "addresses", "type": "address[]"}], // Returns array of option contract addresses
    "stateMutability": "view", // Read-only function (doesn't modify state)
    "type": "function" // This is a function definition
  },
  {
    "inputs": [{"internalType": "address", "name": "_optionAddress", "type": "address"}], // Takes option contract address as parameter
    "name": "matchOption", // Function name to match an option (assign holder)
    "outputs": [], // No return values
    "stateMutability": "nonpayable", // Function modifies state but doesn't accept ETH
    "type": "function" // This is a function definition
  }
] as const;

/**
 * Option contract ABI - Application Binary Interface for EuropeanCallOption contract (read-only functions)
 * Defines view functions to read option parameters and state from deployed option contracts
 */
const EUROPEAN_CALL_OPTION_ABI = [
  {
    "inputs": [], // No parameters
    "name": "underlyingAsset", // Get underlying asset token address
    "outputs": [{"internalType": "address", "name": "", "type": "address"}], // Returns token address
    "stateMutability": "view", // Read-only function
    "type": "function"
  },
  {
    "inputs": [], // No parameters
    "name": "strikeAsset", // Get strike asset token address
    "outputs": [{"internalType": "address", "name": "", "type": "address"}], // Returns token address
    "stateMutability": "view", // Read-only function
    "type": "function"
  },
  {
    "inputs": [], // No parameters
    "name": "strikePrice", // Get strike price parameter
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], // Returns strike price in wei
    "stateMutability": "view", // Read-only function
    "type": "function"
  },
  {
    "inputs": [], // No parameters
    "name": "expirationTime", // Get expiration timestamp
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], // Returns Unix timestamp in seconds
    "stateMutability": "view", // Read-only function
    "type": "function"
  },
  {
    "inputs": [], // No parameters
    "name": "contractSize", // Get contract size parameter
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], // Returns contract size in wei
    "stateMutability": "view", // Read-only function
    "type": "function"
  },
  {
    "inputs": [], // No parameters
    "name": "issuer", // Get issuer (seller) address
    "outputs": [{"internalType": "address", "name": "", "type": "address"}], // Returns issuer address
    "stateMutability": "view", // Read-only function
    "type": "function"
  },
  {
    "inputs": [], // No parameters
    "name": "holder", // Get holder (buyer) address
    "outputs": [{"internalType": "address", "name": "", "type": "address"}], // Returns holder address (zero if not matched)
    "stateMutability": "view", // Read-only function
    "type": "function"
  },
  {
    "inputs": [], // No parameters
    "name": "status", // Get current option status
    "outputs": [{"internalType": "enum EuropeanCallOption.OptionStatus", "name": "", "type": "uint8"}], // Returns enum value: 0=Created, 1=Active, 2=Expired, 3=Exercised
    "stateMutability": "view", // Read-only function
    "type": "function"
  }
] as const;

// Interface defining component props
interface OptionListProps {
  factoryAddress: Address; // Factory contract address
  onMatchSuccess?: () => void; // Optional callback when matching succeeds
}

// Main option list component - displays all available options and allows matching
export default function OptionList({ factoryAddress, onMatchSuccess }: OptionListProps) {
  const { address, isConnected } = useAccount(); // Get wallet connection state
  const { writeContract, data: hash, isPending } = useWriteContract(); // Get contract write function and transaction state
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash }); // Wait for transaction confirmation

  const [optionAddresses, setOptionAddresses] = useState<Address[]>([]); // Store list of option contract addresses
  const [loading, setLoading] = useState(true); // Track loading state
  const [matchingOption, setMatchingOption] = useState<Address | null>(null); // Track currently matching option address
  const [error, setError] = useState<string>(''); // Store error message

  // Read all option list (including matched ones)
  const { data: allOptions, refetch: refetchAll, isLoading: isLoadingOptions } = useReadContract({
    address: factoryAddress, // Factory contract address
    abi: OPTION_FACTORY_ABI, // Factory contract ABI
    functionName: 'getAllOptions', // Function to call
    query: {
      enabled: !!factoryAddress, // Only query if factory address exists
    },
  });

  // Auto polling: refresh list every 10 seconds
  useEffect(() => { // Execute when factoryAddress or refetchAll changes
    if (!factoryAddress) return; // Exit if no factory address

    const interval = setInterval(() => { // Create interval
      refetchAll(); // Refresh option list
    }, 10000); // Run every 10 seconds

    return () => clearInterval(interval); // Cleanup: clear interval on unmount or dependency change
  }, [factoryAddress, refetchAll]); // Re-run when dependencies change

  // Update option address list
  useEffect(() => { // Execute when allOptions or isLoadingOptions changes
    if (allOptions && Array.isArray(allOptions)) { // Check if data exists and is array
      setOptionAddresses(allOptions as Address[]); // Set option addresses
      setLoading(isLoadingOptions); // Update loading state
    } else {
      setOptionAddresses([]); // Clear option addresses
      setLoading(isLoadingOptions); // Update loading state
    }
  }, [allOptions, isLoadingOptions]); // Re-run when dependencies change

  // Handle match success
  useEffect(() => { // Execute when isConfirmed, matchingOption, or callbacks change
    if (isConfirmed && matchingOption) { // Check if transaction confirmed and we have matching option
      setMatchingOption(null); // Clear matching option
      if (onMatchSuccess) { // Check if callback exists
        onMatchSuccess(); // Call success callback
      }
      // Reload list
      refetchAll(); // Refresh option list to show updated state
    }
  }, [isConfirmed, matchingOption, onMatchSuccess, refetchAll]); // Re-run when dependencies change

  // Handle matching
  const handleMatch = async (optionAddress: Address) => { // Async function to match an option
    if (!isConnected) { // Check if wallet is connected
      setError('Please connect wallet first'); // Set error message
      return; // Exit early
    }

    setError(''); // Clear any existing errors
    setMatchingOption(optionAddress); // Set currently matching option

    try { // Try to match option
      await writeContract({ // Call factory contract to match option
        address: factoryAddress, // Factory contract address
        abi: OPTION_FACTORY_ABI, // Factory contract ABI
        functionName: 'matchOption', // Function to call
        args: [optionAddress], // Pass option address as argument
      });
    } catch (error: any) { // Handle any errors
      const errorMessage = error?.shortMessage || error?.message || 'Match failed'; // Extract error message
      setError(errorMessage); // Set error message
      setMatchingOption(null); // Clear matching option
      console.error('Match failed:', error); // Log error to console
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

// Single option card component - displays individual option details in a card
interface OptionCardProps {
  optionAddress: Address; // Option contract address
  onMatch: (address: Address) => void; // Callback when match button clicked
  isMatching: boolean; // Whether this option is currently being matched
  isConnected: boolean; // Whether wallet is connected
}

function OptionCard({ optionAddress, onMatch, isMatching, isConnected }: OptionCardProps) {
  const { data: underlyingAsset } = useReadContract({ // Read underlying asset token address
    address: optionAddress, // Option contract address
    abi: EUROPEAN_CALL_OPTION_ABI, // Contract ABI
    functionName: 'underlyingAsset', // Read underlying asset
  });

  const { data: strikeAsset } = useReadContract({ // Read strike asset token address
    address: optionAddress, // Option contract address
    abi: EUROPEAN_CALL_OPTION_ABI, // Contract ABI
    functionName: 'strikeAsset', // Read strike asset
  });

  const { data: strikePrice } = useReadContract({ // Read strike price
    address: optionAddress, // Option contract address
    abi: EUROPEAN_CALL_OPTION_ABI, // Contract ABI
    functionName: 'strikePrice', // Read strike price
  });

  const { data: expirationTime } = useReadContract({ // Read expiration timestamp
    address: optionAddress, // Option contract address
    abi: EUROPEAN_CALL_OPTION_ABI, // Contract ABI
    functionName: 'expirationTime', // Read expiration time
  });

  const { data: contractSize } = useReadContract({ // Read contract size
    address: optionAddress, // Option contract address
    abi: EUROPEAN_CALL_OPTION_ABI, // Contract ABI
    functionName: 'contractSize', // Read contract size
  });

  const { data: issuer } = useReadContract({ // Read issuer address
    address: optionAddress, // Option contract address
    abi: EUROPEAN_CALL_OPTION_ABI, // Contract ABI
    functionName: 'issuer', // Read issuer
  });

  const { data: holder } = useReadContract({ // Read holder address
    address: optionAddress, // Option contract address
    abi: EUROPEAN_CALL_OPTION_ABI, // Contract ABI
    functionName: 'holder', // Read holder
  });

  const { data: status } = useReadContract({ // Read option status
    address: optionAddress, // Option contract address
    abi: EUROPEAN_CALL_OPTION_ABI, // Contract ABI
    functionName: 'status', // Read status
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

