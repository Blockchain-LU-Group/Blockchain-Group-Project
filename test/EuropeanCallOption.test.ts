// Import Chai assertion library for testing
import { expect } from "chai";
// Import Hardhat utilities for contract interaction and network info
import { ethers, network } from "hardhat";
// Import Hardhat network helpers for time manipulation
import { time } from "@nomicfoundation/hardhat-network-helpers";

/**
 * Test File Documentation:
 * 
 * Purpose of Nested describe Blocks:
 * 1. **Organization**: Group tests by functionality to make test reports clearer
 *    - Outer describe("EuropeanCallOption") indicates testing the entire contract
 *    - Inner describe("payPremium") indicates testing only the payPremium function
 * 
 * 2. **Scope Isolation**: Each describe block can have its own variables and beforeEach
 *    - Outer variables: europeanCallOption, underlyingToken, strikeToken, etc., shared by all tests
 *    - Inner variables: e.g., unactivatedOption, only used in payPremium tests
 * 
 * 3. **Nested beforeEach Execution**:
 *    - Outer beforeEach executes first (runs for all tests)
 *    - Inner beforeEach executes after (only affects tests within that group)
 *    - Execution order: outer beforeEach → inner beforeEach → test case
 * 
 * 4. **Gas Report Interpretation** (displayed after test run completes):
 *    - Methods table: Statistics on gas usage for each function call
 *      • Min/Max/Avg: Minimum/Maximum/Average gas consumption
 *      • # calls: Total number of times the function was called in tests
 *      • usd (avg): Average USD cost (only displayed if configured)
 *    - Deployments table: Gas consumption for contract deployments
 *    - % of limit: Percentage of block gas limit (Ethereum mainnet ~30,000,000)
 * 
 *    Example interpretation:
 *    EuropeanCallOption · payPremium · Min: 53523 · Max: 58323 · Avg: 56578 · # calls: 11
 *    → payPremium function was called 11 times in tests
 *    → Minimum consumption: 53523 Gas, Maximum: 58323 Gas, Average: 56578 Gas
 *    → Reason for difference: First call requires storage slot initialization (SSTORE), subsequent calls cost less
 * 
 * 5. **Test Environment Description**:
 *    When running `npx hardhat test`, contracts are deployed on Hardhat Network's built-in test chain
 *    - Type: Temporary in-memory blockchain (non-persistent)
 *    - Chain ID: 31337
 *    - Features:
 *      • State automatically cleared after tests, tests don't interfere with each other
 *      • 20 pre-configured test accounts, each with 10,000 ETH
 *      • Can fast-forward/rewind time (using time.increaseTo)
 *      • Can mine new blocks, check rollbacks, etc.
 *    - Run commands:
 *      • `npx hardhat test` → Hardcoded network (hardhat default config)
 *      • `npx hardhat test --network localhost` → Local node (must run `npx hardhat node` first)
 *      • `npx hardhat test --network sepolia` → Sepolia testnet (requires environment variables)
 */

// Main test suite for EuropeanCallOption contract
describe("EuropeanCallOption", function () {
  let europeanCallOption: any; // let: variable declaration keyword, type annotation: any means no specific type
  let underlyingToken: any; // Underlying asset token contract instance
  let strikeToken: any; // Strike asset token contract instance
  let issuer: any; // Issuer (seller) account signer
  let holder: any; // Holder (buyer) account signer
  let nonHolder: any; // Non-authorized account signer for negative tests
  let isHardhatNetwork: boolean; // Flag indicating if running on Hardhat network

  // parseEther() method converts ether unit string (here "100") to corresponding wei value (i.e., 100 * 10^18 wei)
  // The converted value is a BigInt type, suitable for direct use in smart contract interactions
  const STRIKE_PRICE = ethers.parseEther("100"); // Strike price: 100 SA per UA
  const CONTRACT_SIZE = ethers.parseEther("1"); // Contract size: 1 UA
  const PREMIUM = ethers.parseEther("10"); // Premium: 10 SA

  // Check if we're on Hardhat Network (time manipulation only works there)
  before(async function () { // Execute once before all tests
    // Check network name instead of making network calls
    isHardhatNetwork = network.name === "hardhat"; // Set flag based on current network
  });

  // Helper function: Deploy and activate option
  async function deployActivatedOption(): Promise<any> { // Returns Promise with any type
    const latestBlock = await ethers.provider.getBlock('latest'); // Get latest block info
    const expirationTime = (latestBlock?.timestamp || 0) + 86400; // Calculate expiration: 1 day from now

    const EuropeanCallOption = await ethers.getContractFactory("EuropeanCallOption"); // Get contract factory
    const option: any = await EuropeanCallOption.deploy( // Deploy option contract
      underlyingToken.target, // Underlying asset token address
      strikeToken.target, // Strike asset token address
      STRIKE_PRICE, // Strike price parameter
      expirationTime, // Expiration timestamp
      CONTRACT_SIZE, // Contract size parameter
      holder.address, // Holder (buyer) address
      issuer.address, // Issuer (seller) address
      issuer.address // Use issuer address as factory address (for testing)
    );

    console.log("✅ Activated option contract deployment address:", await option.getAddress());

    // Approve tokens and pay premium to activate option
    await underlyingToken.connect(issuer).approve(option.target, CONTRACT_SIZE * 2n); // Approve UA for exercise
    const strikeAmount = STRIKE_PRICE * CONTRACT_SIZE / ethers.parseEther("1"); // Calculate total strike amount
    await strikeToken.connect(holder).approve(option.target, PREMIUM + strikeAmount); // Approve SA for premium + exercise
    await option.connect(holder).payPremium(PREMIUM); // Pay premium to activate option

    return option; // Return deployed and activated option contract
  }

  // Deploy Mock ERC20 tokens (in outer beforeEach, shared by all tests)
  beforeEach(async function () {  // beforeEach function runs before each test case, used to set up test environment
    [issuer, holder, , nonHolder] = await ethers.getSigners(); // Get test accounts (skip 3rd signer)

    // Deploy Mock ERC20 tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20"); // Get contract factory for MockERC20
    underlyingToken = await MockERC20.deploy("Underlying Asset", "UA", ethers.parseEther("1000000")); // Deploy underlying asset token
    strikeToken = await MockERC20.deploy("Strike Asset", "SA", ethers.parseEther("1000000")); // Deploy strike asset token

    // Distribute tokens to appropriate accounts
    await strikeToken.transfer(holder.address, ethers.parseEther("10000")); // Give holder 10000 SA for premium/exercise
    await underlyingToken.transfer(issuer.address, ethers.parseEther("10000")); // Give issuer 10000 UA to fulfill option
  });

  // ============================================
  // payPremium Function Tests
  // ============================================
  describe("payPremium", function () { // Nested test suite for payPremium function
    // Redeploy unactivated option for payPremium testing
    let unactivatedOption: any; // Option contract in unactivated (Created) state
    
    beforeEach(async function () { // Execute before each payPremium test
      const latestBlock = await ethers.provider.getBlock('latest'); // Get latest block info
      const expirationTime = (latestBlock?.timestamp || 0) + 86400; // Calculate expiration: 1 day from now

      const EuropeanCallOption = await ethers.getContractFactory("EuropeanCallOption"); // Get contract factory
      unactivatedOption = await EuropeanCallOption.deploy( // Deploy option contract
        underlyingToken.target, // Underlying asset token address
        strikeToken.target, // Strike asset token address
        STRIKE_PRICE, // Strike price parameter
        expirationTime, // Expiration timestamp
        CONTRACT_SIZE, // Contract size parameter
        holder.address, // Holder (buyer) address
        issuer.address, // Issuer (seller) address
        issuer.address // Use issuer address as factory address (for testing)
      );

      console.log("✅ Unactivated option contract deployment address (payPremium test):", await unactivatedOption.getAddress());

      await underlyingToken.connect(issuer).approve(unactivatedOption.target, CONTRACT_SIZE); // Pre-approve UA
    });

    it("should allow holder to successfully pay premium", async function () { // Test successful premium payment
      // Approve: Allow option contract to deduct PREMIUM amount of SA from Holder
      await strikeToken.connect(holder).approve(unactivatedOption.target, PREMIUM); // Approve SA token

      // Record balances before payment (for precise assertions)
      const issuerStrikeBefore = await strikeToken.balanceOf(issuer.address); // Issuer's SA balance before
      const holderStrikeBefore = await strikeToken.balanceOf(holder.address); // Holder's SA balance before

      // Call payPremium as Holder
      const tx = await unactivatedOption.connect(holder).payPremium(PREMIUM); // Execute premium payment
      const receipt = await tx.wait(); // Wait for transaction confirmation

      // Check if event (PremiumPaid) was successful
      const premiumPaidEvent = receipt.logs.find((log: any) => { // Find PremiumPaid event in logs
        try {
          const decoded = unactivatedOption.interface.parseLog(log); // Try to decode log
          return decoded.name === "PremiumPaid"; // Check if event name matches
        } catch {
          return false; // Return false if decoding fails
        }
      });
      expect(premiumPaidEvent).to.not.be.undefined; // Assert event was emitted
      
      // Check status changed to Active (Created → Active)
      expect(await unactivatedOption.status()).to.equal(1); // Status 1 = Active

      // Precise balance assertions: Issuer receives PREMIUM; Holder pays PREMIUM
      const issuerStrikeAfter = await strikeToken.balanceOf(issuer.address); // Issuer's SA balance after
      const holderStrikeAfter = await strikeToken.balanceOf(holder.address); // Holder's SA balance after
      expect(issuerStrikeAfter - issuerStrikeBefore).to.equal(PREMIUM); // Verify issuer received premium
      expect(holderStrikeBefore - holderStrikeAfter).to.equal(PREMIUM); // Verify holder paid premium
    });

    it("non-holder should not be able to pay premium", async function () { // Test authorization check
      await strikeToken.connect(nonHolder).approve(unactivatedOption.target, PREMIUM); // Approve SA token
      
      // Call as nonHolder, should hit require(msg.sender == holder)
      await expect( // Expect transaction to revert
        unactivatedOption.connect(nonHolder).payPremium(PREMIUM) // Attempt to pay premium as non-holder
      ).to.be.revertedWith("Only holder can pay premium"); // Expect specific revert message
    });

    it("should fail if strikeAsset is not approved", async function () { // Test insufficient approval
      // Don't approve token
      await expect( // Expect transaction to revert
        unactivatedOption.connect(holder).payPremium(PREMIUM) // Attempt to pay without approval
      ).to.be.reverted; // Expect revert (transfer fails)
    });

    it("should not be able to pay premium if not in Created state", async function () { // Test state check
      // Pay premium once first
      await strikeToken.connect(holder).approve(unactivatedOption.target, PREMIUM); // Approve SA token
      await unactivatedOption.connect(holder).payPremium(PREMIUM); // Pay premium first time
      
      // Second payment should fail (status is no longer Created)
      await expect( // Expect transaction to revert
        unactivatedOption.connect(holder).payPremium(PREMIUM) // Attempt to pay second time
      ).to.be.revertedWith("Option must be in Created state"); // Expect specific revert message
    });
  });

  // ============================================
  // exercised Function Tests
  // ============================================
  describe("exercised", function () { // Nested test suite for exercised function
    beforeEach(async function () { // Execute before each exercised test
      europeanCallOption = await deployActivatedOption(); // Deploy and activate option
    });

    it("holder should be able to exercise within exercise window", async function () { // Test successful exercise
      if (!isHardhatNetwork) { // Check if on Hardhat network
        this.skip(); // Skip on non-Hardhat networks
      }
      // Fast-forward to expiration time
      const expirationTime = await europeanCallOption.expirationTime(); // Get expiration timestamp
      await time.increaseTo(Number(expirationTime) + 1); // Manually advance time to after expiration

      // Note: Approvals completed in beforeEach
      const strikeAmount = STRIKE_PRICE * CONTRACT_SIZE / ethers.parseEther("1"); // Calculate total strike amount

      // Record balances before exercise
      const issuerStrikeBefore = await strikeToken.balanceOf(issuer.address); // Issuer's SA balance before
      const holderStrikeBefore = await strikeToken.balanceOf(holder.address); // Holder's SA balance before
      const issuerUnderlyingBefore = await underlyingToken.balanceOf(issuer.address); // Issuer's UA balance before
      const holderUnderlyingBefore = await underlyingToken.balanceOf(holder.address); // Holder's UA balance before

      const tx = await europeanCallOption.connect(holder).exercised(); // Execute exercise function
      const receipt = await tx.wait(); // Wait for transaction confirmation

      // Check event
      const exercisedEvent = receipt.logs.find((log: any) => { // Find OptionExercised event in logs
        try {
          const decoded = europeanCallOption.interface.parseLog(log); // Try to decode log
          return decoded.name === "OptionExercised"; // Check if event name matches
        } catch {
          return false; // Return false if decoding fails
        }
      });
      expect(exercisedEvent).to.not.be.undefined; // Assert event was emitted

      // Check status changed to Exercised
      expect(await europeanCallOption.status()).to.equal(3); // Status 3 = Exercised

      // Precise balance assertions
      const issuerStrikeAfter = await strikeToken.balanceOf(issuer.address); // Issuer's SA balance after
      const holderStrikeAfter = await strikeToken.balanceOf(holder.address); // Holder's SA balance after
      const issuerUnderlyingAfter = await underlyingToken.balanceOf(issuer.address); // Issuer's UA balance after
      const holderUnderlyingAfter = await underlyingToken.balanceOf(holder.address); // Holder's UA balance after

      // Issuer receives: strikeAmount; Holder pays: strikeAmount
      expect(issuerStrikeAfter - issuerStrikeBefore).to.equal(strikeAmount); // Verify issuer SA increase
      expect(holderStrikeBefore - holderStrikeAfter).to.equal(strikeAmount); // Verify holder SA decrease
      // Holder receives: UA contractSize; Issuer pays: UA contractSize
      expect(holderUnderlyingAfter - holderUnderlyingBefore).to.equal(CONTRACT_SIZE); // Verify holder UA increase
      expect(issuerUnderlyingBefore - issuerUnderlyingAfter).to.equal(CONTRACT_SIZE); // Verify issuer UA decrease
    });

    it("should not be able to exercise outside exercise window", async function () { // Test expired window
      if (!isHardhatNetwork) { // Check if on Hardhat network
        this.skip(); // Skip on non-Hardhat networks
      }
      // Fast-forward beyond exercise window (more than 10 days)
      const expirationTime = await europeanCallOption.expirationTime(); // Get expiration timestamp
      await time.increaseTo(Number(expirationTime) + 11 * 24 * 3600); // Advance 11 days past expiration

      await expect( // Expect transaction to revert
        europeanCallOption.connect(holder).exercised() // Attempt to exercise outside window
      ).to.be.revertedWith("Exercise window expired"); // Expect specific revert message
    });

    it("should not be able to exercise before expiration", async function () { // Test premature exercise
      // Still before expiration time
      await expect( // Expect transaction to revert
        europeanCallOption.connect(holder).exercised() // Attempt to exercise before expiration
      ).to.be.revertedWith("Not yet exercisable"); // Expect specific revert message
    });
  });

  // ============================================
  // isExercisable Function Tests
  // ============================================
  describe("isExercisable", function () { // Nested test suite for isExercisable function
    beforeEach(async function () { // Execute before each isExercisable test
      europeanCallOption = await deployActivatedOption(); // Deploy and activate option
    });

    it("isExercisable should be false before expiration, true within window, false outside window", async function () { // Test exercisability states
      if (!isHardhatNetwork) { // Check if on Hardhat network
        this.skip(); // Skip on non-Hardhat networks
      }
      const exp = await europeanCallOption.expirationTime(); // Get expiration timestamp

      // Before expiration
      expect(await europeanCallOption.isExercisable()).to.equal(false); // Should not be exercisable before expiration

      // 1 second after expiration (within window)
      await time.increaseTo(Number(exp) + 1); // Advance 1 second past expiration
      expect(await europeanCallOption.isExercisable()).to.equal(true); // Should be exercisable within window

      // 10 days + 1 second after expiration (beyond window)
      await time.increaseTo(Number(exp) + 10 * 24 * 3600 + 1); // Advance past 10-day window
      expect(await europeanCallOption.isExercisable()).to.equal(false); // Should not be exercisable outside window
    });
  });

  // ============================================
  // expireOption Function Tests
  // ============================================
  describe("expireOption", function () { // Nested test suite for expireOption function
    beforeEach(async function () { // Execute before each expireOption test
      europeanCallOption = await deployActivatedOption(); // Deploy and activate option
    });

    it("should be able to call expireOption after exercise window ends", async function () { // Test manual expiration
      if (!isHardhatNetwork) { // Check if on Hardhat network
        this.skip(); // Skip on non-Hardhat networks
      }
      const expirationTime = await europeanCallOption.expirationTime(); // Get expiration timestamp
      
      // Fast-forward to end of exercise window (more than 10 days)
      await time.increaseTo(Number(expirationTime) + 11 * 24 * 3600); // Advance past 10-day window

      const tx = await europeanCallOption.expireOption(); // Call expireOption function
      const receipt = await tx.wait(); // Wait for transaction confirmation

      // Check event
      const expiredEvent = receipt.logs.find((log: any) => { // Find OptionExpired event in logs
        try {
          const decoded = europeanCallOption.interface.parseLog(log); // Try to decode log
          return decoded.name === "OptionExpired"; // Check if event name matches
        } catch {
          return false; // Return false if decoding fails
        }
      });
      expect(expiredEvent).to.not.be.undefined; // Assert event was emitted

      // Verify status changed to Expired
      expect(await europeanCallOption.status()).to.equal(2); // Status 2 = Expired

      // Additional assertion: Cannot exercise after expiration
      await expect( // Expect transaction to revert
        europeanCallOption.connect(holder).exercised() // Attempt to exercise expired option
      ).to.be.revertedWith("Option must be active"); // Expect specific revert message
    });
  });
});

