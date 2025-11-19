/**
 * Automatically Verify Contract Source Code on Etherscan After Deployment
 * (Complies with R5 "verified contracts" requirement)
 * 
 * Description:
 * This script automatically verifies deployed contract source code on Etherscan,
 * making it publicly viewable and auditable. This is important for transparency
 * and trust in DeFi protocols.
 * 
 * Features:
 * 1. Reads deployment information from deployments/sepolia_option.json
 * 2. Uses Hardhat's verify task to verify contract source code
 * 3. After successful verification, contract source code can be viewed on Etherscan
 * 
 * Usage:
 *   npx hardhat run scripts/verify_contract.js --network sepolia
 * 
 * Prerequisites:
 * 1. Contract deployment completed (deployments/sepolia_option.json exists)
 * 2. .env file configured with:
 *    - ETHERSCAN_API_KEY: Etherscan API key (for contract verification)
 * 3. Ensure contract is on-chain with several block confirmations
 *    (usually wait a few minutes after deployment)
 * 
 * Verification Process:
 * 1. Read deployment record file
 * 2. Extract contract address and constructor arguments
 * 3. Call Hardhat verify task
 * 4. Wait for Etherscan API response
 * 5. After successful verification, contract shows as "Verified" on Etherscan
 */

// Import Hardhat's ethers library and run task runner for contract verification
const { ethers, run } = require("hardhat");
// Import Node.js file system module for reading deployment files
const fs = require("fs");
// Import Node.js path module for handling file system paths
const path = require("path");

async function main() {
  console.log("🔍 Starting contract verification on Etherscan...\n");

  // Read contract address and constructor arguments from deployment record file
  const deploymentPath = path.join(__dirname, "..", "deployments", "sepolia_option.json");

  // Check if deployment file exists
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ Deployment record file not found:", deploymentPath);
    console.log("Please run deployment script first: npx hardhat run scripts/deploy_option.js --network sepolia");
    process.exit(1);
  }

  // Read and parse deployment information JSON file
  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8")); // Read file and parse JSON content
  console.log("📋 Reading information from deployment file:", deploymentPath);
  console.log("Network:", deploymentInfo.network); // Log network name from deployment info
  console.log("Deployment time:", deploymentInfo.timestamp); // Log deployment timestamp
  console.log("");

  const optionContract = deploymentInfo.contracts?.europeanCallOption; // Extract option contract info using optional chaining
  if (!optionContract) { // Check if option contract info exists
    console.error("❌ europeanCallOption contract information not found in deployment file");
    process.exit(1); // Exit with error code if not found
  }

  const optionAddress = optionContract.address; // Get contract address from deployment info
  const constructorArgs = optionContract.constructorArgs; // Get constructor arguments from deployment info

  if (!optionAddress) { // Validate that address exists
    console.error("❌ Contract address not found in deployment file");
    process.exit(1); // Exit with error if address missing
  }

  if (!constructorArgs) { // Validate that constructor args exist
    console.error("❌ Constructor arguments not found in deployment file");
    console.log("Please manually execute verification command, or redeploy contract");
    process.exit(1); // Exit with error if constructor args missing
  }

  console.log("📋 Verification information:"); // Print verification info header
  console.log("Contract address:", optionAddress); // Print contract address
  console.log("Constructor arguments:"); // Print constructor args header
  console.log("  • Underlying Asset:", constructorArgs.underlyingAsset); // Print underlying asset address
  console.log("  • Strike Asset:", constructorArgs.strikeAsset); // Print strike asset address
  console.log("  • Strike Price:", constructorArgs.strikePrice); // Print strike price
  console.log("  • Expiration Time:", new Date(constructorArgs.expirationTime * 1000).toLocaleString('en-US')); // Convert timestamp to readable date
  console.log("  • Contract Size:", constructorArgs.contractSize); // Print contract size
  console.log("  • Holder:", constructorArgs.holder); // Print holder address
  console.log("");

  // Check API Key configuration
  if (!process.env.ETHERSCAN_API_KEY) { // Check if API key is configured
    console.error("❌ Error: ETHERSCAN_API_KEY not configured in .env file");
    console.log("Please add ETHERSCAN_API_KEY to .env file first");
    process.exit(1); // Exit with error if API key missing
  }

  // Retry verification (up to 3 times)
  let retryCount = 0; // Track number of retry attempts
  const maxRetries = 3; // Maximum number of retry attempts
  let lastError = null; // Store last error for debugging

  while (retryCount < maxRetries) { // Loop until max retries reached or success
    try {
      if (retryCount > 0) { // Check if this is a retry attempt
        console.log(`\n🔄 Retrying verification (${retryCount}/${maxRetries - 1})...`);
        // Wait 30 seconds before retry
        await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 10 seconds using Promise-based delay
      }

      console.log("1️⃣ Verifying EuropeanCallOption contract source code...");
      
      // Call Hardhat's verify:verify task to verify contract
      // This task submits contract source code and constructor arguments to Etherscan API
      await Promise.race([
        run("verify:verify", { // Execute Hardhat verify task
          address: optionAddress, // Contract address to verify
          constructorArguments: [ // Pass constructor arguments for verification
            constructorArgs.underlyingAsset,
            constructorArgs.strikeAsset,
            constructorArgs.strikePrice,
            constructorArgs.expirationTime,
            constructorArgs.contractSize,
            constructorArgs.holder
          ],
        }),
        // Set 90 second timeout to prevent hanging on slow networks
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Verification timeout after 90 seconds")), 90000) // Reject after 90s
        )
      ]); // Promise.race resolves/rejects with whichever completes first
      
      // Verification successful, output success message and break loop
      if (retryCount > 0) { // Check if retries were needed
        console.log(`\n✅ EuropeanCallOption contract verification successful! (after ${retryCount} retries)`);
      } else {
        console.log("\n✅ EuropeanCallOption contract verification successful!");
      }
      console.log("Etherscan link:", `https://sepolia.etherscan.io/address/${optionAddress}#code`);
      console.log("\n💡 Tip: Contract is verified, you can view the full source code on Etherscan");

      // If Mock tokens were deployed, also provide verification command hints
      const underlyingAsset = deploymentInfo.contracts?.underlyingAsset; // Extract underlying asset info if exists
      const strikeAsset = deploymentInfo.contracts?.strikeAsset; // Extract strike asset info if exists
      
      if (underlyingAsset || strikeAsset) { // Check if Mock tokens were deployed
        console.log("\n📝 Mock token verification commands (optional):");
        if (underlyingAsset) { // If underlying asset exists
          console.log(`   npx hardhat verify --network sepolia ${underlyingAsset.address} "Underlying Asset" "UA" ${ethers.parseEther("1000000")}`);
        }
        if (strikeAsset) { // If strike asset exists
          console.log(`   npx hardhat verify --network sepolia ${strikeAsset.address} "Strike Asset" "SA" ${ethers.parseEther("1000000")}`);
        }
      }
      
      // Verification successful, break loop
      break; // Exit retry loop on success

    } catch (error) { // Handle verification errors
      // Record error
      lastError = error; // Store error for debugging if all retries fail
      const errorMessage = error.message || String(error); // Extract error message or convert to string
      
      if (errorMessage.toLowerCase().includes("already verified")) { // Check if contract already verified
        // If contract is already verified, give prompt (not an error)
        console.log("\n✅ Contract is already verified");
        console.log("Etherscan link:", `https://sepolia.etherscan.io/address/${optionAddress}#code`);
        return; // Exit successfully since verification is already complete
      }
      
      retryCount++; // Increment retry counter
      
      if (retryCount >= maxRetries) { // Check if max retries reached
        // Reached maximum retries, output detailed error information
        console.error("\n❌ Verification failed (after " + (maxRetries - 1) + " retries):", errorMessage);
        
        // Analyze error type to provide helpful diagnostics
        if (errorMessage.toLowerCase().includes("timeout") || // Check for timeout-related errors
            errorMessage.toLowerCase().includes("connect timeout") ||
            errorMessage.toLowerCase().includes("connection") ||
            errorMessage.toLowerCase().includes("und_err_connect_timeout")) {
          console.log("\n🔍 Error type: Network connection timeout");
          console.log("\nPossible causes:");
          console.log("1. Etherscan API server is slow or temporarily unavailable");
          console.log("2. Unstable network connection or blocked by firewall");
          console.log("3. Need to configure proxy or VPN");
          console.log("4. API server is temporarily under maintenance");
          console.log("\n💡 Solutions:");
          console.log("Solution 1: Retry later (recommended)");
          console.log("  Wait a few minutes and re-run the verification script, API may be temporarily unavailable");
          console.log("\nSolution 2: Use manual verification");
          console.log("  Verify contract directly on Etherscan website:");
          console.log(`  1. Visit: https://sepolia.etherscan.io/address/${optionAddress}#code`);
          console.log("  2. Click 'Contract' tab");
          console.log("  3. Click 'Verify and Publish' button");
          console.log("  4. Select 'Via Standard JSON Input'");
          console.log("  5. Upload compiled JSON file (in artifacts/contracts/EuropeanCallOption.sol/EuropeanCallOption.json)");
          console.log("  6. Enter constructor arguments (see below)");
          console.log("\nSolution 3: Check network environment");
          console.log("  - Check if proxy needs to be configured");
          console.log("  - Check firewall settings");
          console.log("  - Try using VPN");
        } else if (errorMessage.toLowerCase().includes("api key")) {
          console.log("\n🔍 Error type: API Key issue");
          console.log("Possible causes:");
          console.log("1. API Key not configured");
          console.log("2. API Key invalid or expired");
          console.log("3. API Key rate limit exhausted");
        } else if (errorMessage.toLowerCase().includes("constructor")) {
          console.log("\n🔍 Error type: Constructor arguments mismatch");
          console.log("Possible causes:");
          console.log("1. Constructor arguments don't match deployment time");
          console.log("2. Parameter format error");
        } else {
          console.log("\nPossible causes:");
          console.log("1. Etherscan API Key not configured or incorrect");
          console.log("2. Contract not yet on-chain or insufficient confirmations (wait a few minutes and retry)");
          console.log("3. Constructor arguments mismatch");
          console.log("4. Network connection issue");
        }
        
        console.log("\n📋 Constructor arguments (for manual verification):");
        console.log("   underlyingAsset:", constructorArgs.underlyingAsset);
        console.log("   strikeAsset:", constructorArgs.strikeAsset);
        console.log("   strikePrice:", constructorArgs.strikePrice);
        console.log("   expirationTime:", constructorArgs.expirationTime);
        console.log("   contractSize:", constructorArgs.contractSize);
        console.log("   holder:", constructorArgs.holder);
        console.log("\n💻 Command line verification command (if network recovers):");
        console.log(`   npx hardhat verify --network sepolia ${optionAddress} ${constructorArgs.underlyingAsset} ${constructorArgs.strikeAsset} ${constructorArgs.strikePrice} ${constructorArgs.expirationTime} ${constructorArgs.contractSize} ${constructorArgs.holder}`);
        process.exit(1); // Exit with error code after max retries failed
      } else {
        // Still have retry opportunities
        console.log(`⚠️  Verification failed: ${errorMessage}`);
        console.log(`   Will retry in 5 seconds...`);
      }
    }
  }
}

// Execute verification: exit code 0 on success, exit code 1 on failure
main() // Run main function
  .then(() => process.exit(0)) // Exit with success code if verification completes
  .catch((error) => { // Catch and handle any unhandled errors
    console.error(error); // Log error to console
    process.exit(1); // Exit with error code
  });

