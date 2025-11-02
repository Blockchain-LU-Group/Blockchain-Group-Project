'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import WalletConnect from '../components/WalletConnect';
import OptionOperations from '../components/OptionOperations';
import OptionDashboard from '../components/OptionDashboard';
import OptionList from '../components/OptionList';
import { type Address } from 'viem';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [connectedAddress, setConnectedAddress] = useState<string | undefined>();
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [factoryAddress, setFactoryAddress] = useState<string>('');
  const [isLoadingFactory, setIsLoadingFactory] = useState(false);

  // Read selected option from URL parameters
  useEffect(() => {
    const optionParam = searchParams?.get('option');
    setSelectedOption(optionParam || '');
  }, [searchParams]);

  // Update URL when returning to list
  const handleBackToList = () => {
    setSelectedOption('');
    router.push('/');
  };

  // Load factory contract address
  const loadFactoryAddress = async () => {
    setIsLoadingFactory(true);
    
    try {
      const response = await fetch('/api/deployment');
      const data = await response.json();
      
      if (data.success && data.deployment?.contracts?.optionFactory?.address) {
        setFactoryAddress(data.deployment.contracts.optionFactory.address);
      } else {
        // Try to read from local storage
        const stored = localStorage.getItem('factoryAddress');
        if (stored) {
          setFactoryAddress(stored);
        }
      }
    } catch (error: any) {
      console.error('Failed to load factory address:', error);
      const stored = localStorage.getItem('factoryAddress');
      if (stored) {
        setFactoryAddress(stored);
      }
    } finally {
      setIsLoadingFactory(false);
    }
  };

  useEffect(() => {
    loadFactoryAddress();
  }, []);

  // Callback after successful matching
  const handleMatchSuccess = () => {
    // Can add success notification here
    console.log('Option matched successfully');
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
