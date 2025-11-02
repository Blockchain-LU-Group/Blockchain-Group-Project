// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title EuropeanCallOption
 * @dev European call option contract that supports option creation, premium payment, and exercise
 * @notice Each contract instance represents one option, conforming to DeFi option standard design
 */
contract EuropeanCallOption is ReentrancyGuard {
    
    enum OptionStatus { Created, Active, Expired, Exercised }
    
    // Basic option parameters
    address public underlyingAsset;  // Underlying asset address
    address public strikeAsset;      // Strike asset address
    uint256 public strikePrice;      // Strike price
    uint256 public expirationTime;   // Expiration timestamp
    uint256 public contractSize;     // Contract size
    
    // Option participants
    address public issuer;           // Issuer (seller)
    address public holder;           // Holder (buyer)
    address public factory;          // Factory contract address
    
    OptionStatus public status;
    
    // Event definitions
    event OptionCreated(address indexed issuer, address indexed holder);
    event OptionExercised(address indexed exerciser);
    event OptionExpired(address indexed caller);
    event PremiumPaid(address indexed payer, uint256 amount);
    // Note: Events don't change on-chain state but leave searchable records in transaction logs.
    // Frontend/backend/tests can subscribe to or parse logs to retrieve key business information
    // (e.g., who paid the premium, amount, etc.).
    
    /**
     * @dev Constructor, creates an option
     * @param _underlyingAsset Underlying asset address
     * @param _strikeAsset Strike asset address
     * @param _strikePrice Strike price
     * @param _expirationTime Expiration timestamp
     * @param _contractSize Contract size
     * @param _holder Holder address (can be address(0), indicating waiting for matching)
     * @param _issuer Issuer address
     * @param _factory Factory contract address
     */
    constructor(
        address _underlyingAsset,
        address _strikeAsset,
        uint256 _strikePrice,
        uint256 _expirationTime,
        uint256 _contractSize,
        address _holder,
        address _issuer,
        address _factory
    ) {
        require(_underlyingAsset != address(0), "Invalid underlying asset");
        require(_strikeAsset != address(0), "Invalid strike asset");
        require(_strikePrice > 0, "Strike price must be greater than 0");
        require(_expirationTime > block.timestamp, "Expiration time must be in the future");
        require(_contractSize > 0, "Contract size must be greater than 0");
        require(_issuer != address(0), "Invalid issuer address");
        require(_factory != address(0), "Invalid factory address");
        
        underlyingAsset = _underlyingAsset;
        strikeAsset = _strikeAsset;
        strikePrice = _strikePrice;
        expirationTime = _expirationTime;
        contractSize = _contractSize;
        holder = _holder; // Can be address(0), indicating waiting for matching
        issuer = _issuer;
        factory = _factory;
        
        status = OptionStatus.Created;
        
        emit OptionCreated(_issuer, _holder);
    }
    
    /**
     * @dev Pay premium to activate the option
     * @param premium Premium amount
     */
    function payPremium(uint256 premium) public nonReentrant {
        require(msg.sender == holder, "Only holder can pay premium");
        require(status == OptionStatus.Created, "Option must be in Created state");
        require(premium > 0, "Premium must be greater than 0");
        
        // Transfer premium from holder to issuer
        bool success = IERC20(strikeAsset).transferFrom(holder, issuer, premium);
        require(success, "Transfer failed");
        
        status = OptionStatus.Active;
        
        emit PremiumPaid(holder, premium); // Emit event: record "holder pays premium" in transaction logs for off-chain retrieval and monitoring
    }
   
    /**
     * @dev Exercise the option
     */
    function exercised() public nonReentrant {
        require(msg.sender == holder, "Only holder can exercise");
        require(status == OptionStatus.Active, "Option must be active");
        require(block.timestamp >= expirationTime, "Not yet exercisable");
        require(block.timestamp <= expirationTime + 10 days, "Exercise window expired");
        
        // Calculate required strike asset amount
        uint256 strikeAmount = strikePrice * contractSize / 1e18;
        
        // Holder pays strike asset to issuer
        bool strikeTransfer = IERC20(strikeAsset).transferFrom(holder, issuer, strikeAmount);
        require(strikeTransfer, "Strike asset transfer failed");
        
        // Issuer transfers underlying asset to holder
        bool underlyingTransfer = IERC20(underlyingAsset).transferFrom(issuer, holder, contractSize);
        require(underlyingTransfer, "Underlying asset transfer failed");
        
        status = OptionStatus.Exercised;
        
        emit OptionExercised(holder); // Emit event: record successful exercise participant
    }
    
    /**
     * @dev Set holder (only factory contract can call)
     * @param _holder New holder address
     */
    function setHolder(address _holder) external {
        require(msg.sender == factory, "Only factory can set holder");
        require(_holder != address(0), "Invalid holder address");
        require(holder == address(0), "Holder already set");
        require(status == OptionStatus.Created, "Option must be in Created state");
        
        holder = _holder;
    }
    
    /**
     * @dev Check if the option is exercisable
     * @return Whether the option is exercisable
     */
    function isExercisable() public view returns (bool) {
        return status == OptionStatus.Active && 
               block.timestamp >= expirationTime && 
               block.timestamp <= expirationTime + 10 days;
    }
    
    /**
     * @dev Mark the option as expired
     * @notice Anyone can call this function at any time to mark the option as expired
     *         Only when the option is not in Exercised or Expired state can it be marked
     */
    function expireOption() public {
        require(
            status == OptionStatus.Created || status == OptionStatus.Active,
            "Option must be Created or Active to expire"
        );
        
        status = OptionStatus.Expired;
        
        emit OptionExpired(msg.sender);
    }
    
}
