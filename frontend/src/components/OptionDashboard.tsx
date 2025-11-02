'use client';

import { useReadContract } from 'wagmi';
import { formatEther, type Address } from 'viem';
import TokenDisplay from './TokenDisplay';

const EUROPEAN_CALL_OPTION_ABI = [
  {
    "inputs": [],
    "name": "contractSize",
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
    "name": "holder",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "isExercisable",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
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
    "name": "status",
    "outputs": [{"internalType": "enum EuropeanCallOption.OptionStatus", "name": "", "type": "uint8"}],
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
    "name": "underlyingAsset",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export default function OptionDashboard({ contractAddress }: { contractAddress?: Address }) {
  // Check if address format is valid
  const isValidAddress = contractAddress && contractAddress.length === 42 && contractAddress.startsWith('0x');
  const isEnabled = !!isValidAddress;

  const { data: underlyingAsset, error: underlyingError, isLoading: isLoadingUnderlying } = useReadContract({
    address: contractAddress,
    abi: EUROPEAN_CALL_OPTION_ABI,
    functionName: 'underlyingAsset',
    query: {
      enabled: isEnabled,
    },
  });

  const { data: strikeAsset, error: strikeAssetError, isLoading: isLoadingStrikeAsset } = useReadContract({
    address: contractAddress,
    abi: EUROPEAN_CALL_OPTION_ABI,
    functionName: 'strikeAsset',
    query: {
      enabled: isEnabled,
    },
  });

  const { data: strikePrice, error: strikePriceError, isLoading: isLoadingStrikePrice } = useReadContract({
    address: contractAddress,
    abi: EUROPEAN_CALL_OPTION_ABI,
    functionName: 'strikePrice',
    query: {
      enabled: isEnabled,
    },
  });

  const { data: expirationTime, error: expirationTimeError, isLoading: isLoadingExpirationTime } = useReadContract({
    address: contractAddress,
    abi: EUROPEAN_CALL_OPTION_ABI,
    functionName: 'expirationTime',
    query: {
      enabled: isEnabled,
    },
  });

  const { data: contractSize, error: contractSizeError, isLoading: isLoadingContractSize } = useReadContract({
    address: contractAddress,
    abi: EUROPEAN_CALL_OPTION_ABI,
    functionName: 'contractSize',
    query: {
      enabled: isEnabled,
    },
  });

  const { data: issuer, error: issuerError, isLoading: isLoadingIssuer } = useReadContract({
    address: contractAddress,
    abi: EUROPEAN_CALL_OPTION_ABI,
    functionName: 'issuer',
    query: {
      enabled: isEnabled,
    },
  });

  const { data: holder, error: holderError, isLoading: isLoadingHolder } = useReadContract({
    address: contractAddress,
    abi: EUROPEAN_CALL_OPTION_ABI,
    functionName: 'holder',
    query: {
      enabled: isEnabled,
    },
  });

  const { data: status, error: statusError, isLoading: isLoadingStatus } = useReadContract({
    address: contractAddress,
    abi: EUROPEAN_CALL_OPTION_ABI,
    functionName: 'status',
    query: {
      enabled: isEnabled,
    },
  });

  const { data: isExercisable, error: isExercisableError, isLoading: isLoadingIsExercisable } = useReadContract({
    address: contractAddress,
    abi: EUROPEAN_CALL_OPTION_ABI,
    functionName: 'isExercisable',
    query: {
      enabled: isEnabled,
    },
  });

  // Check if any queries are loading
  const isLoading = isLoadingUnderlying || isLoadingStrikeAsset || isLoadingStrikePrice || 
                   isLoadingExpirationTime || isLoadingContractSize || isLoadingIssuer || 
                   isLoadingHolder || isLoadingStatus || isLoadingIsExercisable;

  // Check if there are any errors
  const hasError = underlyingError || strikeAssetError || strikePriceError || expirationTimeError || 
                  contractSizeError || issuerError || holderError || statusError || isExercisableError;

  const statusNames = ['Created', 'Active', 'Expired', 'Exercised'];

  if (!contractAddress) {
    return (
      <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50">
        <p className="text-gray-400">Please enter option contract address</p>
      </div>
    );
  }

  if (!isValidAddress) {
    return (
      <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-red-500/30">
        <p className="text-red-400">⚠️ Invalid contract address format, please check input</p>
        <p className="text-gray-400 text-sm mt-2">Address should start with 0x and be 42 characters long</p>
      </div>
    );
  }

  // Check if there are errors
  if (hasError) {
    const errorMessage = underlyingError?.message || strikeAssetError?.message || 'Unknown error';
    
    // Check if it's a network mismatch issue
    const isNetworkMismatch = errorMessage.includes('returned no data') || 
                               errorMessage.includes('address is not a contract');
    
    return (
      <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-red-500/30">
        <p className="text-red-400 text-lg font-semibold mb-3">⚠️ Unable to read contract data</p>
        
        {isNetworkMismatch && (
          <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-400 text-sm font-semibold mb-1">⚠️ Network Mismatch Warning</p>
            <p className="text-gray-300 text-xs mb-2">
              This contract address may belong to a different network. Please check:
            </p>
            <ul className="text-gray-300 text-xs mt-1 list-disc list-inside ml-2 mb-2">
              <li>If address is locally deployed (e.g., 0xDc64...), switch to Localhost network</li>
              <li>If address is on Sepolia testnet, ensure you're connected to Sepolia network</li>
              <li>Confirm address format is correct: starts with 0x, 42 characters</li>
            </ul>
            <div className="mt-2 p-2 bg-yellow-600/20 rounded border border-yellow-500/30">
              <p className="text-yellow-300 text-xs font-semibold mb-1">🔧 Configure Local Network (Localhost):</p>
              <p className="text-gray-300 text-xs font-mono break-all mb-1">
                Network Name: Localhost 8545<br/>
                RPC URL: http://127.0.0.1:8545<br/>
                Chain ID: 31337<br/>
                Currency Symbol: ETH
              </p>
              <p className="text-gray-400 text-xs mt-1">
                💡 If you encounter "Chain ID mismatch" error, delete old local network configuration and add it again
              </p>
            </div>
          </div>
        )}
        
        <p className="text-gray-400 text-sm mt-2">Possible causes:</p>
        <ul className="text-gray-400 text-sm mt-1 list-disc list-inside">
          <li>Contract address does not exist or is not deployed</li>
          <li>Network connection issue (contract is on another network)</li>
          <li>Contract ABI mismatch</li>
          <li>RPC node response timeout</li>
        </ul>
        
        <div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
          <p className="text-gray-400 text-xs mb-1">Contract Address:</p>
          <p className="text-gray-300 text-xs font-mono break-all">{contractAddress}</p>
        </div>
        
        <details className="mt-3">
          <summary className="text-red-400 text-xs cursor-pointer hover:text-red-300">
            View Error Details
          </summary>
          <p className="text-red-300 text-xs mt-2 font-mono break-all bg-red-500/10 p-2 rounded">
            {errorMessage}
          </p>
        </details>
        
        <div className="mt-4 text-xs text-gray-400">
          <p className="font-semibold mb-1">💡 Solutions:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Confirm contract address is correctly deployed</li>
            <li>Check wallet connected network (recommended: Sepolia testnet)</li>
            <li>If using local network, ensure Hardhat node is running</li>
            <li>Try refreshing the page to reload</li>
          </ol>
        </div>
      </div>
    );
  }

  // If loading, show loading state
  if (isLoading && !hasError) {
    return (
      <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50">
        <h2 className="text-2xl font-bold mb-6 text-white">Option Details</h2>
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mb-4"></div>
            <p className="text-gray-400">Loading contract data...</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 1: return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 2: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 3: return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50">
      <h2 className="text-2xl font-bold mb-6 text-white">Option Details</h2>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
            <p className="text-sm text-gray-400 mb-2">Underlying Asset</p>
            {underlyingAsset ? (
              <TokenDisplay 
                address={underlyingAsset as Address}
                size="md"
                showAddress={true}
              />
            ) : (
              <p className="text-gray-500">-</p>
            )}
          </div>
          <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
            <p className="text-sm text-gray-400 mb-2">Strike Asset</p>
            {strikeAsset ? (
              <TokenDisplay 
                address={strikeAsset as Address}
                size="md"
                showAddress={true}
              />
            ) : (
              <p className="text-gray-500">-</p>
            )}
          </div>
          <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
            <p className="text-sm text-gray-400 mb-1">Strike Price</p>
            <p className="font-semibold text-blue-400 text-lg">
              {strikePrice !== undefined && strikePrice !== null ? formatEther(strikePrice) : '-'}
            </p>
          </div>
          <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
            <p className="text-sm text-gray-400 mb-1">Contract Size</p>
            <p className="font-semibold text-blue-400 text-lg">
              {contractSize !== undefined && contractSize !== null ? formatEther(contractSize) : '-'}
            </p>
          </div>
          <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
            <p className="text-sm text-gray-400 mb-1">Expiration Time</p>
            <p className="font-semibold text-white">
              {expirationTime !== undefined && expirationTime !== null 
                ? new Date(Number(expirationTime) * 1000).toLocaleString('en-US') 
                : '-'}
            </p>
          </div>
          <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
            <p className="text-sm text-gray-400 mb-1">Option Status</p>
            <div className={`inline-block px-3 py-1 rounded-full border ${getStatusColor(Number(status || 0))}`}>
              <span className="font-semibold">{status !== undefined && status !== null ? statusNames[Number(status)] : '-'}</span>
            </div>
          </div>
          <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50 md:col-span-2">
            <p className="text-sm text-gray-400 mb-1">Issuer</p>
            <p className="font-semibold text-white break-all font-mono text-sm">
              {issuer ? `${issuer.slice(0, 6)}...${issuer.slice(-4)}` : '-'}
            </p>
          </div>
          <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50 md:col-span-2">
            <p className="text-sm text-gray-400 mb-1">Holder</p>
            <p className="font-semibold text-white break-all font-mono text-sm">
              {holder ? `${holder.slice(0, 6)}...${holder.slice(-4)}` : '-'}
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-700/50">
          <p className="text-sm text-gray-400 mb-3">Exercise Status</p>
          <div className={`inline-flex items-center px-4 py-2 rounded-lg border ${
            isExercisable 
              ? 'bg-green-500/20 text-green-400 border-green-500/30' 
              : 'bg-red-500/20 text-red-400 border-red-500/30'
          }`}>
            <span className="text-lg mr-2">{isExercisable ? '✅' : '❌'}</span>
            <span className="font-semibold">{isExercisable !== undefined && isExercisable !== null ? (isExercisable ? 'Exercisable' : 'Not exercisable') : '-'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

