// Client-side component marker for Next.js
'use client';

// Import React hooks for component state and side effects
import { useState, useEffect } from 'react';
// Import Next.js navigation utilities for routing and URL params
import { useSearchParams, useRouter } from 'next/navigation';
// Import Next.js Link component for client-side navigation
import Link from 'next/link';
// Import wallet connection component
import WalletConnect from '../components/WalletConnect';
// Import option operations component (pay premium, exercise, etc.)
import OptionOperations from '../components/OptionOperations';
// Import option dashboard component (display option details)
import OptionDashboard from '../components/OptionDashboard';
// Import option list component (show all options from factory)
import OptionList from '../components/OptionList';
// Import Ethereum address type from Viem
import { type Address } from 'viem';

// Main home page component
export default function Home() {
  const router = useRouter(); // Get router instance for navigation
  const searchParams = useSearchParams(); // Get URL search parameters
  const [connectedAddress, setConnectedAddress] = useState<string | undefined>(); // Store connected wallet address
  const [selectedOption, setSelectedOption] = useState<string>(''); // Store currently selected option address
  const [factoryAddress, setFactoryAddress] = useState<string>(''); // Store factory contract address
  const [isLoadingFactory, setIsLoadingFactory] = useState(false); // Track factory loading state

  // Read selected option from URL parameters
  useEffect(() => { // Execute when component mounts or searchParams changes
    const optionParam = searchParams?.get('option'); // Get 'option' parameter from URL
    setSelectedOption(optionParam || ''); // Set selected option or empty string
  }, [searchParams]); // Re-run when searchParams changes

  // Update URL when returning to list
  const handleBackToList = () => { // Handler for back to list button
    setSelectedOption(''); // Clear selected option
    router.push('/'); // Navigate to home page
  };

  // Load factory contract address from deployment API or local storage
  const loadFactoryAddress = async () => {
    setIsLoadingFactory(true); // Set loading state to true
    
    try {
      const response = await fetch('/api/deployment'); // Fetch deployment info from API
      const data = await response.json(); // Parse JSON response
      
      if (data.success && data.deployment?.contracts?.optionFactory?.address) { // Check if factory address exists
        setFactoryAddress(data.deployment.contracts.optionFactory.address); // Set factory address from API
      } else {
        // Try to read from local storage
        const stored = localStorage.getItem('factoryAddress'); // Get factory address from localStorage
        if (stored) { // If found in storage
          setFactoryAddress(stored); // Set factory address from storage
        }
      }
    } catch (error: any) { // Handle any errors
      console.error('Failed to load factory address:', error); // Log error to console
      const stored = localStorage.getItem('factoryAddress'); // Try localStorage as fallback
      if (stored) { // If found in storage
        setFactoryAddress(stored); // Set factory address from storage
      }
    } finally {
      setIsLoadingFactory(false); // Always set loading state to false
    }
  };

  useEffect(() => { // Execute when component mounts
    loadFactoryAddress(); // Load factory address on mount
  }, []); // Empty dependency array means run only once

  // Callback after successful matching
  const handleMatchSuccess = () => { // Handler for successful option matching
    // Can add success notification here
    console.log('Option matched successfully'); // Log success message
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-md shadow-lg border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                EuropeanCallOption DeFi
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                European Call Option Trading Platform - Secure, Transparent, Efficient
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/create"
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-blue-500/50"
              >
                ➕ Create Option
              </Link>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                Sepolia Testnet
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Wallet Connection */}
        <div className="mb-8">
          <WalletConnect
            onConnect={(address) => setConnectedAddress(address)}
            onDisconnect={() => setConnectedAddress(undefined)}
          />
        </div>

        {/* Factory Address Input (Optional) */}
        {connectedAddress && !factoryAddress && (
          <div className="mb-8 p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Factory Contract Address
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter factory contract address (0x...)"
                value={factoryAddress}
                onChange={(e) => {
                  setFactoryAddress(e.target.value);
                  localStorage.setItem('factoryAddress', e.target.value);
                }}
                className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
              <button
                onClick={loadFactoryAddress}
                disabled={isLoadingFactory}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-blue-500/50"
              >
                {isLoadingFactory ? '⏳' : '🔄'} Load
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Please enter factory contract address to view and match options
            </p>
          </div>
        )}

        {/* Main Content */}
        {connectedAddress ? (
          <div className="space-y-8">
            {/* If there is a selected option, display details and operations */}
            {selectedOption && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold text-white flex items-center">
                    <svg className="w-6 h-6 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Option Details
                  </h2>
                  <button
                    onClick={handleBackToList}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-semibold transition-all"
                  >
                    Back to List
                  </button>
                </div>
                <OptionDashboard contractAddress={selectedOption as `0x${string}`} />
                
                <h2 className="text-2xl font-semibold mb-4 text-white flex items-center">
                  <svg className="w-6 h-6 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Option Operations
                </h2>
                <OptionOperations contractAddress={selectedOption as `0x${string}`} />
              </>
            )}

            {/* Option List */}
            {!selectedOption && (
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-white flex items-center">
                  <svg className="w-6 h-6 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Option List
                </h2>
                {factoryAddress ? (
                  <OptionList 
                    factoryAddress={factoryAddress as Address}
                    onMatchSuccess={handleMatchSuccess}
                  />
                ) : (
                  <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50">
                    <p className="text-gray-400 text-center">
                      Please set factory contract address first
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 mb-6 backdrop-blur-sm">
              <svg
                className="w-12 h-12 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-white mb-3">
              Connect Wallet to Get Started
            </h3>
            <p className="text-gray-400 max-w-md mx-auto mb-12 text-lg">
              Please connect your MetaMask wallet to access option features and view option status
            </p>
            
            {/* Feature highlights when not connected */}
            <div className="max-w-4xl mx-auto mt-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50 p-6 hover:shadow-xl hover:border-blue-500/30 transition-all">
                  <div className="flex flex-col items-center text-center">
                    <div className="flex items-center justify-center h-14 w-14 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white mb-4 shadow-lg">
                      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <p className="font-semibold text-white text-lg mb-2">Secure & Reliable</p>
                    <p className="text-sm text-gray-400">Smart contract security protection</p>
                  </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50 p-6 hover:shadow-xl hover:border-green-500/30 transition-all">
                  <div className="flex flex-col items-center text-center">
                    <div className="flex items-center justify-center h-14 w-14 rounded-lg bg-gradient-to-br from-green-500 to-green-600 text-white mb-4 shadow-lg">
                      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <p className="font-semibold text-white text-lg mb-2">Flexible Exercise</p>
                    <p className="text-sm text-gray-400">Exerciseable within 10 days after expiration</p>
                  </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50 p-6 hover:shadow-xl hover:border-purple-500/30 transition-all">
                  <div className="flex flex-col items-center text-center">
                    <div className="flex items-center justify-center h-14 w-14 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white mb-4 shadow-lg">
                      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                    <p className="font-semibold text-white text-lg mb-2">Option Transfer</p>
                    <p className="text-sm text-gray-400">Support transfer to other users</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-16 bg-slate-800/50 backdrop-blur-md border-t border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-400">
            <p className="font-medium text-gray-300">© 2025 EuropeanCallOption DeFi - Blockchain-Group-Project</p>
            <p className="mt-2 text-xs">
              For educational and demonstration purposes only | European Call Option | Exercise window: 10 days after expiration
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
