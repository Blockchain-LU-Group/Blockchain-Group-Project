// Client-side component marker for Next.js
'use client';

// Import React hooks for component state, effects, and context
import React, { useState, useEffect } from 'react';
// Import Wagmi hooks for wallet and contract interactions
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
// Import Viem utilities for parsing/formatting ether values and address type
import { parseEther, formatEther, type Address } from 'viem';

/**
 * Contract ABI (simplified option contract ABI)
 * This ABI defines the interface for interacting with the EuropeanCallOption contract
 * Contains both read and write functions for option operations
 */
const EUROPEAN_CALL_OPTION_ABI = [
  {
    "inputs": [ // Constructor parameters (only used during deployment, not callable)
      {"internalType": "address", "name": "_underlyingAsset", "type": "address"}, // Underlying asset token address
      {"internalType": "address", "name": "_strikeAsset", "type": "address"}, // Strike asset token address
      {"internalType": "uint256", "name": "_strikePrice", "type": "uint256"}, // Strike price in wei
      {"internalType": "uint256", "name": "_expirationTime", "type": "uint256"}, // Expiration Unix timestamp
      {"internalType": "uint256", "name": "_contractSize", "type": "uint256"}, // Contract size in wei
      {"internalType": "address", "name": "_holder", "type": "address"} // Holder (buyer) address
    ],
    "name": "constructor", // Constructor function
    "type": "constructor" // This is a constructor definition
  },
  {
    "inputs": [{"internalType": "uint256", "name": "premium", "type": "uint256"}], // Premium amount in wei
    "name": "payPremium", // Function to pay premium and activate option
    "outputs": [], // No return values
    "stateMutability": "nonpayable", // Modifies state but doesn't accept ETH
    "type": "function" // This is a function definition
  },
  {
    "inputs": [], // No parameters
    "name": "exercised", // Function to exercise the option
    "outputs": [], // No return values
    "stateMutability": "nonpayable", // Modifies state but doesn't accept ETH
    "type": "function" // This is a function definition
  },
  {
    "inputs": [], // No parameters
    "name": "expireOption", // Function to manually expire option after exercise window
    "outputs": [], // No return values
    "stateMutability": "nonpayable", // Modifies state but doesn't accept ETH
    "type": "function" // This is a function definition
  },
  {
    "inputs": [], // No parameters
    "name": "isExercisable", // Check if option is currently exercisable
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], // Returns true if within exercise window
    "stateMutability": "view", // Read-only function
    "type": "function" // This is a function definition
  },
  {
    "inputs": [], // No parameters
    "name": "status", // Get current option lifecycle status
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}], // Returns status: 0=Created, 1=Active, 2=Expired, 3=Exercised
    "stateMutability": "view", // Read-only function
    "type": "function" // This is a function definition
  },
  {
    "inputs": [], // No parameters
    "name": "underlyingAsset", // Get underlying asset token address
    "outputs": [{"internalType": "address", "name": "", "type": "address"}], // Returns token address
    "stateMutability": "view", // Read-only function
    "type": "function" // This is a function definition
  },
  {
    "inputs": [], // No parameters
    "name": "strikeAsset", // Get strike asset token address
    "outputs": [{"internalType": "address", "name": "", "type": "address"}], // Returns token address
    "stateMutability": "view", // Read-only function
    "type": "function" // This is a function definition
  },
  {
    "inputs": [], // No parameters
    "name": "strikePrice", // Get strike price parameter
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], // Returns strike price in wei
    "stateMutability": "view", // Read-only function
    "type": "function" // This is a function definition
  },
  {
    "inputs": [], // No parameters
    "name": "contractSize", // Get contract size parameter
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], // Returns contract size in wei
    "stateMutability": "view", // Read-only function
    "type": "function" // This is a function definition
  },
  {
    "inputs": [], // No parameters
    "name": "holder", // Get holder (buyer) address
    "outputs": [{"internalType": "address", "name": "", "type": "address"}], // Returns holder address
    "stateMutability": "view", // Read-only function
    "type": "function" // This is a function definition
  },
  {
    "inputs": [], // No parameters
    "name": "issuer", // Get issuer (seller) address
    "outputs": [{"internalType": "address", "name": "", "type": "address"}], // Returns issuer address
    "stateMutability": "view", // Read-only function
    "type": "function" // This is a function definition
  },
  {
    "inputs": [], // No parameters
    "name": "expirationTime", // Get expiration timestamp
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], // Returns Unix timestamp in seconds
    "stateMutability": "view", // Read-only function
    "type": "function" // This is a function definition
  }
] as const;

/**
 * ERC20 ABI (for approval and balance queries)
 * This ABI defines the interface for interacting with ERC20 tokens
 * Standard ERC20 functions needed for token operations
 */
const ERC20_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"}, // Address to approve (contract address)
      {"internalType": "uint256", "name": "amount", "type": "uint256"} // Amount to approve in wei
    ],
    "name": "approve", // Function to approve token transfer
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], // Returns success boolean
    "stateMutability": "nonpayable", // Modifies state but doesn't accept ETH
    "type": "function" // This is a function definition
  },
  {
    "inputs": [
      {"internalType": "address", "name": "owner", "type": "address"}, // Token owner address
      {"internalType": "address", "name": "spender", "type": "address"} // Approved spender address
    ],
    "name": "allowance", // Query approved amount
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], // Returns approved amount in wei
    "stateMutability": "view", // Read-only function
    "type": "function" // This is a function definition
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}], // Account address to query
    "name": "balanceOf", // Query token balance
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], // Returns balance in wei
    "stateMutability": "view", // Read-only function
    "type": "function" // This is a function definition
  }
] as const;

// Main option operations component - provides UI for paying premium, exercising, and expiring options
export default function OptionOperations({ contractAddress }: { contractAddress?: Address }) {
  const { address, isConnected } = useAccount(); // Get wallet connection state
  const { writeContract, data: hash, isPending } = useWriteContract(); // Get contract write function and transaction state
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash }); // Wait for transaction confirmation

  const [premium, setPremium] = useState(''); // Store premium amount input
  const [error, setError] = useState<string>(''); // Store error message
  const [success, setSuccess] = useState<string>(''); // Store success message

  // Read option status (0=Created, 1=Active, 2=Expired, 3=Exercised)
  const { data: status } = useReadContract({
    address: contractAddress, // Option contract address
    abi: EUROPEAN_CALL_OPTION_ABI, // Contract ABI
    functionName: 'status', // Read status
    query: {
      enabled: !!contractAddress, // Only query if contract address exists
    },
  });

  // Read if option is exercisable (true if within exercise window)
  const { data: isExercisable } = useReadContract({
    address: contractAddress, // Option contract address
    abi: EUROPEAN_CALL_OPTION_ABI, // Contract ABI
    functionName: 'isExercisable', // Check exercisability
    query: {
      enabled: !!contractAddress, // Only query if contract address exists
    },
  });

  // Read strikeAsset address (for approval before premium/exercise)
  const { data: strikeAsset } = useReadContract({
    address: contractAddress, // Option contract address
    abi: EUROPEAN_CALL_OPTION_ABI, // Contract ABI
    functionName: 'strikeAsset', // Read strike asset token address
    query: {
      enabled: !!contractAddress, // Only query if contract address exists
    },
  });

  // Read underlyingAsset address (for checking issuer approval)
  const { data: underlyingAsset } = useReadContract({
    address: contractAddress, // Option contract address
    abi: EUROPEAN_CALL_OPTION_ABI, // Contract ABI
    functionName: 'underlyingAsset', // Read underlying asset token address
    query: {
      enabled: !!contractAddress, // Only query if contract address exists
    },
  });

  // Read strike price and contract size (for calculating exercise amount required)
  const { data: strikePrice } = useReadContract({
    address: contractAddress, // Option contract address
    abi: EUROPEAN_CALL_OPTION_ABI, // Contract ABI
    functionName: 'strikePrice', // Read strike price
    query: {
      enabled: !!contractAddress, // Only query if contract address exists
    },
  });

  const { data: contractSize } = useReadContract({
    address: contractAddress, // Option contract address
    abi: EUROPEAN_CALL_OPTION_ABI, // Contract ABI
    functionName: 'contractSize', // Read contract size
    query: {
      enabled: !!contractAddress, // Only query if contract address exists
    },
  });

  // Read holder address (buyer)
  const { data: holder } = useReadContract({
    address: contractAddress, // Option contract address
    abi: EUROPEAN_CALL_OPTION_ABI, // Contract ABI
    functionName: 'holder', // Read holder address
    query: {
      enabled: !!contractAddress, // Only query if contract address exists
    },
  });

  // Read issuer address (seller)
  const { data: issuer } = useReadContract({
    address: contractAddress,
    abi: EUROPEAN_CALL_OPTION_ABI,
    functionName: 'issuer',
    query: {
      enabled: !!contractAddress,
    },
  });

  // Read expiration time
  const { data: expirationTime } = useReadContract({
    address: contractAddress, // Option contract address
    abi: EUROPEAN_CALL_OPTION_ABI, // Contract ABI
    functionName: 'expirationTime', // Read expiration timestamp
    query: {
      enabled: !!contractAddress, // Only query if contract address exists
    },
  });

  // Check if current user is holder
  const isHolder = address && holder && typeof holder === 'string' && address.toLowerCase() === holder.toLowerCase(); // Compare addresses (case-insensitive)
  const isNotMatched = (typeof holder === 'string' && holder === '0x0000000000000000000000000000000000000000') || !holder; // Check if option is not matched yet
  
  // Check if current user is issuer
  const isIssuer = address && issuer && typeof issuer === 'string' && address.toLowerCase() === issuer.toLowerCase(); // Compare addresses (case-insensitive)

  // Read current user's approval amount for option contract (strikeAsset)
  const { data: allowance } = useReadContract({
    address: strikeAsset as Address | undefined, // Strike asset token address
    abi: ERC20_ABI, // ERC20 ABI
    functionName: 'allowance', // Check approval amount
    args: address && contractAddress ? [address, contractAddress] : undefined, // [owner, spender]
    query: {
      enabled: !!strikeAsset && !!address && !!contractAddress, // Only query if addresses exist
    },
  });

  // Read current user's strikeAsset balance
  const { data: strikeBalance } = useReadContract({
    address: strikeAsset as Address | undefined, // Strike asset token address
    abi: ERC20_ABI, // ERC20 ABI
    functionName: 'balanceOf', // Query balance
    args: address ? [address] : undefined, // [account]
    query: {
      enabled: !!strikeAsset && !!address, // Only query if addresses exist
    },
  });

  // Read issuer's approval amount for underlyingAsset (exercise requires issuer approval)
  const { data: issuerUnderlyingAllowance } = useReadContract({
    address: underlyingAsset as Address | undefined, // Underlying asset token address
    abi: ERC20_ABI, // ERC20 ABI
    functionName: 'allowance', // Check approval amount
    args: (typeof issuer === 'string' && contractAddress) ? [issuer as Address, contractAddress] : undefined, // [issuer, option contract]
    query: {
      enabled: !!underlyingAsset && typeof issuer === 'string' && !!contractAddress, // Only query if addresses exist
    },
  });

  // Read current user's (if Issuer) approval amount for underlyingAsset
  const { data: currentUserUnderlyingAllowance } = useReadContract({
    address: underlyingAsset as Address | undefined, // Underlying asset token address
    abi: ERC20_ABI, // ERC20 ABI
    functionName: 'allowance', // Check approval amount
    args: address && contractAddress ? [address, contractAddress] : undefined, // [issuer, option contract]
    query: {
      enabled: !!underlyingAsset && !!address && !!contractAddress && isIssuer, // Only query if issuer
    } as any,
  });

  // Read current user's (if Issuer) underlyingAsset balance
  const { data: underlyingBalance } = useReadContract({
    address: underlyingAsset as Address | undefined, // Underlying asset token address
    abi: ERC20_ABI, // ERC20 ABI
    functionName: 'balanceOf', // Query balance
    args: address ? [address] : undefined, // [account]
    query: {
      enabled: !!underlyingAsset && !!address && isIssuer, // Only query if issuer
    } as any,
  });

  const statusNames = ['Created', 'Active', 'Expired', 'Exercised']; // Status text mapping

  // Automatically clear messages after transaction confirmation
  useEffect(() => { // Execute when isConfirmed changes
    if (isConfirmed) { // Check if transaction confirmed
      const timer = setTimeout(() => { // Create 5 second timer
        setSuccess(''); // Clear success message
        setError(''); // Clear error message
      }, 5000); // Wait 5 seconds
      return () => clearTimeout(timer); // Cleanup: clear timer on unmount or dependency change
    }
  }, [isConfirmed]); // Re-run when isConfirmed changes

  /**
   * Handle premium payment
   * This function allows the holder to pay premium to activate the option
   */
  const handlePayPremium = async () => {
    if (!contractAddress || !premium || !strikeAsset || !address) {
      setError('Missing required parameters');
      return;
    }
    
    setError('');
    setSuccess('');
    
    try {
      const premiumAmount = parseEther(premium);
      
      // Check if balance is sufficient
      if (strikeBalance && strikeBalance < premiumAmount) {
        setError(`Insufficient balance. Current balance: ${formatEther(strikeBalance)}, required: ${premium}`);
        return;
      }

      // Check if approval amount is sufficient
      const currentAllowance = (allowance as bigint | undefined) || BigInt(0);
      if (currentAllowance < premiumAmount) {
        setSuccess('Approving tokens...');
        
        // Approve first (approve a large amount to avoid frequent approvals)
        const approveAmount = parseEther('1000000'); // Approve a sufficiently large amount
        const approveHash = await writeContract({
          address: strikeAsset as Address,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [contractAddress, approveAmount],
        });
        
        setSuccess('Waiting for approval confirmation...');
        
        // Wait for approval transaction confirmation (simplified handling here, should actually wait for transaction confirmation)
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      setSuccess('Paying premium...');
      
      // Pay premium
      await writeContract({
        address: contractAddress,
        abi: EUROPEAN_CALL_OPTION_ABI,
        functionName: 'payPremium',
        args: [premiumAmount],
      });
      
      setSuccess('Premium payment successful!');
      setPremium(''); // Clear input
    } catch (error: any) {
      const errorMessage = error?.shortMessage || error?.message || 'Premium payment failed';
      setError(errorMessage);
      console.error('Premium payment failed:', error);
    }
  };

  /**
   * Handle option exercise
   * This function allows the holder to exercise the option after expiration
   */
  const handleExercise = async () => {
    if (!contractAddress || !strikeAsset || !address || !strikePrice || !contractSize) {
      setError('Missing required parameters');
      return;
    }
    
    setError('');
    setSuccess('');
    
    try {
      // Calculate required strikeAsset amount for exercise
      // strikeAmount = strikePrice * contractSize / 1e18
      const strikePriceBigInt = strikePrice as bigint;
      const contractSizeBigInt = contractSize as bigint;
      const strikeAmount = (strikePriceBigInt * contractSizeBigInt) / parseEther('1');
      
      // Check if balance is sufficient
      if (strikeBalance && strikeBalance < strikeAmount) {
        setError(`Insufficient balance. Current balance: ${formatEther(strikeBalance)}, exercise requires: ${formatEther(strikeAmount)}`);
        return;
      }

      // Check if holder's approval amount for strikeAsset is sufficient
      const currentAllowance = (allowance as bigint | undefined) || BigInt(0);
      if (currentAllowance < strikeAmount) {
        setSuccess('Approving tokens...');
        
        // Approve first (approve a large amount)
        const approveAmount = parseEther('1000000');
        await writeContract({
          address: strikeAsset as Address,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [contractAddress, approveAmount],
        });
        
        setSuccess('Waiting for approval confirmation...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      // Check if issuer's approval amount for underlyingAsset is sufficient
      const issuerAllowance = (issuerUnderlyingAllowance as bigint | undefined) || BigInt(0);
      if (issuerAllowance < contractSizeBigInt) {
        const issuerAddr = typeof issuer === 'string' ? issuer : '';
        setError(
          `Exercise failed: Issuer (${issuerAddr ? `${issuerAddr.slice(0, 6)}...${issuerAddr.slice(-4)}` : 'unknown'}) has not approved underlying asset to option contract. ` +
          `Need to approve at least ${formatEther(contractSizeBigInt)} UA to contract address ${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}. ` +
          `Please notify Issuer to approve, or if you are the Issuer, please approve underlyingAsset before attempting to exercise.`
        );
        return;
      }
      
      setSuccess('Executing exercise...');
      
      // Exercise option
      await writeContract({
        address: contractAddress,
        abi: EUROPEAN_CALL_OPTION_ABI,
        functionName: 'exercised',
      });
      
      setSuccess('Exercise successful!');
    } catch (error: any) {
      const errorMessage = error?.shortMessage || error?.message || 'Exercise failed';
      setError(errorMessage);
      console.error('Exercise failed:', error);
    }
  };

  // Calculate if option can expire (after 10 days past expiration)
  const canExpire = React.useMemo(() => {
    if (!expirationTime || !status || Number(status) !== 1) {
      return false; // Must be in Active state
    }
    const expirationTimestamp = Number(expirationTime);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const exerciseWindowEnd = expirationTimestamp + (10 * 24 * 60 * 60); // Timestamp after 10 days
    return currentTimestamp > exerciseWindowEnd;
  }, [expirationTime, status]);

  // Calculate expiration-related information
  const expireInfo = React.useMemo(() => {
    if (!expirationTime) return null;
    
    const expirationTimestamp = Number(expirationTime);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const exerciseWindowEnd = expirationTimestamp + (10 * 24 * 60 * 60); // Timestamp after 10 days
    
    const expirationDate = new Date(expirationTimestamp * 1000);
    const windowEndDate = new Date(exerciseWindowEnd * 1000);
    
    const timeUntilExpiration = expirationTimestamp - currentTimestamp;
    const timeUntilCanExpire = exerciseWindowEnd - currentTimestamp;
    
    return {
      expirationDate,
      windowEndDate,
      timeUntilExpiration,
      timeUntilCanExpire,
      isExpired: currentTimestamp > expirationTimestamp,
      canExpire: currentTimestamp > exerciseWindowEnd,
    };
  }, [expirationTime]);

  // Format time difference
  const formatTimeDifference = (seconds: number): string => {
    if (seconds < 0) {
      seconds = Math.abs(seconds);
      const days = Math.floor(seconds / (24 * 60 * 60));
      const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
      const minutes = Math.floor((seconds % (60 * 60)) / 60);
      
      if (days > 0) return `${days} days ${hours} hours ago`;
      if (hours > 0) return `${hours} hours ${minutes} minutes ago`;
      return `${minutes} minutes ago`;
    } else {
      const days = Math.floor(seconds / (24 * 60 * 60));
      const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
      const minutes = Math.floor((seconds % (60 * 60)) / 60);
      
      if (days > 0) return `In ${days} days ${hours} hours`;
      if (hours > 0) return `In ${hours} hours ${minutes} minutes`;
      return `In ${minutes} minutes`;
    }
  };

  /**
   * Handle option expiration
   * This function marks the option as expired after the exercise window ends
   */
  const handleExpire = async () => {
    if (!contractAddress) return;
    
    setError('');
    setSuccess('');
    
    // Check if option can expire
    if (!canExpire) {
      setError('Option has not reached expirable state. Must wait 10 days after expiration before marking as expired.');
      return;
    }

    // Check if status is Active
    if (Number(status) !== 1) {
      setError('Option status must be Active to mark as expired.');
      return;
    }
    
    try {
      setSuccess('Marking as expired...');
      
      await writeContract({
        address: contractAddress,
        abi: EUROPEAN_CALL_OPTION_ABI,
        functionName: 'expireOption',
      });
      
      setSuccess('Option marked as expired!');
    } catch (error: any) {
      const errorMessage = error?.shortMessage || error?.message || 'Expiration failed';
      setError(errorMessage);
      console.error('Expiration failed:', error);
    }
  };

  /**
   * Handle underlying asset approval
   * This function allows the issuer to approve underlying asset to the option contract
   */
  const handleApproveUnderlying = async () => {
    if (!contractAddress || !underlyingAsset || !contractSize) {
      setError('Missing required parameters');
      return;
    }
    
    setError('');
    setSuccess('');
    
    try {
      // Calculate approval amount (2x contract size, with buffer)
      const approvalAmount = (contractSize as bigint) * BigInt(2);
      
      // Check if balance is sufficient
      if (underlyingBalance && underlyingBalance < approvalAmount) {
        setError(`Insufficient balance. Current balance: ${formatEther(underlyingBalance)}, approval required: ${formatEther(approvalAmount)}`);
        return;
      }
      
      setSuccess('Approving underlying asset...');
      
      // Approve underlyingAsset to option contract
      await writeContract({
        address: underlyingAsset as Address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [contractAddress, approvalAmount],
      });
      
      setSuccess('Approval successful!');
    } catch (error: any) {
      const errorMessage = error?.shortMessage || error?.message || 'Approval failed';
      setError(errorMessage);
      console.error('Approval failed:', error);
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 1: return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 2: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 3: return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (!isConnected) {
    return (
      <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50">
        <p className="text-gray-400">Please connect wallet first</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Unmatched notice */}
      {isNotMatched && (
        <div className="p-6 bg-yellow-500/20 backdrop-blur-sm rounded-xl shadow-lg border border-yellow-500/30">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-yellow-400 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">Option Not Matched</h3>
              <p className="text-sm text-yellow-300 mb-3">
                This option has not been matched yet. Please click the "Match Option" button in the option list on the homepage to become the holder.
              </p>
              <p className="text-xs text-yellow-400">
                After matching, you will be able to pay premium, exercise, and perform other operations.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Notice for users who are neither holder nor issuer */}
      {!isNotMatched && !isHolder && !isIssuer && address && (
        <div className="p-6 bg-blue-500/20 backdrop-blur-sm rounded-xl shadow-lg border border-blue-500/30">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-blue-400 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">You are not a participant in this option</h3>
              <p className="text-sm text-blue-300 mb-2">
                Current holder: <span className="font-mono">{typeof holder === 'string' ? `${holder.slice(0, 6)}...${holder.slice(-4)}` : 'Unknown'}</span>
              </p>
              <p className="text-sm text-blue-300 mb-2">
                Issuer: <span className="font-mono">{typeof issuer === 'string' ? `${issuer.slice(0, 6)}...${issuer.slice(-4)}` : 'Unknown'}</span>
              </p>
              <p className="text-xs text-blue-400 mt-2">
                Only holders can perform operations such as paying premium and exercising. Only issuers can approve underlying assets.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Issuer notice (for non-Issuer users) */}
      {!isIssuer && address && typeof issuer === 'string' && (
        <div className="p-6 bg-purple-500/20 backdrop-blur-sm rounded-xl shadow-lg border border-purple-500/30">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-purple-400 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-purple-400 mb-2">Approve Underlying Asset</h3>
              <p className="text-sm text-purple-300 mb-2">
                If you are the Issuer, please connect wallet using the Issuer address ({typeof issuer === 'string' ? `${issuer.slice(0, 6)}...${issuer.slice(-4)}` : 'Unknown'}) to approve underlying assets.
              </p>
              {contractSize && issuerUnderlyingAllowance !== undefined && (issuerUnderlyingAllowance as bigint) < (contractSize as bigint) ? (
                <p className="text-xs text-yellow-400 mt-2">
                  ⚠️ Current Issuer has not approved sufficient underlying assets, holder cannot exercise.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Option status */}
      <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50">
        <h2 className="text-xl font-bold mb-4 text-white">Option Status</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Status:</span>
            <div className={`px-3 py-1 rounded-full border ${getStatusColor(Number(status))}`}>
              <span className="font-semibold">{status !== undefined ? statusNames[Number(status)] : 'Loading...'}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Issuer:</span>
            <span className="font-semibold text-white font-mono text-sm">
              {typeof issuer === 'string' 
                ? `${issuer.slice(0, 6)}...${issuer.slice(-4)}` 
                : 'Loading...'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Holder:</span>
            <span className="font-semibold text-white font-mono text-sm">
              {typeof holder === 'string' && holder !== '0x0000000000000000000000000000000000000000' 
                ? `${holder.slice(0, 6)}...${holder.slice(-4)}` 
                : 'Not matched'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Exercisable:</span>
            <span className={`font-semibold ${(isExercisable as boolean) ? 'text-green-400' : 'text-red-400'}`}>
              {(isExercisable as boolean) ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          {/* Issuer approval status display */}
          {contractSize && issuerUnderlyingAllowance !== undefined ? (
            <div className="flex items-center justify-between pt-2 border-t border-slate-700">
              <span className="text-gray-400">Issuer Approval Status:</span>
              <span className={`font-semibold ${(issuerUnderlyingAllowance as bigint) >= (contractSize as bigint) ? 'text-green-400' : 'text-yellow-400'}`}>
                {(issuerUnderlyingAllowance as bigint) >= (contractSize as bigint) 
                  ? `✅ Approved (${formatEther(issuerUnderlyingAllowance as bigint)} UA)` 
                  : `⚠️ Not approved or insufficient (${formatEther((issuerUnderlyingAllowance as bigint) || BigInt(0))} UA)`}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Approve Underlying Asset - Only visible to issuer */}
      {isIssuer ? (
        <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50">
          <h2 className="text-xl font-bold mb-4 text-white">Approve Underlying Asset</h2>
          <p className="text-sm text-gray-400 mb-4">
            As the Issuer of the option, you need to approve underlying assets (UA) to the option contract so holders can exercise.
          </p>
          <div className="space-y-4">
            {underlyingBalance !== undefined && (
              <div className="text-sm text-gray-400 mb-2">
                Current balance: <span className="text-blue-400 font-semibold">{formatEther(underlyingBalance)} UA</span>
              </div>
            )}
            {currentUserUnderlyingAllowance !== undefined && (
              <div className="text-sm text-gray-400 mb-2">
                Approved amount: <span className="text-green-400 font-semibold">{formatEther(currentUserUnderlyingAllowance as bigint)} UA</span>
              </div>
            )}
            {contractSize ? (
              <div className="text-sm text-gray-400 mb-4">
                Need to approve at least: <span className="text-yellow-400 font-semibold">{formatEther(contractSize as bigint)} UA</span>
                <br />
                <span className="text-xs text-gray-500">(Will approve 2x contract size to leave buffer)</span>
              </div>
            ) : null}
            {contractSize && currentUserUnderlyingAllowance !== undefined && (currentUserUnderlyingAllowance as bigint) >= (contractSize as bigint) ? (
              <div className="text-sm text-green-400 bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                ✅ You have approved sufficient underlying assets, holder can exercise
              </div>
            ) : (
              <button
                onClick={handleApproveUnderlying}
                disabled={isPending || !underlyingAsset || !contractSize}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-purple-500/50"
              >
                {isPending ? '⏳ Transaction pending...' : '🔐 Approve Underlying Asset'}
              </button>
            )}
            {!underlyingAsset && (
              <p className="text-xs text-yellow-400">⚠️ Loading token information...</p>
            )}
          </div>
        </div>
      ) : null}

      {/* Pay Premium - Only visible to holder */}
      {isHolder ? (
        <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50">
          <h2 className="text-xl font-bold mb-4 text-white">Pay Premium</h2>
          <div className="space-y-4">
            {strikeBalance !== undefined && (
              <div className="text-sm text-gray-400 mb-2">
                Available balance: <span className="text-blue-400 font-semibold">{formatEther(strikeBalance)} SA</span>
              </div>
            )}
            {allowance !== undefined && (allowance as bigint) > BigInt(0) && (
              <div className="text-sm text-gray-400 mb-2">
                Approved amount: <span className="text-green-400 font-semibold">{formatEther(allowance as bigint)} SA</span>
              </div>
            )}
            <input
              type="text"
              placeholder="Premium amount (e.g., 10)"
              value={premium}
              onChange={(e) => {
                setPremium(e.target.value);
                setError('');
                setSuccess('');
              }}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handlePayPremium}
              disabled={isPending || !premium || !strikeAsset}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-blue-500/50"
            >
              {isPending ? '⏳ Transaction pending...' : '💰 Pay Premium'}
            </button>
            {!strikeAsset && (
              <p className="text-xs text-yellow-400">⚠️ Loading token information...</p>
            )}
          </div>
        </div>
      ) : null}

      {/* Exercise Option - Only visible to holder */}
      {isHolder ? (
        <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50">
          <h2 className="text-xl font-bold mb-4 text-white">Exercise Option</h2>
          {strikePrice && contractSize ? (
            <div className="mb-3 text-sm text-gray-400">
              Exercise requires: <span className="text-green-400 font-semibold">
                {formatEther(((strikePrice as bigint) * (contractSize as bigint)) / parseEther('1'))} SA
              </span>
            </div>
          ) : null}
          {/* Display Issuer approval status */}
          {contractSize && issuerUnderlyingAllowance !== undefined ? (
            <div className="mb-3">
              {(issuerUnderlyingAllowance as bigint) >= (contractSize as bigint) ? (
                <div className="text-xs text-green-400 bg-green-500/10 border border-green-500/30 rounded-lg p-2">
                  ✅ Issuer has approved underlying asset ({formatEther(issuerUnderlyingAllowance as bigint)} UA)
                </div>
              ) : (
                <div className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2">
                  ⚠️ Issuer approval insufficient: {formatEther((issuerUnderlyingAllowance as bigint) || BigInt(0))} UA / Required {formatEther(contractSize as bigint)} UA
                  <br />
                  <span className="text-yellow-300">Please notify Issuer ({typeof issuer === 'string' ? `${issuer.slice(0, 6)}...${issuer.slice(-4)}` : 'Unknown'}) to approve underlying asset to option contract</span>
                </div>
              )}
            </div>
          ) : null}
          <button
            onClick={handleExercise}
            disabled={!!(isPending || !(isExercisable as boolean) || !strikeAsset || (contractSize && issuerUnderlyingAllowance !== undefined && (issuerUnderlyingAllowance as bigint) < (contractSize as bigint)))}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-green-500/50"
          >
            {isPending ? '⏳ Transaction pending...' : '⚡ Exercise'}
          </button>
          {!(isExercisable as boolean) && (
            <p className="mt-2 text-sm text-gray-400">⚠️ Currently not in exercise window</p>
          )}
          {!strikeAsset && (
            <p className="mt-2 text-xs text-yellow-400">⚠️ Loading token information...</p>
          )}
        </div>
      ) : null}

      {/* Expiration Handling */}
      <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50">
        <h2 className="text-xl font-bold mb-4 text-white">Expiration Handling</h2>
        
        {expireInfo && (
          <div className="mb-4 space-y-2">
            <div className="text-sm text-gray-400">
              <span className="font-semibold">Expiration time:</span>{' '}
              <span className="text-white">{expireInfo.expirationDate.toLocaleString('en-US')}</span>
            </div>
            {expireInfo.isExpired ? (
              <div className="text-sm">
                <span className="text-red-400">✅ Option has expired</span>
                <br />
                <span className="text-gray-400">
                  Exercise window end time: {expireInfo.windowEndDate.toLocaleString('en-US')}
                </span>
                {expireInfo.canExpire ? (
                  <div className="mt-2 text-green-400">
                    ✓ Can be marked as expired
                  </div>
                ) : (
                  <div className="mt-2 text-yellow-400">
                    ⚠️ Need to wait {formatTimeDifference(expireInfo.timeUntilCanExpire)} before marking as expired
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-yellow-400">
                ⏳ Time until expiration: {formatTimeDifference(expireInfo.timeUntilExpiration)}
              </div>
            )}
          </div>
        )}

        {Number(status) === 1 ? (
          canExpire ? (
            <button
              onClick={handleExpire}
              disabled={isPending}
              className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-gray-600 hover:to-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-gray-500/50"
            >
              {isPending ? '⏳ Transaction pending...' : '⏰ Mark as Expired'}
            </button>
          ) : (
            <div className="p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-400">
                ⚠️ Option has not reached expirable state
              </p>
              <p className="text-xs text-yellow-300 mt-1">
                Must wait 10 days after expiration before marking as expired.
                {expireInfo && expireInfo.isExpired && (
                  <> Need to wait {formatTimeDifference(expireInfo.timeUntilCanExpire)}</>
                )}
              </p>
            </div>
          )
        ) : Number(status) === 2 ? (
          <div className="p-3 bg-gray-500/20 border border-gray-500/30 rounded-lg">
            <p className="text-sm text-gray-400">✓ Option is already in expired state</p>
          </div>
        ) : (
          <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-400">
              Only Active status options can be marked as expired
            </p>
            <p className="text-xs text-blue-300 mt-1">
              Current status: {statusNames[Number(status)]}
            </p>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-500/20 backdrop-blur-sm rounded-lg border border-red-500/30">
          <p className="text-sm text-red-400 font-semibold mb-1">❌ Error</p>
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Success message */}
      {success && !hash && (
        <div className="p-4 bg-green-500/20 backdrop-blur-sm rounded-lg border border-green-500/30">
          <p className="text-sm text-green-400">{success}</p>
        </div>
      )}

      {/* Transaction status */}
      {hash && (
        <div className="p-4 bg-green-500/20 backdrop-blur-sm rounded-lg border border-green-500/30">
          <p className="text-sm text-green-400">
            Transaction hash: <a href={`https://sepolia.etherscan.io/tx/${hash}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300 font-mono break-all">{hash}</a>
          </p>
          {isConfirming && <p className="text-sm mt-2 text-yellow-400">⏳ Waiting for confirmation...</p>}
          {isConfirmed && (
            <>
              <p className="text-sm mt-2 text-green-400">✅ Transaction confirmed</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}


