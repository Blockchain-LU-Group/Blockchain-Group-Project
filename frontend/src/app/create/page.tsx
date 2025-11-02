'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, type Address } from 'viem';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TokenDisplay from '../../components/TokenDisplay';

// Factory contract ABI
const OPTION_FACTORY_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "_underlyingAsset", "type": "address"},
      {"internalType": "address", "name": "_strikeAsset", "type": "address"},
      {"internalType": "uint256", "name": "_strikePrice", "type": "uint256"},
      {"internalType": "uint256", "name": "_expirationTime", "type": "uint256"},
      {"internalType": "uint256", "name": "_contractSize", "type": "uint256"}
    ],
    "name": "createOption",
    "outputs": [
      {"internalType": "uint256", "name": "optionId", "type": "uint256"},
      {"internalType": "address", "name": "optionAddress", "type": "address"}
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "optionId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "optionAddress", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "issuer", "type": "address"},
      {"indexed": false, "internalType": "address", "name": "underlyingAsset", "type": "address"},
      {"indexed": false, "internalType": "address", "name": "strikeAsset", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "strikePrice", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "expirationTime", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "contractSize", "type": "uint256"}
    ],
    "name": "OptionCreated",
    "type": "event"
  }
] as const;

export default function CreateOptionPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const [factoryAddress, setFactoryAddress] = useState<string>('');
  const [underlyingAssetType, setUnderlyingAssetType] = useState<string>('UA'); // UA or SA
  const [strikeAssetType, setStrikeAssetType] = useState<string>('SA'); // UA or SA
  const [underlyingAsset, setUnderlyingAsset] = useState<string>('');
  const [strikeAsset, setStrikeAsset] = useState<string>('');
  const [strikePrice, setStrikePrice] = useState<string>('');
  const [expirationDate, setExpirationDate] = useState<string>('');
  const [expirationTime, setExpirationTime] = useState<string>('');
  const [contractSize, setContractSize] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [tokenAddresses, setTokenAddresses] = useState<{
    UA?: string;
    SA?: string;
  }>({});

  // Load factory contract address and token addresses from deployment info
  useEffect(() => {
    const loadDeploymentInfo = async () => {
      try {
        const response = await fetch('/api/deployment');
        const data = await response.json();
        
        if (data.success && data.deployment) {
          // Load factory contract address
          if (data.deployment.contracts?.optionFactory?.address) {
            setFactoryAddress(data.deployment.contracts.optionFactory.address);
          } else {
            const storedFactory = localStorage.getItem('factoryAddress');
            if (storedFactory) {
              setFactoryAddress(storedFactory);
            } else {
              setError('Factory contract address not found. Please deploy factory contract first.');
            }
          }

          // Load token addresses
          const addresses: { UA?: string; SA?: string } = {};
          if (data.deployment.contracts?.underlyingAsset?.address) {
            addresses.UA = data.deployment.contracts.underlyingAsset.address;
          }
          if (data.deployment.contracts?.strikeAsset?.address) {
            addresses.SA = data.deployment.contracts.strikeAsset.address;
          }
          setTokenAddresses(addresses);

          // If addresses are loaded, automatically set default values
          if (addresses.UA) {
            setUnderlyingAsset(addresses.UA);
          }
          if (addresses.SA) {
            setStrikeAsset(addresses.SA);
          }
        } else {
          // Try to read from local storage
          const storedFactory = localStorage.getItem('factoryAddress');
          if (storedFactory) {
            setFactoryAddress(storedFactory);
          }
        }
      } catch (error: any) {
        console.error('Failed to load deployment information:', error);
        const storedFactory = localStorage.getItem('factoryAddress');
        if (storedFactory) {
          setFactoryAddress(storedFactory);
        }
      }
    };
    
    loadDeploymentInfo();
  }, []);

  // When token type changes, update corresponding address
  useEffect(() => {
    if (underlyingAssetType === 'UA' && tokenAddresses.UA) {
      setUnderlyingAsset(tokenAddresses.UA);
    } else if (underlyingAssetType === 'SA' && tokenAddresses.SA) {
      setUnderlyingAsset(tokenAddresses.SA);
    }
  }, [underlyingAssetType, tokenAddresses]);

  useEffect(() => {
    if (strikeAssetType === 'UA' && tokenAddresses.UA) {
      setStrikeAsset(tokenAddresses.UA);
    } else if (strikeAssetType === 'SA' && tokenAddresses.SA) {
      setStrikeAsset(tokenAddresses.SA);
    }
  }, [strikeAssetType, tokenAddresses]);

  // Redirect after transaction confirmation
  useEffect(() => {
    if (isConfirmed) {
      setSuccess('Option created successfully! Redirecting...');
      setTimeout(() => {
        router.push('/');
      }, 2000);
    }
  }, [isConfirmed, router]);

  // Calculate expiration timestamp
  const calculateExpirationTimestamp = (): number => {
    if (!expirationDate || !expirationTime) return 0;
    
    const dateStr = `${expirationDate}T${expirationTime}`;
    const date = new Date(dateStr);
    return Math.floor(date.getTime() / 1000);
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!isConnected) {
      setError('Please connect wallet first');
      return false;
    }

    if (!factoryAddress) {
      setError('Factory contract address not found');
      return false;
    }

    if (!underlyingAsset) {
      setError('Please select underlying asset token');
      return false;
    }

    if (!strikeAsset) {
      setError('Please select strike asset token');
      return false;
    }

    if (underlyingAsset === strikeAsset) {
      setError('Underlying asset and strike asset cannot be the same');
      return false;
    }

    if (!strikePrice || parseFloat(strikePrice) <= 0) {
      setError('Strike price must be greater than 0');
      return false;
    }

    if (!contractSize || parseFloat(contractSize) <= 0) {
      setError('Contract size must be greater than 0');
      return false;
    }

    const expTimestamp = calculateExpirationTimestamp();
    if (expTimestamp <= Math.floor(Date.now() / 1000)) {
      setError('Expiration time must be in the future');
      return false;
    }

    return true;
  };

  // Handle option creation
  const handleCreateOption = async () => {
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    try {
      const expTimestamp = calculateExpirationTimestamp();
      const strikePriceWei = parseEther(strikePrice);
      const contractSizeWei = parseEther(contractSize);

      setSuccess('Creating option...');

      await writeContract({
        address: factoryAddress as Address,
        abi: OPTION_FACTORY_ABI,
        functionName: 'createOption',
        args: [
          underlyingAsset as Address,
          strikeAsset as Address,
          strikePriceWei,
          BigInt(expTimestamp),
          contractSizeWei
        ],
      });

      setSuccess('Transaction submitted, waiting for confirmation...');
    } catch (error: any) {
      const errorMessage = error?.shortMessage || error?.message || 'Failed to create option';
      setError(errorMessage);
      console.error('Failed to create option:', error);
    }
  };

  // Get minimum date (today)
  const getMinDate = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get default time (current time + 1 hour)
  const getDefaultDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return {
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5)
    };
  };

  useEffect(() => {
    const { date, time } = getDefaultDateTime();
    if (!expirationDate) setExpirationDate(date);
    if (!expirationTime) setExpirationTime(time);
  }, []);

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-4">Create Option</h1>
            <p className="text-gray-400 mb-8">Please connect wallet first</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Create Option
          </h1>
          <p className="mt-2 text-gray-400">
            Fill in option parameters to create a new European call option
          </p>
        </div>

        {/* Form */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50 p-6">
          <div className="space-y-6">
            {/* Factory Contract Address (Display, Read-only) */}
            {factoryAddress ? (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Factory Contract Address
                </label>
                <div className="w-full px-4 py-3 bg-slate-700/30 border border-slate-600/50 rounded-lg text-gray-300 font-mono text-sm">
                  {factoryAddress}
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Factory contract address has been automatically loaded
                </p>
              </div>
            ) : (
              <div className="p-4 bg-yellow-500/20 backdrop-blur-sm rounded-lg border border-yellow-500/30">
                <p className="text-sm text-yellow-400">
                  ⚠️ Factory contract address not found. Please deploy factory contract first.
                </p>
              </div>
            )}

            {/* Underlying Asset Token Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Underlying Asset Token <span className="text-red-400">*</span>
              </label>
              <select
                value={underlyingAssetType}
                onChange={(e) => {
                  setUnderlyingAssetType(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="UA">UA (Underlying Asset)</option>
                <option value="SA">SA (Strike Asset)</option>
              </select>
              {underlyingAsset ? (
                <div className="mt-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/50">
                  <TokenDisplay 
                    address={underlyingAsset as Address}
                    symbol={underlyingAssetType}
                    size="md"
                    showAddress={true}
                  />
                </div>
              ) : (
                <p className="mt-1 text-xs text-yellow-400">
                  ⚠️ {underlyingAssetType} token address not found
                </p>
              )}
            </div>

            {/* Strike Asset Token Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Strike Asset Token <span className="text-red-400">*</span>
              </label>
              <select
                value={strikeAssetType}
                onChange={(e) => {
                  setStrikeAssetType(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="UA">UA (Underlying Asset)</option>
                <option value="SA">SA (Strike Asset)</option>
              </select>
              {strikeAsset ? (
                <div className="mt-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/50">
                  <TokenDisplay 
                    address={strikeAsset as Address}
                    symbol={strikeAssetType}
                    size="md"
                    showAddress={true}
                  />
                </div>
              ) : (
                <p className="mt-1 text-xs text-yellow-400">
                  ⚠️ {strikeAssetType} token address not found
                </p>
              )}
            </div>

            {/* Strike Price and Contract Size */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Strike Price <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.0001"
                  placeholder="e.g., 100"
                  value={strikePrice}
                  onChange={(e) => {
                    setStrikePrice(e.target.value);
                    setError('');
                  }}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contract Size <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.0001"
                  placeholder="e.g., 1"
                  value={contractSize}
                  onChange={(e) => {
                    setContractSize(e.target.value);
                    setError('');
                  }}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Expiration Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Expiration Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  min={getMinDate()}
                  value={expirationDate}
                  onChange={(e) => {
                    setExpirationDate(e.target.value);
                    setError('');
                  }}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Expiration Time <span className="text-red-400">*</span>
                </label>
                <input
                  type="time"
                  value={expirationTime}
                  onChange={(e) => {
                    setExpirationTime(e.target.value);
                    setError('');
                  }}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Expiration Time Preview */}
            {expirationDate && expirationTime && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-400">
                  <span className="font-semibold">Expiration Timestamp:</span>{' '}
                  {new Date(calculateExpirationTimestamp() * 1000).toLocaleString('en-US')}
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/20 backdrop-blur-sm rounded-lg border border-red-500/30">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-4 bg-green-500/20 backdrop-blur-sm rounded-lg border border-green-500/30">
                <p className="text-sm text-green-400">{success}</p>
              </div>
            )}

            {/* Transaction Hash */}
            {hash && (
              <div className="p-4 bg-green-500/20 backdrop-blur-sm rounded-lg border border-green-500/30">
                <p className="text-sm text-green-400 mb-2">
                  Transaction Hash:{' '}
                  <a
                    href={`https://sepolia.etherscan.io/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-green-300 font-mono break-all"
                  >
                    {hash}
                  </a>
                </p>
                {isConfirming && <p className="text-sm text-yellow-400">⏳ Waiting for confirmation...</p>}
                {isConfirmed && <p className="text-sm text-green-400">✅ Transaction confirmed</p>}
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleCreateOption}
              disabled={isPending || isConfirming || !factoryAddress || !underlyingAsset || !strikeAsset}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-blue-500/50"
            >
              {isPending || isConfirming ? '⏳ Creating...' : '🚀 Create Option'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

