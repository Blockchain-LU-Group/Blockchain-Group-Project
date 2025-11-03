/**
 * Automated Contract Deployment to Sepolia Testnet
 * 
 * Description:
 * This script automates the complete deployment process for the European Call Option
 * DeFi project to Sepolia testnet. It handles:
 * 0. Check and deploy OptionFactory contract (if it doesn't exist)
 * 1. Deploy Mock ERC20 tokens (Underlying Asset UA and Strike Asset SA)
 * 2. Distribute tokens to Issuer and Holder accounts
 * 3. Deploy EuropeanCallOption contract
 * 4. Set up Issuer approvals (required for exercise)
 * 5. Save deployment information to deployments/sepolia_option.json
 * 
 * Usage:
 *   npx hardhat run scripts/deploy_option.js --network sepolia
 * 
 * Prerequisites:
 * 1. Configure .env file with:
 *    - SEPOLIA_RPC_URL: Sepolia RPC endpoint URL
 *    - PRIVATE_KEY: Deployer account private key (Issuer, without 0x prefix)
 * 2. Ensure the deployer account has sufficient Sepolia ETH to pay for gas fees
 *    (recommended: at least 0.1 ETH)
 * 
 * Optional Environment Variables:
 *   OPTION_FACTORY_ADDRESS: Factory contract address (skip factory deployment if already deployed)
 *   UNDERLYING_ASSET: Underlying asset token address (skip Mock token deployment if exists)
 *   STRIKE_ASSET: Strike asset token address (skip Mock token deployment if exists)
 *   HOLDER_ADDRESS: Holder address (default: deployer address)
 *   ISSUER_ADDRESS: Issuer address (default: deployer address)
 */

// Import Hardhat's ethers library for interacting with smart contracts
const { ethers } = require("hardhat");
// Import Node.js file system module for reading/writing deployment files
const fs = require("fs");
// Import Node.js path module for handling file system paths
const path = require("path");
// Import factory deployment function from deploy_factory.js
const { deployFactoryContract } = require("./deploy_factory.js");

async function main() {
  console.log("🚀 Starting deployment of EuropeanCallOption contract to Sepolia testnet...\n");

  // Get deployer account (Issuer)
  const [deployer] = await ethers.getSigners();
  console.log("Deployer account (Issuer):", deployer.address);
  
  // Query balance to ensure sufficient gas fees
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  // Read addresses from environment variables (if tokens already exist, can use existing addresses)
  const existingUnderlying = process.env.UNDERLYING_ASSET; // Get existing underlying asset address from env var
  const existingStrike = process.env.STRIKE_ASSET; // Get existing strike asset address from env var
  const holderAddress = process.env.HOLDER_ADDRESS || deployer.address; // Holder address or default to deployer
  const issuerAddress = process.env.ISSUER_ADDRESS || deployer.address; // Issuer address or default to deployer

  // Option parameter configuration
  const strikePrice = ethers.parseEther("100"); // Convert 100 to wei, represents price per underlying asset in strike asset
  const expirationTime = Math.floor(Date.now() / 1000) + 30 * 24 * 3600; // Calculate Unix timestamp for 30 days from now
  const contractSize = ethers.parseEther("1"); // Convert 1 to wei, represents the quantity of underlying asset in this option

  let underlyingAddress, strikeAddress; // Store deployed token contract addresses
  let underlyingToken, strikeToken; // Store token contract instances for later operations

  try {
    // 1. Deploy Mock ERC20 tokens (if environment variables not specified)
    if (!existingUnderlying || !existingStrike) { // Check if any token deployment is needed
      console.log("1️⃣ Deploying Mock ERC20 tokens...");
      const MockERC20 = await ethers.getContractFactory("MockERC20"); // Get contract factory for MockERC20
      
      if (!existingUnderlying) { // Check if underlying asset needs deployment
        // Deploy underlying asset token UA
        underlyingToken = await MockERC20.deploy(
          "Underlying Asset", // Token name
          "UA", // Token symbol
          ethers.parseEther("1000000") // Initial supply: 1 million tokens
        );
        await underlyingToken.waitForDeployment(); // Wait for deployment transaction to be mined
        underlyingAddress = await underlyingToken.getAddress(); // Get deployed contract address
        console.log("✅ Underlying asset token (UA):", underlyingAddress);
      } else {
        underlyingAddress = existingUnderlying; // Use existing address from environment
        console.log("✅ Using existing underlying asset token (UA):", underlyingAddress);
        underlyingToken = await ethers.getContractAt("MockERC20", underlyingAddress); // Get contract instance at address
      }

      if (!existingStrike) { // Check if strike asset needs deployment
        // Deploy strike asset token SA
        strikeToken = await MockERC20.deploy(
          "Strike Asset", // Token name
          "SA", // Token symbol
          ethers.parseEther("1000000") // Initial supply: 1 million tokens
        );
        await strikeToken.waitForDeployment(); // Wait for deployment transaction to be mined
        strikeAddress = await strikeToken.getAddress(); // Get deployed contract address
        console.log("✅ Strike asset token (SA):", strikeAddress);
      } else {
        strikeAddress = existingStrike; // Use existing address from environment
        console.log("✅ Using existing strike asset token (SA):", strikeAddress);
        strikeToken = await ethers.getContractAt("MockERC20", strikeAddress); // Get contract instance at address
      }
    } else {
      // Use existing token addresses
      underlyingAddress = existingUnderlying; // Use existing underlying asset address
      strikeAddress = existingStrike; // Use existing strike asset address
      underlyingToken = await ethers.getContractAt("MockERC20", underlyingAddress); // Get contract instance
      strikeToken = await ethers.getContractAt("MockERC20", strikeAddress); // Get contract instance
      console.log("✅ Using existing token addresses:");
      console.log("   Underlying asset (UA):", underlyingAddress);
      console.log("   Strike asset (SA):", strikeAddress);
    }

    // 2. Distribute tokens (prepare required balances for premium payment/exercise)
    if (!existingUnderlying || !existingStrike) { // Only distribute if we just deployed tokens
      console.log("\n2️⃣ Distributing tokens...");
      
      // Issuer needs underlying asset (will be transferred from Issuer to Holder upon exercise)
      const issuerUnderlyingAmount = ethers.parseEther("10000"); // Convert 10000 to wei for issuer balance
      await underlyingToken.transfer(issuerAddress, issuerUnderlyingAmount); // Transfer UA tokens to issuer
      console.log(`✅ Distributed ${ethers.formatEther(issuerUnderlyingAmount)} UA to Issuer (${issuerAddress})`);

      // Holder needs strike asset (for paying premium and exercise)
      const holderStrikeAmount = ethers.parseEther("10000"); // Convert 10000 to wei for holder balance
      await strikeToken.transfer(holderAddress, holderStrikeAmount); // Transfer SA tokens to holder
      console.log(`✅ Distributed ${ethers.formatEther(holderStrikeAmount)} SA to Holder (${holderAddress})`);
    }

    // 0. Check and deploy factory contract (if needed)
    console.log("\n0️⃣ Checking factory contract...");
    let factoryAddress = process.env.OPTION_FACTORY_ADDRESS; // Get factory address from environment variable

    if (!factoryAddress) { // Check if factory address from env var
      // Try to read from deployment file
      const deploymentPath = path.join(__dirname, "..", "deployments", "sepolia_option.json"); // Construct deployment file path
      if (fs.existsSync(deploymentPath)) { // Check if deployment file exists
        try {
          const existingDeployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8')); // Read and parse deployment file
          factoryAddress = existingDeployment.contracts?.optionFactory?.address; // Extract factory address from deployment info
        } catch (error) {
          // Ignore errors
        }
      }
    }

    // If still no factory address, deploy factory
    if (!factoryAddress) { // Check if factory address found
      console.log("⚠️ Factory contract not found, starting factory deployment...");
      factoryAddress = await deployFactoryContract(); // Deploy new factory contract
    } else {
      console.log("✅ Using existing factory contract:", factoryAddress);
    }

    // 3. Deploy option contract
    console.log("\n3️⃣ Deploying option contract...");
    
    const EuropeanCallOption = await ethers.getContractFactory("EuropeanCallOption"); // Get contract factory for option contract
    const europeanCallOption = await EuropeanCallOption.deploy( // Deploy option contract with constructor arguments
      underlyingAddress, // Address of underlying asset token
      strikeAddress, // Address of strike asset token
      strikePrice, // Strike price in wei
      expirationTime, // Unix timestamp when option expires
      contractSize, // Size of option contract in wei
      holderAddress, // Holder (buyer) address
      issuerAddress, // Issuer (seller) address
      factoryAddress // Factory contract address
    );
    await europeanCallOption.waitForDeployment(); // Wait for deployment transaction to be mined
    const optionAddress = await europeanCallOption.getAddress(); // Get deployed option contract address
    console.log("✅ Option contract:", optionAddress);

    // 4. Issuer approves underlying asset to option contract (contract needs to deduct UA upon exercise)
    console.log("\n4️⃣ Setting up approvals...");
    const approvalAmount = contractSize * 2n; // Approve 2x contract size (with buffer)
    await underlyingToken.connect(deployer).approve(optionAddress, approvalAmount); // Allow option contract to transfer UA on behalf of issuer
    console.log(`✅ Issuer has approved ${ethers.formatEther(approvalAmount)} UA to option contract`);

    // 5. Read read-only fields for quick verification
    console.log("\n5️⃣ Verifying deployment...");
    const status = await europeanCallOption.status(); // Get current option lifecycle status from contract
    console.log("✅ Option status:", status.toString(), "(0=Created)");
    const issuer = await europeanCallOption.issuer(); // Query issuer address from contract
    console.log("✅ Issuer:", issuer);
    const holder = await europeanCallOption.holder(); // Query holder address from contract
    console.log("✅ Holder:", holder);

    // 6. Output deployment summary
    console.log("\n" + "=".repeat(70));
    console.log("🎉 Deployment completed! Contract address summary:");
    console.log("=".repeat(70));
    if (!existingUnderlying || !existingStrike) {
      console.log("Underlying asset token (UA):", underlyingAddress);
      console.log("Strike asset token (SA):", strikeAddress);
    }
    console.log("Option contract:", optionAddress);
    console.log("\n📋 Option parameters:");
    console.log("• Strike price:", ethers.formatEther(strikePrice), "SA");
    console.log("• Contract size:", ethers.formatEther(contractSize), "UA");
    console.log("• Expiration time:", new Date(expirationTime * 1000).toLocaleString('en-US'));
    console.log("• Exercise window: Within 10 days after expiration");
    console.log("\n👥 Role assignment:");
    console.log("• Issuer (seller):", issuerAddress);
    console.log("• Holder (buyer):", holderAddress);
    console.log("\n🔗 Sepolia Etherscan:");
    if (!existingUnderlying || !existingStrike) {
      console.log("• Underlying asset:", `https://sepolia.etherscan.io/address/${underlyingAddress}`);
      console.log("• Strike asset:", `https://sepolia.etherscan.io/address/${strikeAddress}`);
    }
    console.log("• Option contract:", `https://sepolia.etherscan.io/address/${optionAddress}`);
    console.log("=".repeat(70));

    // 7. Save deployment information to file (for subsequent verification and frontend reading)
    const deploymentInfo = {
      network: "sepolia", // Network name for reference
      timestamp: new Date().toISOString(), // Current timestamp in ISO format
      deployer: deployer.address, // Deployer account address
      roles: { // Store role assignments
        issuer: issuerAddress, // Issuer (seller) address
        holder: holderAddress // Holder (buyer) address
      },
      contracts: { // Store contract deployment information
        europeanCallOption: { // Option contract details
          address: optionAddress, // Deployed contract address
          constructorArgs: { // Constructor arguments for verification
            underlyingAsset: underlyingAddress,
            strikeAsset: strikeAddress,
            strikePrice: strikePrice.toString(), // Convert BigInt to string for JSON serialization
            expirationTime: expirationTime,
            contractSize: contractSize.toString(), // Convert BigInt to string for JSON serialization
            holder: holderAddress,
            issuer: issuerAddress,
            factory: factoryAddress
          }
        }
      }
    };

    // Always record token addresses (whether newly deployed or not)
    deploymentInfo.contracts.underlyingAsset = { // Add underlying asset information
      address: underlyingAddress, // Token contract address
      name: "Underlying Asset", // Token name
      symbol: "UA" // Token symbol
    };
    deploymentInfo.contracts.strikeAsset = { // Add strike asset information
      address: strikeAddress, // Token contract address
      name: "Strike Asset", // Token name
      symbol: "SA" // Token symbol
    };

    const deploymentPath = path.join(__dirname, "..", "deployments", "sepolia_option.json"); // Construct path to deployment file
    
    // Ensure directory exists
    const deploymentDir = path.dirname(deploymentPath); // Get parent directory path
    if (!fs.existsSync(deploymentDir)) { // Check if directory exists
      fs.mkdirSync(deploymentDir, { recursive: true }); // Create directory recursively if it doesn't exist
    }
    
    // Read existing deployment information and merge
    let existingDeployment = {}; // Initialize empty object to store existing deployment data
    if (fs.existsSync(deploymentPath)) { // Check if deployment file already exists
      try {
        existingDeployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8')); // Read and parse JSON file
      } catch (error) {
        console.log("⚠️ Failed to read existing deployment file"); // Handle parsing errors gracefully
      }
    }
    
    // Merge deployment information (preserve factory address)
    const mergedDeployment = {
      ...existingDeployment, // Spread existing deployment data
      ...deploymentInfo, // Overwrite with new deployment info
      contracts: {
        ...existingDeployment.contracts, // Preserve existing contracts
        ...deploymentInfo.contracts // Add new contracts
      }
    };
    
    fs.writeFileSync(deploymentPath, JSON.stringify(mergedDeployment, null, 2)); // Write merged data to file with pretty formatting (2 spaces indent)
    console.log("\n📁 Deployment information saved to:", deploymentPath);

    // 8. Print Etherscan verification command hints
    console.log("\n💡 Next steps:");
    console.log("1. Run verification script to verify contract automatically:");
    console.log("   npx hardhat run scripts/verify_contract.js --network sepolia");
    console.log("\n2. Or manually verify contract (if custom parameters needed):");
    console.log(`   npx hardhat verify --network sepolia ${optionAddress} ${underlyingAddress} ${strikeAddress} ${strikePrice} ${expirationTime} ${contractSize} ${holderAddress} ${issuerAddress} ${factoryAddress}`);

  } catch (error) {
    // Unified exception handling, ensures CI/command line can detect failures
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

// Execute deployment: exit code 0 on success, exit code 1 on failure
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

