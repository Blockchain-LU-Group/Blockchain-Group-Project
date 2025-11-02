import { expect } from "chai";
import { ethers, network } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("EuropeanCallOption Integration Test", function () {
  let europeanCallOption: any;
  let underlyingToken: any;
  let strikeToken: any;
  let issuer: any;
  let holder: any;
  let isHardhatNetwork: boolean;

  const STRIKE_PRICE = ethers.parseEther("100");
  const CONTRACT_SIZE = ethers.parseEther("1");
  const PREMIUM = ethers.parseEther("10");

  // Check if we're on Hardhat Network (time manipulation only works there)
  before(async function () {
    // Check network name instead of making network calls
    isHardhatNetwork = network.name === "hardhat";
  });

  // Before each test case: Deploy tokens and distribute balances
  beforeEach(async function () {
    [issuer, holder] = await ethers.getSigners();

    // Deploy Mock ERC20 tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    underlyingToken = await MockERC20.deploy("Underlying Asset", "UA", ethers.parseEther("1000000"));
    strikeToken = await MockERC20.deploy("Strike Asset", "SA", ethers.parseEther("1000000"));

    // Distribute tokens
    await strikeToken.transfer(holder.address, ethers.parseEther("10000"));
    await underlyingToken.transfer(issuer.address, ethers.parseEther("10000"));
  });

  it("Complete workflow: Create option → Pay premium → Exercise", async function () {
    // Step 1: Create option
    const latestBlock = await ethers.provider.getBlock('latest');
    const expirationTime = (latestBlock?.timestamp || 0) + 86400;
    const EuropeanCallOption = await ethers.getContractFactory("EuropeanCallOption");
    europeanCallOption = await EuropeanCallOption.deploy(
      underlyingToken.target,
      strikeToken.target,
      STRIKE_PRICE,
      expirationTime,
      CONTRACT_SIZE,
      holder.address,
      issuer.address,
      issuer.address // Use issuer address as factory address (for testing)
    );

    console.log("\n✅ Integration test - Option contract deployment address:", await europeanCallOption.getAddress());

    // Initial status should be Created(0)
    expect(await europeanCallOption.status()).to.equal(0);

    // Step 2: Pay premium
    // Note: Exercise requires issuer to approve underlying asset, approve in advance here
    await underlyingToken.connect(issuer).approve(europeanCallOption.target, CONTRACT_SIZE * 2n);
    // Approve sufficient strikeToken first for paying premium and subsequent exercise
    const strikeAmount = STRIKE_PRICE * CONTRACT_SIZE / ethers.parseEther("1");
    await strikeToken.connect(holder).approve(europeanCallOption.target, PREMIUM + strikeAmount);
    
    // Record balances before payment (for precise assertions)
    const issuerStrikeBefore = await strikeToken.balanceOf(issuer.address);
    const holderStrikeBefore = await strikeToken.balanceOf(holder.address);
    const issuerUnderlyingBefore = await underlyingToken.balanceOf(issuer.address);
    const holderUnderlyingBefore = await underlyingToken.balanceOf(holder.address);

    // Pay premium
    const premiumTx = await europeanCallOption.connect(holder).payPremium(PREMIUM);
    const premiumReceipt = await premiumTx.wait();
    
    // Verify premium payment event
    const premiumPaidEvent = premiumReceipt.logs.find((log: any) => {
      try {
        const decoded = europeanCallOption.interface.parseLog(log);
        return decoded.name === "PremiumPaid";
      } catch {
        return false;
      }
    });
    expect(premiumPaidEvent).to.not.be.undefined;

    // Verify option status changed to Active
    expect(await europeanCallOption.status()).to.equal(1);

    // Step 3: Exercise
    // Fast-forward to expiration time (only works on Hardhat Network)
    if (!isHardhatNetwork) {
      this.skip(); // Skip this test on non-Hardhat networks
    }
    await time.increaseTo(expirationTime + 1);

    // Exercise
    const exercisedTx = await europeanCallOption.connect(holder).exercised();
    const exercisedReceipt = await exercisedTx.wait();

    // Verify exercise event
    const exercisedEvent = exercisedReceipt.logs.find((log: any) => {
      try {
        const decoded = europeanCallOption.interface.parseLog(log);
        return decoded.name === "OptionExercised";
      } catch {
        return false;
      }
    });
    expect(exercisedEvent).to.not.be.undefined;

    // Verify option status changed to Exercised
    expect(await europeanCallOption.status()).to.equal(3);

    // Verify asset transfers (precise assertions)
    const issuerStrikeAfter = await strikeToken.balanceOf(issuer.address);
    const holderStrikeAfter = await strikeToken.balanceOf(holder.address);
    const issuerUnderlyingAfter = await underlyingToken.balanceOf(issuer.address);
    const holderUnderlyingAfter = await underlyingToken.balanceOf(holder.address);

    // Issuer receives: premium + strikeAmount
    expect(issuerStrikeAfter - issuerStrikeBefore).to.equal(PREMIUM + strikeAmount);
    // Holder pays: premium + strikeAmount
    expect(holderStrikeBefore - holderStrikeAfter).to.equal(PREMIUM + strikeAmount);
    // Holder receives: underlying contract size
    expect(holderUnderlyingAfter - holderUnderlyingBefore).to.equal(CONTRACT_SIZE);
    // Issuer pays: underlying contract size
    expect(issuerUnderlyingBefore - issuerUnderlyingAfter).to.equal(CONTRACT_SIZE);
  });
});

