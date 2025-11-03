// Client-side component marker for Next.js
'use client';

// Import React hooks for component state and side effects
import { useState, useEffect } from 'react';
// Import Wagmi hooks for wallet and contract interactions
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
// Import Viem utilities for parsing ether values and address type
import { parseEther, type Address } from 'viem';
// Import Next.js router for navigation
import { useRouter } from 'next/navigation';
// Import Next.js Link component for client-side navigation
import Link from 'next/link';
// Import token display component to show token information
import TokenDisplay from '../../components/TokenDisplay';

/**
 * Factory contract ABI - Application Binary Interface for smart contract interaction
 * 
 * ABI is the interface between Ethereum smart contracts and the external world.
 * It describes how to encode/decode function calls and events for contract interaction.
 * 
 * This ABI defines two important parts of the OptionFactory contract:
 * 1. createOption function - to create new option contracts
 * 2. OptionCreated event - emitted when an option is created
 */
const OPTION_FACTORY_ABI = [
  {
    "inputs": [ // Function input parameters (constructor arguments for new option)
      {"internalType": "address", "name": "_underlyingAsset", "type": "address"}, // Address of underlying asset token (UA)
      {"internalType": "address", "name": "_strikeAsset", "type": "address"}, // Address of strike asset token (SA)
      {"internalType": "uint256", "name": "_strikePrice", "type": "uint256"}, // Strike price in wei (e.g., 100 SA per UA)
      {"internalType": "uint256", "name": "_expirationTime", "type": "uint256"}, // Expiration Unix timestamp (in seconds)
      {"internalType": "uint256", "name": "_contractSize", "type": "uint256"} // Contract size in wei (quantity of underlying asset)
    ],
    "name": "createOption", // Function name to create a new European call option
    "outputs": [ // Function return values
      {"internalType": "uint256", "name": "optionId", "type": "uint256"}, // Unique ID of the created option
      {"internalType": "address", "name": "optionAddress", "type": "address"} // Address of the deployed option contract
    ],
    "stateMutability": "nonpayable", // Function doesn't accept ETH value (no payable)
    "type": "function" // This is a function definition
  },
  {
    "anonymous": false, // Event is not anonymous (has topic signature)
    "inputs": [ // Event parameters (emitted when option is created)
      {"indexed": true, "internalType": "uint256", "name": "optionId", "type": "uint256"}, // Option ID (indexed for filtering)
      {"indexed": true, "internalType": "address", "name": "optionAddress", "type": "address"}, // Option contract address (indexed)
      {"indexed": true, "internalType": "address", "name": "issuer", "type": "address"}, // Issuer address (indexed)
      {"indexed": false, "internalType": "address", "name": "underlyingAsset", "type": "address"}, // UA token address
      {"indexed": false, "internalType": "address", "name": "strikeAsset", "type": "address"}, // SA token address
      {"indexed": false, "internalType": "uint256", "name": "strikePrice", "type": "uint256"}, // Strike price parameter
      {"indexed": false, "internalType": "uint256", "name": "expirationTime", "type": "uint256"}, // Expiration timestamp
      {"indexed": false, "internalType": "uint256", "name": "contractSize", "type": "uint256"} // Contract size parameter
    ],
    "name": "OptionCreated", // Event name emitted when option is created
    "type": "event" // This is an event definition
  }
] as const; // 'as const' makes array readonly and preserves literal types for TypeScript

// Main create option page component
export default function CreateOptionPage() {
  const router = useRouter(); // Get router instance for navigation
  const { address, isConnected } = useAccount(); // Get wallet address and connection status
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract(); // Get contract write function and transaction state
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash }); // Wait for transaction confirmation

  const [factoryAddress, setFactoryAddress] = useState<string>(''); // Store factory contract address
  const [underlyingAssetType, setUnderlyingAssetType] = useState<string>('UA'); // Underlying asset type: UA or SA
  const [strikeAssetType, setStrikeAssetType] = useState<string>('SA'); // Strike asset type: UA or SA
  const [underlyingAsset, setUnderlyingAsset] = useState<string>(''); // Store underlying asset token address
  const [strikeAsset, setStrikeAsset] = useState<string>(''); // Store strike asset token address
  const [strikePrice, setStrikePrice] = useState<string>(''); // Store strike price input
  const [expirationDate, setExpirationDate] = useState<string>(''); // Store expiration date input
  const [expirationTime, setExpirationTime] = useState<string>(''); // Store expiration time input
  const [contractSize, setContractSize] = useState<string>(''); // Store contract size input
  const [error, setError] = useState<string>(''); // Store error message
  const [success, setSuccess] = useState<string>(''); // Store success message
  const [tokenAddresses, setTokenAddresses] = useState<{ // Store token addresses from deployment
    UA?: string; // Underlying asset token address
    SA?: string; // Strike asset token address
  }>({});

  // Load factory contract address and token addresses from deployment info
  useEffect(() => { // Execute when component mounts
    const loadDeploymentInfo = async () => { // Async function to load deployment data
      try {
        const response = await fetch('/api/deployment'); // Fetch deployment info from API
        const data = await response.json(); // Parse JSON response
        
        if (data.success && data.deployment) { // Check if deployment data exists
          // Load factory contract address
          if (data.deployment.contracts?.optionFactory?.address) { // Check if factory address exists
            setFactoryAddress(data.deployment.contracts.optionFactory.address); // Set factory address from API
          } else {
            const storedFactory = localStorage.getItem('factoryAddress'); // Try localStorage
            if (storedFactory) { // If found in storage
              setFactoryAddress(storedFactory); // Set factory address from storage
            } else {
              setError('Factory contract address not found. Please deploy factory contract first.'); // Set error message
            }
          }

          // Load token addresses
          const addresses: { UA?: string; SA?: string } = {}; // Initialize empty addresses object
          if (data.deployment.contracts?.underlyingAsset?.address) { // Check if UA exists
            addresses.UA = data.deployment.contracts.underlyingAsset.address; // Set UA address
          }
          if (data.deployment.contracts?.strikeAsset?.address) { // Check if SA exists
            addresses.SA = data.deployment.contracts.strikeAsset.address; // Set SA address
          }
          setTokenAddresses(addresses); // Store token addresses

          // If addresses are loaded, automatically set default values
          if (addresses.UA) { // If UA address exists
            setUnderlyingAsset(addresses.UA); // Set as default underlying asset
          }
          if (addresses.SA) { // If SA address exists
            setStrikeAsset(addresses.SA); // Set as default strike asset
          }
        } else {
          // Try to read from local storage
          const storedFactory = localStorage.getItem('factoryAddress'); // Get from localStorage
          if (storedFactory) { // If found
            setFactoryAddress(storedFactory); // Set factory address
          }
        }
      } catch (error: any) { // Handle any errors
        console.error('Failed to load deployment information:', error); // Log error
        const storedFactory = localStorage.getItem('factoryAddress'); // Try localStorage as fallback
        if (storedFactory) { // If found
          setFactoryAddress(storedFactory); // Set factory address from storage
        }
      }
    };
    
    loadDeploymentInfo(); // Call async function
  }, []); // Empty dependency array means run only once

  // When token type changes, update corresponding address
  useEffect(() => { // Execute when underlyingAssetType or tokenAddresses changes
    if (underlyingAssetType === 'UA' && tokenAddresses.UA) { // If UA selected and UA exists
      setUnderlyingAsset(tokenAddresses.UA); // Set UA address
    } else if (underlyingAssetType === 'SA' && tokenAddresses.SA) { // If SA selected and SA exists
      setUnderlyingAsset(tokenAddresses.SA); // Set SA address
    }
  }, [underlyingAssetType, tokenAddresses]); // Re-run when dependencies change

  useEffect(() => { // Execute when strikeAssetType or tokenAddresses changes
    if (strikeAssetType === 'UA' && tokenAddresses.UA) { // If UA selected and UA exists
      setStrikeAsset(tokenAddresses.UA); // Set UA address
    } else if (strikeAssetType === 'SA' && tokenAddresses.SA) { // If SA selected and SA exists
      setStrikeAsset(tokenAddresses.SA); // Set SA address
    }
  }, [strikeAssetType, tokenAddresses]); // Re-run when dependencies change

  // Redirect after transaction confirmation
  useEffect(() => { // Execute when isConfirmed changes
    if (isConfirmed) { // If transaction is confirmed
      setSuccess('Option created successfully! Redirecting...'); // Show success message
      setTimeout(() => { // Wait 2 seconds
        router.push('/'); // Navigate to home page
      }, 2000);
    }
  }, [isConfirmed, router]); // Re-run when dependencies change

  // Calculate expiration timestamp
  const calculateExpirationTimestamp = (): number => { // Convert date and time to Unix timestamp
    if (!expirationDate || !expirationTime) return 0; // Return 0 if not set
    
    const dateStr = `${expirationDate}T${expirationTime}`; // Combine date and time
    const date = new Date(dateStr); // Create Date object
    return Math.floor(date.getTime() / 1000); // Convert to Unix timestamp (seconds)
  };

  // Validate form
  const validateForm = (): boolean => { // Validate all form inputs
    if (!isConnected) { // Check if wallet is connected
      setError('Please connect wallet first'); // Set error message
      return false; // Return validation failure
    }

    if (!factoryAddress) { // Check if factory address exists
      setError('Factory contract address not found'); // Set error message
      return false; // Return validation failure
    }

    if (!underlyingAsset) { // Check if underlying asset selected
      setError('Please select underlying asset token'); // Set error message
      return false; // Return validation failure
    }

    if (!strikeAsset) { // Check if strike asset selected
      setError('Please select strike asset token'); // Set error message
      return false; // Return validation failure
    }

    if (underlyingAsset === strikeAsset) { // Check if assets are different
      setError('Underlying asset and strike asset cannot be the same'); // Set error message
      return false; // Return validation failure
    }

    if (!strikePrice || parseFloat(strikePrice) <= 0) { // Check if strike price is valid
      setError('Strike price must be greater than 0'); // Set error message
      return false; // Return validation failure
    }

    if (!contractSize || parseFloat(contractSize) <= 0) { // Check if contract size is valid
      setError('Contract size must be greater than 0'); // Set error message
      return false; // Return validation failure
    }

    const expTimestamp = calculateExpirationTimestamp(); // Calculate expiration timestamp
    if (expTimestamp <= Math.floor(Date.now() / 1000)) { // Check if expiration is in future
      setError('Expiration time must be in the future'); // Set error message
      return false; // Return validation failure
    }

    return true; // All validations passed
  };

  // Handle option creation
  const handleCreateOption = async () => { // Async function to create option
    setError(''); // Clear any existing errors
    setSuccess(''); // Clear any existing success messages

    if (!validateForm()) { // Validate form inputs
      return; // Exit if validation fails
    }

    try { // Try to create option
      const expTimestamp = calculateExpirationTimestamp(); // Calculate expiration timestamp from date/time
      const strikePriceWei = parseEther(strikePrice); // Convert strike price to wei
      const contractSizeWei = parseEther(contractSize); // Convert contract size to wei

      setSuccess('Creating option...'); // Show creating message

      await writeContract({ // Call factory contract to create option
        address: factoryAddress as Address, // Factory contract address
        abi: OPTION_FACTORY_ABI, // Contract ABI
        functionName: 'createOption', // Function to call
        args: [ // Constructor arguments
          underlyingAsset as Address, // Underlying asset token address
          strikeAsset as Address, // Strike asset token address
          strikePriceWei, // Strike price in wei
          BigInt(expTimestamp), // Expiration timestamp as BigInt
          contractSizeWei // Contract size in wei
        ],
      });

      setSuccess('Transaction submitted, waiting for confirmation...'); // Show waiting message
    } catch (error: any) { // Handle any errors
      const errorMessage = error?.shortMessage || error?.message || 'Failed to create option'; // Extract error message
      setError(errorMessage); // Set error message
      console.error('Failed to create option:', error); // Log error to console
    }
  };

  // Get minimum date (today)
  const getMinDate = (): string => { // Get today's date in YYYY-MM-DD format
    const today = new Date(); // Get current date
    return today.toISOString().split('T')[0]; // Return date part only
  };

  // Get default time (current time + 1 hour)
  const getDefaultDateTime = () => { // Get default date/time (1 hour from now)
    const now = new Date(); // Get current date/time
    now.setHours(now.getHours() + 1); // Add 1 hour
    return {
      date: now.toISOString().split('T')[0], // Return date in YYYY-MM-DD format
      time: now.toTimeString().slice(0, 5) // Return time in HH:MM format
    };
  };

  useEffect(() => { // Execute when component mounts
    const { date, time } = getDefaultDateTime(); // Get default date/time
    if (!expirationDate) setExpirationDate(date); // Set expiration date if not set
    if (!expirationTime) setExpirationTime(time); // Set expiration time if not set
  }, []); // Empty dependency array means run only once

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

