// Import Chai assertion library for testing
import { expect } from "chai";
// Import Hardhat utilities for contract interaction and network info
import { ethers, network } from "hardhat";
// Import Hardhat network helpers for time manipulation
import { time } from "@nomicfoundation/hardhat-network-helpers";

// Main test suite for EuropeanCallOption integration tests
describe("EuropeanCallOption Integration Test", function () {
  let europeanCallOption: any; // Option contract instance
  let underlyingToken: any; // Underlying asset (UA) token contract instance
  let strikeToken: any; // Strike asset (SA) token contract instance
  let issuer: any; // Issuer (seller) account signer
  let holder: any; // Holder (buyer) account signer
  let isHardhatNetwork: boolean; // Flag indicating if running on Hardhat network

  // Test constants: option parameters in wei
  const STRIKE_PRICE = ethers.parseEther("100"); // Strike price: 100 SA per UA
  const CONTRACT_SIZE = ethers.parseEther("1"); // Contract size: 1 UA
  const PREMIUM = ethers.parseEther("10"); // Premium: 10 SA

  // Check if we're on Hardhat Network (time manipulation only works there)
  before(async function () { // Execute once before all tests
    // Check network name instead of making network calls
    isHardhatNetwork = network.name === "hardhat"; // Set flag based on current network
  });

  // Before each test case: Deploy tokens and distribute balances
  beforeEach(async function () { // Execute before each individual test
    [issuer, holder] = await ethers.getSigners(); // Get test accounts (deployer is signer[0])

    // Deploy Mock ERC20 tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20"); // Get contract factory for MockERC20
    underlyingToken = await MockERC20.deploy("Underlying Asset", "UA", ethers.parseEther("1000000")); // Deploy underlying asset token
    strikeToken = await MockERC20.deploy("Strike Asset", "SA", ethers.parseEther("1000000")); // Deploy strike asset token

    // Distribute tokens to appropriate accounts
    await strikeToken.transfer(holder.address, ethers.parseEther("10000")); // Give holder 10000 SA for premium/exercise
    await underlyingToken.transfer(issuer.address, ethers.parseEther("10000")); // Give issuer 10000 UA to fulfill option
  });

  // Integration test covering complete option lifecycle
  it("Complete workflow: Create option → Pay premium → Exercise", async function () {
    // Step 1: Create option
    const latestBlock = await ethers.provider.getBlock('latest'); // Get latest block information
    const expirationTime = (latestBlock?.timestamp || 0) + 86400; // Calculate expiration: 1 day from now
    const EuropeanCallOption = await ethers.getContractFactory("EuropeanCallOption"); // Get contract factory
    europeanCallOption = await EuropeanCallOption.deploy( // Deploy option contract
      underlyingToken.target, // Underlying asset token address
      strikeToken.target, // Strike asset token address
      STRIKE_PRICE, // Strike price parameter
      expirationTime, // Expiration timestamp
      CONTRACT_SIZE, // Contract size parameter
      holder.address, // Holder (buyer) address
      issuer.address, // Issuer (seller) address
      issuer.address // Use issuer address as factory address (for testing)
    );

    console.log("\n✅ Integration test - Option contract deployment address:", await europeanCallOption.getAddress());

    // Initial status should be Created(0)
    expect(await europeanCallOption.status()).to.equal(0); // Verify contract is in Created state

    // Step 2: Pay premium
    // Note: Exercise requires issuer to approve underlying asset, approve in advance here
    await underlyingToken.connect(issuer).approve(europeanCallOption.target, CONTRACT_SIZE * 2n); // Approve UA for exercise
    // Approve sufficient strikeToken first for paying premium and subsequent exercise
    const strikeAmount = STRIKE_PRICE * CONTRACT_SIZE / ethers.parseEther("1"); // Calculate total strike amount
    await strikeToken.connect(holder).approve(europeanCallOption.target, PREMIUM + strikeAmount); // Approve SA for premium + exercise
    
    // Record balances before payment (for precise assertions)
    const issuerStrikeBefore = await strikeToken.balanceOf(issuer.address); // Issuer's SA balance before
    const holderStrikeBefore = await strikeToken.balanceOf(holder.address); // Holder's SA balance before
    const issuerUnderlyingBefore = await underlyingToken.balanceOf(issuer.address); // Issuer's UA balance before
    const holderUnderlyingBefore = await underlyingToken.balanceOf(holder.address); // Holder's UA balance before

    // Pay premium
    const premiumTx = await europeanCallOption.connect(holder).payPremium(PREMIUM); // Execute premium payment
    const premiumReceipt = await premiumTx.wait(); // Wait for transaction confirmation
    
    // Verify premium payment event
    const premiumPaidEvent = premiumReceipt.logs.find((log: any) => { // Find PremiumPaid event in logs
      try {
        const decoded = europeanCallOption.interface.parseLog(log); // Try to decode log
        return decoded.name === "PremiumPaid"; // Check if event name matches
      } catch {
        return false; // Return false if decoding fails
      }
    });
    expect(premiumPaidEvent).to.not.be.undefined; // Assert event was emitted

    // Verify option status changed to Active
    expect(await europeanCallOption.status()).to.equal(1); // Status 1 = Active

    // Step 3: Exercise
    // Fast-forward to expiration time (only works on Hardhat Network)
    if (!isHardhatNetwork) { // Check if on Hardhat network
      this.skip(); // Skip this test on non-Hardhat networks
    }
    await time.increaseTo(expirationTime + 1); // Manually advance time to after expiration

    // Exercise
    const exercisedTx = await europeanCallOption.connect(holder).exercised(); // Execute exercise function
    const exercisedReceipt = await exercisedTx.wait(); // Wait for transaction confirmation

    // Verify exercise event
    const exercisedEvent = exercisedReceipt.logs.find((log: any) => { // Find OptionExercised event in logs
      try {
        const decoded = europeanCallOption.interface.parseLog(log); // Try to decode log
        return decoded.name === "OptionExercised"; // Check if event name matches
      } catch {
        return false; // Return false if decoding fails
      }
    });
    expect(exercisedEvent).to.not.be.undefined; // Assert event was emitted

    // Verify option status changed to Exercised
    expect(await europeanCallOption.status()).to.equal(3); // Status 3 = Exercised

    // Verify asset transfers (precise assertions)
    const issuerStrikeAfter = await strikeToken.balanceOf(issuer.address); // Issuer's SA balance after
    const holderStrikeAfter = await strikeToken.balanceOf(holder.address); // Holder's SA balance after
    const issuerUnderlyingAfter = await underlyingToken.balanceOf(issuer.address); // Issuer's UA balance after
    const holderUnderlyingAfter = await underlyingToken.balanceOf(holder.address); // Holder's UA balance after

    // Issuer receives: premium + strikeAmount
    expect(issuerStrikeAfter - issuerStrikeBefore).to.equal(PREMIUM + strikeAmount); // Verify issuer SA increase
    // Holder pays: premium + strikeAmount
    expect(holderStrikeBefore - holderStrikeAfter).to.equal(PREMIUM + strikeAmount); // Verify holder SA decrease
    // Holder receives: underlying contract size
    expect(holderUnderlyingAfter - holderUnderlyingBefore).to.equal(CONTRACT_SIZE); // Verify holder UA increase
    // Issuer pays: underlying contract size
    expect(issuerUnderlyingBefore - issuerUnderlyingAfter).to.equal(CONTRACT_SIZE); // Verify issuer UA decrease
  });
});

