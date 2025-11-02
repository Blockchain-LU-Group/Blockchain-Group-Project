import { expect } from "chai";
import { ethers, network } from "hardhat";
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

describe("EuropeanCallOption", function () {
  let europeanCallOption: any; // let: variable declaration keyword, type annotation: any means no specific type
  let underlyingToken: any;
  let strikeToken: any;
  let issuer: any;
  let holder: any;
  let nonHolder: any;
  let isHardhatNetwork: boolean;

  // parseEther() method converts ether unit string (here "100") to corresponding wei value (i.e., 100 * 10^18 wei)
  // The converted value is a BigInt type, suitable for direct use in smart contract interactions
  const STRIKE_PRICE = ethers.parseEther("100"); 
  const CONTRACT_SIZE = ethers.parseEther("1");
  const PREMIUM = ethers.parseEther("10");

  // Check if we're on Hardhat Network (time manipulation only works there)
  before(async function () {
    // Check network name instead of making network calls
    isHardhatNetwork = network.name === "hardhat";
  });

  // Helper function: Deploy and activate option
  async function deployActivatedOption(): Promise<any> {
    const latestBlock = await ethers.provider.getBlock('latest');
    const expirationTime = (latestBlock?.timestamp || 0) + 86400;

    const EuropeanCallOption = await ethers.getContractFactory("EuropeanCallOption");
    const option: any = await EuropeanCallOption.deploy(
      underlyingToken.target,
      strikeToken.target,
      STRIKE_PRICE,
      expirationTime,
      CONTRACT_SIZE,
      holder.address,
      issuer.address,
      issuer.address // Use issuer address as factory address (for testing)
    );

    console.log("✅ Activated option contract deployment address:", await option.getAddress());

    // Approve tokens and pay premium to activate option
    await underlyingToken.connect(issuer).approve(option.target, CONTRACT_SIZE * 2n);
    const strikeAmount = STRIKE_PRICE * CONTRACT_SIZE / ethers.parseEther("1");
    await strikeToken.connect(holder).approve(option.target, PREMIUM + strikeAmount);
    await option.connect(holder).payPremium(PREMIUM);

    return option;
  }

  // Deploy Mock ERC20 tokens (in outer beforeEach, shared by all tests)
  beforeEach(async function () {  // beforeEach function runs before each test case, used to set up test environment
    [issuer, holder, , nonHolder] = await ethers.getSigners();

    // Deploy Mock ERC20 tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    underlyingToken = await MockERC20.deploy("Underlying Asset", "UA", ethers.parseEther("1000000"));
    strikeToken = await MockERC20.deploy("Strike Asset", "SA", ethers.parseEther("1000000"));

    // Distribute tokens
    await strikeToken.transfer(holder.address, ethers.parseEther("10000"));
    await underlyingToken.transfer(issuer.address, ethers.parseEther("10000"));
  });

  // ============================================
  // payPremium Function Tests
  // ============================================
  describe("payPremium", function () {
    // Redeploy unactivated option for payPremium testing
    let unactivatedOption: any;
    
    beforeEach(async function () {
      const latestBlock = await ethers.provider.getBlock('latest');
      const expirationTime = (latestBlock?.timestamp || 0) + 86400;

      const EuropeanCallOption = await ethers.getContractFactory("EuropeanCallOption");
      unactivatedOption = await EuropeanCallOption.deploy(
        underlyingToken.target,
        strikeToken.target,
        STRIKE_PRICE,
        expirationTime,
        CONTRACT_SIZE,
        holder.address,
        issuer.address,
        issuer.address // Use issuer address as factory address (for testing)
      );

      console.log("✅ Unactivated option contract deployment address (payPremium test):", await unactivatedOption.getAddress());

      await underlyingToken.connect(issuer).approve(unactivatedOption.target, CONTRACT_SIZE);
    });

    it("should allow holder to successfully pay premium", async function () {
      // Approve: Allow option contract to deduct PREMIUM amount of SA from Holder
      await strikeToken.connect(holder).approve(unactivatedOption.target, PREMIUM);

      // Record balances before payment (for precise assertions)
      const issuerStrikeBefore = await strikeToken.balanceOf(issuer.address);
      const holderStrikeBefore = await strikeToken.balanceOf(holder.address);

      // Call payPremium as Holder
      const tx = await unactivatedOption.connect(holder).payPremium(PREMIUM);
      const receipt = await tx.wait();

      // Check if event (PremiumPaid) was successful
      const premiumPaidEvent = receipt.logs.find((log: any) => {
        try {
          const decoded = unactivatedOption.interface.parseLog(log);
          return decoded.name === "PremiumPaid";
        } catch {
          return false;
        }
      });
      expect(premiumPaidEvent).to.not.be.undefined;
      
      // Check status changed to Active (Created → Active)
      expect(await unactivatedOption.status()).to.equal(1);

      // Precise balance assertions: Issuer receives PREMIUM; Holder pays PREMIUM
      const issuerStrikeAfter = await strikeToken.balanceOf(issuer.address);
      const holderStrikeAfter = await strikeToken.balanceOf(holder.address);
      expect(issuerStrikeAfter - issuerStrikeBefore).to.equal(PREMIUM);
      expect(holderStrikeBefore - holderStrikeAfter).to.equal(PREMIUM);
    });

    it("non-holder should not be able to pay premium", async function () {
      await strikeToken.connect(nonHolder).approve(unactivatedOption.target, PREMIUM);
      
      // Call as nonHolder, should hit require(msg.sender == holder)
      await expect(
        unactivatedOption.connect(nonHolder).payPremium(PREMIUM)
      ).to.be.revertedWith("Only holder can pay premium");
    });

    it("should fail if strikeAsset is not approved", async function () {
      // Don't approve token
      await expect(
        unactivatedOption.connect(holder).payPremium(PREMIUM)
      ).to.be.reverted;
    });

    it("should not be able to pay premium if not in Created state", async function () {
      // Pay premium once first
      await strikeToken.connect(holder).approve(unactivatedOption.target, PREMIUM);
      await unactivatedOption.connect(holder).payPremium(PREMIUM);
      
      // Second payment should fail (status is no longer Created)
      await expect(
        unactivatedOption.connect(holder).payPremium(PREMIUM)
      ).to.be.revertedWith("Option must be in Created state");
    });
  });

  // ============================================
  // exercised Function Tests
  // ============================================
  describe("exercised", function () {
    beforeEach(async function () {
      europeanCallOption = await deployActivatedOption();
    });

    it("holder should be able to exercise within exercise window", async function () {
      if (!isHardhatNetwork) {
        this.skip(); // Skip on non-Hardhat networks
      }
      // Fast-forward to expiration time
      const expirationTime = await europeanCallOption.expirationTime();
      await time.increaseTo(Number(expirationTime) + 1);

      // Note: Approvals completed in beforeEach
      const strikeAmount = STRIKE_PRICE * CONTRACT_SIZE / ethers.parseEther("1");

      // Record balances before exercise
      const issuerStrikeBefore = await strikeToken.balanceOf(issuer.address);
      const holderStrikeBefore = await strikeToken.balanceOf(holder.address);
      const issuerUnderlyingBefore = await underlyingToken.balanceOf(issuer.address);
      const holderUnderlyingBefore = await underlyingToken.balanceOf(holder.address);

      const tx = await europeanCallOption.connect(holder).exercised();
      const receipt = await tx.wait();

      // Check event
      const exercisedEvent = receipt.logs.find((log: any) => {
        try {
          const decoded = europeanCallOption.interface.parseLog(log);
          return decoded.name === "OptionExercised";
        } catch {
          return false;
        }
      });
      expect(exercisedEvent).to.not.be.undefined;

      // Check status changed to Exercised
      expect(await europeanCallOption.status()).to.equal(3);

      // Precise balance assertions
      const issuerStrikeAfter = await strikeToken.balanceOf(issuer.address);
      const holderStrikeAfter = await strikeToken.balanceOf(holder.address);
      const issuerUnderlyingAfter = await underlyingToken.balanceOf(issuer.address);
      const holderUnderlyingAfter = await underlyingToken.balanceOf(holder.address);

      // Issuer receives: strikeAmount; Holder pays: strikeAmount
      expect(issuerStrikeAfter - issuerStrikeBefore).to.equal(strikeAmount);
      expect(holderStrikeBefore - holderStrikeAfter).to.equal(strikeAmount);
      // Holder receives: UA contractSize; Issuer pays: UA contractSize
      expect(holderUnderlyingAfter - holderUnderlyingBefore).to.equal(CONTRACT_SIZE);
      expect(issuerUnderlyingBefore - issuerUnderlyingAfter).to.equal(CONTRACT_SIZE);
    });

    it("should not be able to exercise outside exercise window", async function () {
      if (!isHardhatNetwork) {
        this.skip(); // Skip on non-Hardhat networks
      }
      // Fast-forward beyond exercise window (more than 10 days)
      const expirationTime = await europeanCallOption.expirationTime();
      await time.increaseTo(Number(expirationTime) + 11 * 24 * 3600);

      await expect(
        europeanCallOption.connect(holder).exercised()
      ).to.be.revertedWith("Exercise window expired");
    });

    it("should not be able to exercise before expiration", async function () {
      // Still before expiration time
      await expect(
        europeanCallOption.connect(holder).exercised()
      ).to.be.revertedWith("Not yet exercisable");
    });
  });

  // ============================================
  // isExercisable Function Tests
  // ============================================
  describe("isExercisable", function () {
    beforeEach(async function () {
      europeanCallOption = await deployActivatedOption();
    });

    it("isExercisable should be false before expiration, true within window, false outside window", async function () {
      if (!isHardhatNetwork) {
        this.skip(); // Skip on non-Hardhat networks
      }
      const exp = await europeanCallOption.expirationTime();

      // Before expiration
      expect(await europeanCallOption.isExercisable()).to.equal(false);

      // 1 second after expiration (within window)
      await time.increaseTo(Number(exp) + 1);
      expect(await europeanCallOption.isExercisable()).to.equal(true);

      // 10 days + 1 second after expiration (beyond window)
      await time.increaseTo(Number(exp) + 10 * 24 * 3600 + 1);
      expect(await europeanCallOption.isExercisable()).to.equal(false);
    });
  });

  // ============================================
  // expireOption Function Tests
  // ============================================
  describe("expireOption", function () {
    beforeEach(async function () {
      europeanCallOption = await deployActivatedOption();
    });

    it("should be able to call expireOption after exercise window ends", async function () {
      if (!isHardhatNetwork) {
        this.skip(); // Skip on non-Hardhat networks
      }
      const expirationTime = await europeanCallOption.expirationTime();
      
      // Fast-forward to end of exercise window (more than 10 days)
      await time.increaseTo(Number(expirationTime) + 11 * 24 * 3600);

      const tx = await europeanCallOption.expireOption();
      const receipt = await tx.wait();

      // Check event
      const expiredEvent = receipt.logs.find((log: any) => {
        try {
          const decoded = europeanCallOption.interface.parseLog(log);
          return decoded.name === "OptionExpired";
        } catch {
          return false;
        }
      });
      expect(expiredEvent).to.not.be.undefined;

      // Verify status changed to Expired
      expect(await europeanCallOption.status()).to.equal(2);

      // Additional assertion: Cannot exercise after expiration
      await expect(
        europeanCallOption.connect(holder).exercised()
      ).to.be.revertedWith("Option must be active");
    });
  });
});

