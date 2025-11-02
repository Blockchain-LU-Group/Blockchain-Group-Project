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

const { ethers } = require("hardhat");
const fs = require("fs");
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
  const [deployer] = await ethers.getSigners();
  const deploymentPath = path.join(__dirname, "..", "deployments", "sepolia_option.json");
  
  // Check if factory already exists in deployment file
  // This prevents duplicate deployments and saves gas costs
  if (fs.existsSync(deploymentPath)) {
    try {
      const existingDeployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
      const existingFactory = existingDeployment.contracts?.optionFactory?.address;
      if (existingFactory) {
        console.log("✅ Using existing factory contract:", existingFactory);
        return existingFactory;
      }
    } catch (error) {
      // Ignore parsing errors and continue with deployment
    }
  }
  
  // Deploy new factory contract
  // OptionFactory has no constructor parameters, making deployment simple
  const OptionFactory = await ethers.getContractFactory("OptionFactory");
  const factory = await OptionFactory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✅ Factory contract deployed:", factoryAddress);
  
  // Save deployment info to file (merge mode to preserve other contract info)
  // This allows multiple deployments to coexist in the same file
  let existingDeployment = {};
  if (fs.existsSync(deploymentPath)) {
    try {
      existingDeployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    } catch (error) {
      // Ignore parsing errors
    }
  }
  
  // Ensure deployment directory exists
  const deploymentDir = path.dirname(deploymentPath);
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }
  
  // Merge deployment info (preserve existing contracts like option contracts)
  const mergedDeployment = {
    ...existingDeployment,
    network: "sepolia",
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      ...existingDeployment.contracts,
      optionFactory: {
        address: factoryAddress
      }
    }
  };
  
  // Write merged deployment info to file
  fs.writeFileSync(deploymentPath, JSON.stringify(mergedDeployment, null, 2));
  console.log("📁 Factory address saved");
  
  return factoryAddress;
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
  const [deployer] = await ethers.getSigners();
  console.log("Deployer account:", deployer.address);
  
  // Check account balance to ensure sufficient funds for gas
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");
  
  try {
    // Call core deployment function
    const factoryAddress = await deployFactoryContract();
    
    // Get factory contract instance for verification
    const factory = await ethers.getContractAt("OptionFactory", factoryAddress);
    
    // Verify deployment by checking initial state
    console.log("\n2️⃣ Verifying deployment...");
    const optionCount = await factory.getOptionCount();
    console.log("✅ Option count:", optionCount.toString(), "(should be 0)");
    
    // Output deployment summary with Etherscan links
    console.log("\n" + "=".repeat(70));
    console.log("🎉 Deployment completed! Contract address summary:");
    console.log("=".repeat(70));
    console.log("Factory contract:", factoryAddress);
    console.log("\n🔗 Sepolia Etherscan:");
    console.log("• Factory contract:", `https://sepolia.etherscan.io/address/${factoryAddress}`);
    console.log("=".repeat(70));
    
    // Provide next steps for user
    console.log("\n💡 Next steps:");
    console.log("1. Run verification script to verify contract automatically:");
    console.log(`   npx hardhat verify --network sepolia ${factoryAddress}`);
    console.log("\n2. Create options through factory contract:");
    console.log("   Use frontend page to create, or call factory.createOption()");
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

// If this script is run directly, execute main function
// This allows the script to be both imported (for deployFactoryContract) and run directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

// Export function for use by other scripts
module.exports = { deployFactoryContract };
