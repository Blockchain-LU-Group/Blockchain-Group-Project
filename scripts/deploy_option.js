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

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
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
  const existingUnderlying = process.env.UNDERLYING_ASSET;
  const existingStrike = process.env.STRIKE_ASSET;
  const holderAddress = process.env.HOLDER_ADDRESS || deployer.address;
  const issuerAddress = process.env.ISSUER_ADDRESS || deployer.address;

  // Option parameter configuration
  const strikePrice = ethers.parseEther("100"); // 100 SA per UA
  const expirationTime = Math.floor(Date.now() / 1000) + 30 * 24 * 3600; // Expires in 30 days
  const contractSize = ethers.parseEther("1"); // 1 underlying asset

  let underlyingAddress, strikeAddress;
  let underlyingToken, strikeToken;

  try {
    // 1. Deploy Mock ERC20 tokens (if environment variables not specified)
    if (!existingUnderlying || !existingStrike) {
      console.log("1️⃣ Deploying Mock ERC20 tokens...");
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      
      if (!existingUnderlying) {
        // Deploy underlying asset token UA
        underlyingToken = await MockERC20.deploy(
          "Underlying Asset",
          "UA",
          ethers.parseEther("1000000")
        );
        await underlyingToken.waitForDeployment();
        underlyingAddress = await underlyingToken.getAddress();
        console.log("✅ Underlying asset token (UA):", underlyingAddress);
      } else {
        underlyingAddress = existingUnderlying;
        console.log("✅ Using existing underlying asset token (UA):", underlyingAddress);
        underlyingToken = await ethers.getContractAt("MockERC20", underlyingAddress);
      }

      if (!existingStrike) {
        // Deploy strike asset token SA
        strikeToken = await MockERC20.deploy(
          "Strike Asset",
          "SA",
          ethers.parseEther("1000000")
        );
        await strikeToken.waitForDeployment();
        strikeAddress = await strikeToken.getAddress();
        console.log("✅ Strike asset token (SA):", strikeAddress);
      } else {
        strikeAddress = existingStrike;
        console.log("✅ Using existing strike asset token (SA):", strikeAddress);
        strikeToken = await ethers.getContractAt("MockERC20", strikeAddress);
      }
    } else {
      // Use existing token addresses
      underlyingAddress = existingUnderlying;
      strikeAddress = existingStrike;
      underlyingToken = await ethers.getContractAt("MockERC20", underlyingAddress);
      strikeToken = await ethers.getContractAt("MockERC20", strikeAddress);
      console.log("✅ Using existing token addresses:");
      console.log("   Underlying asset (UA):", underlyingAddress);
      console.log("   Strike asset (SA):", strikeAddress);
    }

    // 2. Distribute tokens (prepare required balances for premium payment/exercise)
    if (!existingUnderlying || !existingStrike) {
      console.log("\n2️⃣ Distributing tokens...");
      
      // Issuer needs underlying asset (will be transferred from Issuer to Holder upon exercise)
      const issuerUnderlyingAmount = ethers.parseEther("10000");
      await underlyingToken.transfer(issuerAddress, issuerUnderlyingAmount);
      console.log(`✅ Distributed ${ethers.formatEther(issuerUnderlyingAmount)} UA to Issuer (${issuerAddress})`);

      // Holder needs strike asset (for paying premium and exercise)
      const holderStrikeAmount = ethers.parseEther("10000");
      await strikeToken.transfer(holderAddress, holderStrikeAmount);
      console.log(`✅ Distributed ${ethers.formatEther(holderStrikeAmount)} SA to Holder (${holderAddress})`);
    }

    // 0. Check and deploy factory contract (if needed)
    console.log("\n0️⃣ Checking factory contract...");
    let factoryAddress = process.env.OPTION_FACTORY_ADDRESS;

    if (!factoryAddress) {
      // Try to read from deployment file
      const deploymentPath = path.join(__dirname, "..", "deployments", "sepolia_option.json");
      if (fs.existsSync(deploymentPath)) {
        try {
          const existingDeployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
          factoryAddress = existingDeployment.contracts?.optionFactory?.address;
        } catch (error) {
          // Ignore errors
        }
      }
    }

    // If still no factory address, deploy factory
    if (!factoryAddress) {
      console.log("⚠️ Factory contract not found, starting factory deployment...");
      factoryAddress = await deployFactoryContract();
    } else {
      console.log("✅ Using existing factory contract:", factoryAddress);
    }

    // 3. Deploy option contract
    console.log("\n3️⃣ Deploying option contract...");
    
    const EuropeanCallOption = await ethers.getContractFactory("EuropeanCallOption");
    const europeanCallOption = await EuropeanCallOption.deploy(
      underlyingAddress,
      strikeAddress,
      strikePrice,
      expirationTime,
      contractSize,
      holderAddress,
      issuerAddress, // issuer address
      factoryAddress // factory address
    );
    await europeanCallOption.waitForDeployment();
    const optionAddress = await europeanCallOption.getAddress();
    console.log("✅ Option contract:", optionAddress);

    // 4. Issuer approves underlying asset to option contract (contract needs to deduct UA upon exercise)
    console.log("\n4️⃣ Setting up approvals...");
    const approvalAmount = contractSize * 2n; // Approve 2x contract size (with buffer)
    await underlyingToken.connect(deployer).approve(optionAddress, approvalAmount);
    console.log(`✅ Issuer has approved ${ethers.formatEther(approvalAmount)} UA to option contract`);

    // 5. Read read-only fields for quick verification
    console.log("\n5️⃣ Verifying deployment...");
    const status = await europeanCallOption.status();
    console.log("✅ Option status:", status.toString(), "(0=Created)");
    const issuer = await europeanCallOption.issuer();
    console.log("✅ Issuer:", issuer);
    const holder = await europeanCallOption.holder();
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
      network: "sepolia",
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      roles: {
        issuer: issuerAddress,
        holder: holderAddress
      },
      contracts: {
        europeanCallOption: {
          address: optionAddress,
          constructorArgs: {
            underlyingAsset: underlyingAddress,
            strikeAsset: strikeAddress,
            strikePrice: strikePrice.toString(),
            expirationTime: expirationTime,
            contractSize: contractSize.toString(),
            holder: holderAddress,
            issuer: issuerAddress,
            factory: factoryAddress
          }
        }
      }
    };

    // Always record token addresses (whether newly deployed or not)
    deploymentInfo.contracts.underlyingAsset = {
      address: underlyingAddress,
      name: "Underlying Asset",
      symbol: "UA"
    };
    deploymentInfo.contracts.strikeAsset = {
      address: strikeAddress,
      name: "Strike Asset",
      symbol: "SA"
    };

    const deploymentPath = path.join(__dirname, "..", "deployments", "sepolia_option.json");
    
    // Ensure directory exists
    const deploymentDir = path.dirname(deploymentPath);
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }
    
    // Read existing deployment information and merge
    let existingDeployment = {};
    if (fs.existsSync(deploymentPath)) {
      try {
        existingDeployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
      } catch (error) {
        console.log("⚠️ Failed to read existing deployment file");
      }
    }
    
    // Merge deployment information (preserve factory address)
    const mergedDeployment = {
      ...existingDeployment,
      ...deploymentInfo,
      contracts: {
        ...existingDeployment.contracts,
        ...deploymentInfo.contracts
      }
    };
    
    fs.writeFileSync(deploymentPath, JSON.stringify(mergedDeployment, null, 2));
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

