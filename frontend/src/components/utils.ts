import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS class names
 * @param inputs Class name parameters
 * @returns Merged class name string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format address display (show first 6 and last 4 characters)
 * @param address Full Ethereum address
 * @returns Formatted address string
 */
export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format token amount display
 * @param amount Token amount (in wei)
 * @param decimals Number of decimal places, default 4
 * @param symbol Token symbol
 * @returns Formatted amount string
 */
export function formatTokenAmount(
  amount: string | bigint | number,
  decimals: number = 4,
  symbol?: string
): string {
  if (!amount) return '0';
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  const formatted = numAmount.toFixed(decimals);
  
  return symbol ? `${formatted} ${symbol}` : formatted;
}

/**
 * Format timestamp to local time string
 * @param timestamp Unix timestamp (in seconds)
 * @returns Formatted time string
 */
export function formatTimestamp(timestamp: number | bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format duration (convert seconds to days/hours)
 * @param seconds Duration (in seconds)
 * @returns Formatted time string
 */
export function formatDuration(seconds: number | bigint): string {
  const totalSeconds = Number(seconds);
  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  
  if (days > 0) {
    return hours > 0 ? `${days} days ${hours} hours` : `${days} days`;
  } else if (hours > 0) {
    return `${hours} hours`;
  } else {
    const minutes = Math.floor(totalSeconds / 60);
    return minutes > 0 ? `${minutes} minutes` : `${totalSeconds} seconds`;
  }
}

/**
 * Get option status information
 * @param status Option status (0=Created, 1=Active, 2=Expired, 3=Exercised)
 * @returns Status information object
 */
export function getOptionStatusInfo(status: number) {
  const statusMap = {
    0: { status: 'created', color: 'blue', text: 'Created', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-800' },
    1: { status: 'active', color: 'green', text: 'Active', bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-800' },
    2: { status: 'expired', color: 'gray', text: 'Expired', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', textColor: 'text-gray-800' },
    3: { status: 'exercised', color: 'purple', text: 'Exercised', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', textColor: 'text-purple-800' },
  };
  
  return statusMap[status as keyof typeof statusMap] || { status: 'unknown', color: 'gray', text: 'Unknown', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', textColor: 'text-gray-800' };
}

/**
 * Check if address is a valid Ethereum address
 * @param address Address string
 * @returns Whether address is valid
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Truncate long text
 * @param text Original text
 * @param maxLength Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Copy text to clipboard
 * @param text Text to copy
 * @returns Promise<boolean> Whether copy was successful
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy text:', error);
    return false;
  }
}

/**
 * Get network configuration information
 * @param chainId Chain ID
 * @returns Network configuration object
 */
export function getNetworkConfig(chainId: number) {
  const networks = {
    1: { name: 'Ethereum Mainnet', shortName: 'ETH', explorer: 'https://etherscan.io' },
    11155111: { name: 'Sepolia Testnet', shortName: 'Sepolia', explorer: 'https://sepolia.etherscan.io' },
    31337: { name: 'Local Hardhat', shortName: 'Local', explorer: '' },
  };
  
  return networks[chainId as keyof typeof networks] || { name: 'Unknown Network', shortName: 'Unknown', explorer: '' };
}

/**
 * Format option expiration time display
 * @param expirationTime Expiration timestamp (in seconds)
 * @returns Formatted time string and countdown
 */
export function formatExpirationTime(expirationTime: number | bigint): { date: string; countdown: string; isExpired: boolean } {
  const expTime = Number(expirationTime);
  const now = Math.floor(Date.now() / 1000);
  const isExpired = now > expTime;
  
  const date = new Date(expTime * 1000).toLocaleString('en-US');
  
  if (isExpired) {
    const daysPassed = Math.floor((now - expTime) / (24 * 60 * 60));
    return { date, countdown: `Expired ${daysPassed} days ago`, isExpired: true };
  } else {
    const daysLeft = Math.floor((expTime - now) / (24 * 60 * 60));
    const hoursLeft = Math.floor(((expTime - now) % (24 * 60 * 60)) / (60 * 60));
    return { date, countdown: `Remaining: ${daysLeft} days ${hoursLeft} hours`, isExpired: false };
  }
}

/**
 * Generate random ID
 * @param length ID length
 * @returns Random ID string
 */
export function generateRandomId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}