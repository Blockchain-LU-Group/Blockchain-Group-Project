/**
 * Deploy OptionFactory Contract to Sepolia Testnet
 * 
 * Description:
 * This script deploys the OptionFactory contract to Sepolia testnet and saves
 * the deployment information to deployments/sepolia_option.json.
 * 
 * The OptionFactory is responsible for creating and managing option instances.
 * It uses the factory pattern to enable efficient option creation and tracking.
 * 
 * Usage:
 *   npx hardhat run scripts/deploy_factory.js --network sepolia
 * 
 * Prerequisites:
 * 1. Configure .env file with:
 *    - SEPOLIA_RPC_URL: Sepolia RPC endpoint URL
 *    - PRIVATE_KEY: Deployer account private key (without 0x prefix)
 * 2. Ensure the deployer account has sufficient Sepolia ETH to pay for gas fees
 *    (recommended: at least 0.1 ETH)
 */

// Import Hardhat's ethers library for interacting with smart contracts
const { ethers } = require("hardhat");
// Import Node.js file system module for reading/writing deployment files
const fs = require("fs");
// Import Node.js path module for handling file system paths
const path = require("path");

/**
 * Core deployment function (concise output, suitable for being called by other scripts)
 * 
 * This function handles the actual deployment logic and can be imported and called
 * by other scripts (e.g., deploy_option.js) if they need to ensure a factory exists.
 * 
 * @returns {Promise<string>} The deployed factory contract address
 */
async function deployFactoryContract() {
  const [deployer] = await ethers.getSigners(); // Get deployer account (first signer)
  const deploymentPath = path.join(__dirname, "..", "deployments", "sepolia_option.json"); // Construct path to deployment file
  
  // Check if factory already exists in deployment file
  // This prevents duplicate deployments and saves gas costs
  if (fs.existsSync(deploymentPath)) { // Check if deployment file exists
    try {
      const existingDeployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8')); // Read and parse existing deployment info
      const existingFactory = existingDeployment.contracts?.optionFactory?.address; // Extract factory address using optional chaining
      if (existingFactory) { // Check if factory address exists
        console.log("✅ Using existing factory contract:", existingFactory);
        return existingFactory; // Return existing factory address
      }
    } catch (error) {
      // Ignore parsing errors and continue with deployment
    }
  }
  
  // Deploy new factory contract
  // OptionFactory has no constructor parameters, making deployment simple
  const OptionFactory = await ethers.getContractFactory("OptionFactory"); // Get contract factory for OptionFactory
  const factory = await OptionFactory.deploy(); // Deploy factory contract (no constructor arguments)
  await factory.waitForDeployment(); // Wait for deployment transaction to be mined
  const factoryAddress = await factory.getAddress(); // Get deployed factory contract address
  console.log("✅ Factory contract deployed:", factoryAddress);
  
  // Save deployment info to file (merge mode to preserve other contract info)
  // This allows multiple deployments to coexist in the same file
  let existingDeployment = {}; // Initialize empty object for existing deployment data
  if (fs.existsSync(deploymentPath)) { // Check if deployment file exists
    try {
      existingDeployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8')); // Read and parse existing deployment data
    } catch (error) {
      // Ignore parsing errors
    }
  }
  
  // Ensure deployment directory exists
  const deploymentDir = path.dirname(deploymentPath); // Get parent directory path
  if (!fs.existsSync(deploymentDir)) { // Check if directory exists
    fs.mkdirSync(deploymentDir, { recursive: true }); // Create directory recursively if it doesn't exist
  }
  
  // Merge deployment info (preserve existing contracts like option contracts)
  const mergedDeployment = {
    ...existingDeployment, // Spread existing deployment data
    network: "sepolia", // Set network name
    timestamp: new Date().toISOString(), // Set current timestamp in ISO format
    deployer: deployer.address, // Set deployer address
    contracts: { // Merge contract information
      ...existingDeployment.contracts, // Preserve existing contracts
      optionFactory: { // Add factory contract info
        address: factoryAddress // Factory contract address
      }
    }
  };
  
  // Write merged deployment info to file
  fs.writeFileSync(deploymentPath, JSON.stringify(mergedDeployment, null, 2)); // Write pretty-printed JSON with 2-space indent
  console.log("📁 Factory address saved");
  
  return factoryAddress; // Return factory address to caller
}

/**
 * Main function (full user experience with detailed output)
 * 
 * This is the entry point when the script is run directly. It provides
 * comprehensive feedback to the user including account info, deployment status,
 * and next steps.
 */
async function main() {
  console.log("🚀 Starting deployment of OptionFactory contract to Sepolia testnet...\n");
  
  // Get deployer account (first signer from Hardhat config)
  const [deployer] = await ethers.getSigners(); // Get first signer account from Hardhat network
  console.log("Deployer account:", deployer.address);
  
  // Check account balance to ensure sufficient funds for gas
  const balance = await deployer.provider.getBalance(deployer.address); // Query deployer account balance
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n"); // Format balance from wei to ETH
  
  try {
    // Call core deployment function
    const factoryAddress = await deployFactoryContract(); // Deploy or get existing factory address
    
    // Get factory contract instance for verification
    const factory = await ethers.getContractAt("OptionFactory", factoryAddress); // Get contract instance at address
    
    // Verify deployment by checking initial state
    console.log("\n2️⃣ Verifying deployment...");
    const optionCount = await factory.getOptionCount(); // Query current option count from factory
    console.log("✅ Option count:", optionCount.toString(), "(should be 0)"); // Should be 0 for new factory
    
    // Output deployment summary with Etherscan links
    console.log("\n" + "=".repeat(70)); // Print separator line
    console.log("🎉 Deployment completed! Contract address summary:");
    console.log("=".repeat(70));
    console.log("Factory contract:", factoryAddress);
    console.log("\n🔗 Sepolia Etherscan:");
    console.log("• Factory contract:", `https://sepolia.etherscan.io/address/${factoryAddress}`); // Print Etherscan link
    console.log("=".repeat(70));
    
    // Provide next steps for user
    console.log("\n💡 Next steps:");
    console.log("1. Run verification script to verify contract automatically:");
    console.log(`   npx hardhat verify --network sepolia ${factoryAddress}`); // Print verification command
    console.log("\n2. Create options through factory contract:");
    console.log("   Use frontend page to create, or call factory.createOption()");
    
  } catch (error) { // Handle deployment errors
    console.error("❌ Deployment failed:", error);
    process.exit(1); // Exit with error code
  }
}

// If this script is run directly, execute main function
// This allows the script to be both imported (for deployFactoryContract) and run directly
if (require.main === module) { // Check if script is being run directly (not imported)
  main() // Execute main function
    .then(() => process.exit(0)) // Exit with success code on completion
    .catch((error) => { // Catch any unhandled errors
      console.error(error); // Log error to console
      process.exit(1); // Exit with error code
    });
}

// Export function for use by other scripts
module.exports = { deployFactoryContract }; // Export deployFactoryContract function for external use
