// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./EuropeanCallOption.sol";

/**
 * @title OptionFactory
 * @dev Option factory contract for creating and managing all option instances
 * @notice Provides functions for creating options, matching options, and querying option lists
 */
contract OptionFactory {
    // Option information structure
    struct OptionInfo {
        address optionAddress;
        address issuer;
        address holder;
        uint256 createdAt;
        bool exists;
    }
    
    // Array of all options
    OptionInfo[] public options;
    
    // Mapping: option address => option index (if option doesn't exist, mapped value is 0 and optionAddress doesn't match)
    mapping(address => uint256) public optionIndex;
    
    // Mapping: user address => list of created options
    mapping(address => address[]) public userCreatedOptions;
    
    // Event definitions
    event OptionCreated(
        uint256 indexed optionId,
        address indexed optionAddress,
        address indexed issuer,
        address underlyingAsset,
        address strikeAsset,
        uint256 strikePrice,
        uint256 expirationTime,
        uint256 contractSize
    );
    
    event OptionMatched(
        uint256 indexed optionId,
        address indexed optionAddress,
        address indexed holder
    );
    
    /**
     * @dev Create a new option
     * @param _underlyingAsset Underlying asset address
     * @param _strikeAsset Strike asset address
     * @param _strikePrice Strike price
     * @param _expirationTime Expiration timestamp
     * @param _contractSize Contract size
     * @return optionId Option ID
     * @return optionAddress Option contract address
     */
    function createOption(
        address _underlyingAsset,
        address _strikeAsset,
        uint256 _strikePrice,
        uint256 _expirationTime,
        uint256 _contractSize
    ) external returns (uint256 optionId, address optionAddress) {
        // Create new option instance (holder set to address(0), indicating waiting for matching)
        EuropeanCallOption newOption = new EuropeanCallOption(
            _underlyingAsset,
            _strikeAsset,
            _strikePrice,
            _expirationTime,
            _contractSize,
            address(0), // holder set to 0, waiting for matching
            msg.sender, // issuer address (user calling the factory contract)
            address(this) // factory address
        );
        
        optionAddress = address(newOption);
        optionId = options.length;
        
        // Store option information
        options.push(OptionInfo({
            optionAddress: optionAddress,
            issuer: msg.sender,
            holder: address(0),
            createdAt: block.timestamp,
            exists: true
        }));
        
        optionIndex[optionAddress] = optionId;
        userCreatedOptions[msg.sender].push(optionAddress);
        
        // Emit event
        emit OptionCreated(
            optionId,
            optionAddress,
            msg.sender,
            _underlyingAsset,
            _strikeAsset,
            _strikePrice,
            _expirationTime,
            _contractSize
        );
    }
    
    /**
     * @dev Match option (set holder)
     * @param _optionAddress Option contract address
     */
    function matchOption(address _optionAddress) external {
        require(_optionAddress != address(0), "Invalid option address");
        
        uint256 idx = optionIndex[_optionAddress];
        // Check if option exists: if idx is 0, need to verify if the first option matches
        require(
            (idx > 0 && idx < options.length) || 
            (idx == 0 && options.length > 0 && options[0].optionAddress == _optionAddress),
            "Option does not exist"
        );
        
        OptionInfo storage option = options[idx];
        
        require(option.exists, "Option does not exist");
        require(option.holder == address(0), "Option already matched");
        
        // Get option instance and check status
        EuropeanCallOption optionContract = EuropeanCallOption(_optionAddress);
        require(optionContract.status() == EuropeanCallOption.OptionStatus.Created, "Option must be in Created state");
        
        // Set holder
        optionContract.setHolder(msg.sender);
        option.holder = msg.sender;
        
        // Emit event
        emit OptionMatched(idx, _optionAddress, msg.sender);
    }
    
    /**
     * @dev Get all option addresses
     * @return addresses Array of all option addresses
     */
    function getAllOptions() external view returns (address[] memory addresses) {
        addresses = new address[](options.length);
        for (uint256 i = 0; i < options.length; i++) {
            addresses[i] = options[i].optionAddress;
        }
    }
    
    /**
     * @dev Get matchable option addresses (holder is address(0) and status is Created)
     * @return addresses Array of matchable option addresses
     */
    function getMatchableOptions() external view returns (address[] memory addresses) {
        // First calculate the number of matchable options
        uint256 count = 0;
        for (uint256 i = 0; i < options.length; i++) {
            if (options[i].exists && options[i].holder == address(0)) {
                try EuropeanCallOption(options[i].optionAddress).status() returns (EuropeanCallOption.OptionStatus status) {
                    if (status == EuropeanCallOption.OptionStatus.Created) {
                        count++;
                    }
                } catch {
                    // If call fails, skip this option
                }
            }
        }
        
        // Fill result array
        addresses = new address[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < options.length; i++) {
            if (options[i].exists && options[i].holder == address(0)) {
                try EuropeanCallOption(options[i].optionAddress).status() returns (EuropeanCallOption.OptionStatus status) {
                    if (status == EuropeanCallOption.OptionStatus.Created) {
                        addresses[index] = options[i].optionAddress;
                        index++;
                    }
                } catch {
                    // If call fails, skip this option
                }
            }
        }
    }
    
    /**
     * @dev Get total number of options
     * @return count Total number of options
     */
    function getOptionCount() external view returns (uint256 count) {
        return options.length;
    }
    
    /**
     * @dev Get option information
     * @param _optionAddress Option contract address
     * @return info Option information
     */
    function getOptionInfo(address _optionAddress) external view returns (OptionInfo memory info) {
        require(_optionAddress != address(0), "Invalid option address");
        
        uint256 idx = optionIndex[_optionAddress];
        // Check if option exists: if idx is 0, need to verify if the first option matches
        require(
            (idx > 0 && idx < options.length) || 
            (idx == 0 && options.length > 0 && options[0].optionAddress == _optionAddress),
            "Option does not exist"
        );
        
        return options[idx];
    }
    
    /**
     * @dev Get all options created by a user
     * @param _user User address
     * @return addresses Array of option addresses created by the user
     */
    function getUserCreatedOptions(address _user) external view returns (address[] memory addresses) {
        return userCreatedOptions[_user];
    }
}

