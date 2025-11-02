# How to Get Etherscan API Key

This guide will walk you through the steps to obtain an Etherscan API Key for verifying smart contract code.

## What is Etherscan?

Etherscan is an Ethereum blockchain explorer that provides:

- 🔍 View transactions and contracts
- 📄 Smart contract source code verification
- 📊 Real-time block and transaction data
- 🔐 Token balances and transfer records
- 💰 Gas prices and network status

**API Key Uses**:
- Verify smart contract source code
- Query transaction status
- Get block information
- Automated tasks

## Steps to Get Etherscan API Key

### Step 1: Visit Etherscan Website

Open your browser and visit: **https://etherscan.io/**

### Step 2: Register an Account

1. Click the **"Login / Sign Up"** button in the top right corner
2. Select the **"Sign Up"** tab
3. Fill in registration information:
   - **Username**: Username
   - **Email**: Email address
   - **Password**: Password
   - **Confirm Password**: Confirm password
   - **Country**: Select country
4. Check the agreement box and create account

**Note**: Mainnet and testnets (such as Sepolia) use the same account system.

### Step 3: Verify Email

1. Log in to the email account you used for registration
2. Look for the verification email from Etherscan
3. Click the verification link to complete email verification

### Step 4: Login and Create API Key

1. Log in to Etherscan with your account
2. Click your username in the top right corner, select **"API-KEYs"** or visit: **https://etherscan.io/myapikey**
3. Click the **"+ Add"** button to create a new API Key
4. Enter API Key name, for example: `"EuropeanCallOption-DeFi"`
5. Click the **"Create"** button

### Step 5: Get API Key

After successful creation, you will see:

- **API Key Token**: Something like `ABCD1234EFGH5678IJKL9012MNOP3456`
- **Status**: Shows as "Active" when available
- **Usage Statistics**: Shows daily usage

**Important**: This is your `YOUR_ETHERSCAN_API_KEY`

### Step 6: Configure .env File

Configure in the `.env` file in the project root directory:

```bash
# Etherscan API Key (for contract verification)
ETHERSCAN_API_KEY=your_actual_api_key_here

# Example
# ETHERSCAN_API_KEY=ABCD1234EFGH5678IJKL9012MNOP3456
```

## Complete .env Configuration Example

```bash
# Infura RPC URL
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_infura_key

# Account private key
PRIVATE_KEY=your_private_key_here

# Etherscan API Key
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

## Using API Key to Verify Contracts

After configuration, you can use the following commands to verify contracts:

```bash
# Verify deployed contract (Hardhat auto-generated command)
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>

# Or use project's verification script
npx hardhat run scripts/verify_contract.ts --network sepolia
```

**Example**:

```bash
npx hardhat verify --network sepolia \
  0x5FbDB2315678afecb367f032d93F642f64180aa3 \
  "0x1234..." \
  "0x5678..." \
  100000000000000000000 \
  1234567890 \
  1000000000000000000 \
  0xHolderAddress
```

## Notes

### ⚠️ Security Tips

1. **Protect API Key**
   - Do not commit API Key to code repository
   - `.env` file should be in `.gitignore`
   - Do not share API Key publicly

2. **Limit Usage Scope**
   - Use different API Keys for mainnet and testnet (if possible)
   - Regularly check usage statistics
   - If leaked, delete immediately and create a new one

3. **Monitor Usage**
   - Etherscan has request limits
   - Free plan: 5 requests per second

### 📊 Etherscan API Free Plan Limits

- **Free Plan**:
  - Requests per second: 5
  - Requests per day: 100,000
  - Batch requests: Supported

- **Pro Plan** (Paid):
  - Requests per second: 50
  - Requests per day: 5,000,000
  - Ad-free
  - Priority support

### 📍 Etherscan for Different Networks

Etherscan provides multiple network explorers:

- **Ethereum Mainnet**: https://etherscan.io/
- **Sepolia Testnet**: https://sepolia.etherscan.io/
- **Goerli Testnet**: https://goerli.etherscan.io/
- **Polygon**: https://polygonscan.com/
- **BSC**: https://bscscan.com/
- **Arbitrum**: https://arbiscan.io/
- **Optimism**: https://optimistic.etherscan.io/

**Note**: Different networks may require separate accounts or API Keys.

## Troubleshooting

### Issue 1: "Invalid API Key"

**Cause**: API Key format error or expired

**Solution**:
1. Check if API Key is correctly copied
2. Confirm there are no extra spaces or line breaks
3. In Etherscan Dashboard, confirm API Key status is "Active"
4. Recreate API Key

### Issue 2: "Rate limit exceeded"

**Cause**: Requests exceeded free plan limits

**Solution**:
1. Wait until next billing cycle (usually resets by minute or hour)
2. Reduce request frequency
3. Use cache to reduce duplicate requests
4. Upgrade to Pro plan

### Issue 3: "Contract verification failed"

**Cause**: Verification parameters don't match or network issues

**Solution**:
1. Check if constructor parameters are correct
2. Confirm compiler version and settings match
3. Check network connection
4. View detailed error messages

### Issue 4: "Not authorized"

**Cause**: Insufficient API Key permissions

**Solution**:
1. Confirm you're logged in with the correct account
2. Check if API Key is disabled
3. Try regenerating API Key

## Benefits of Contract Verification

After verifying smart contract code, you can see on Etherscan:

1. **Source Code**: Complete contract code
2. **ABI**: Application Binary Interface
3. **Compiler Version**: Solidity version used
4. **Optimization Settings**: Whether optimizer is enabled
5. **Function Signatures**: Detailed information of all functions
6. **Event Definitions**: All events defined in the contract
7. **Debug Support**: Can interact with verified contracts

## Usage Examples

### Example 1: Automatic Verification After Deployment

Hardhat can be configured to automatically verify contracts after deployment:

```typescript
// hardhat.config.ts
module.exports = {
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      verify: {
        apiUrl: "https://api-sepolia.etherscan.io",
        apiKey: process.env.ETHERSCAN_API_KEY,
        explorerUrl: "https://sepolia.etherscan.io",
      },
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
```

### Example 2: Manual Contract Verification

```bash
# Basic verification
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS

# With constructor parameters
npx hardhat verify --network sepolia \
  DEPLOYED_CONTRACT_ADDRESS \
  "Constructor" \
  "Arguments"
```

### Example 3: Verify Option Contract

```bash
npx hardhat verify --network sepolia \
  0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9 \
  0x5FbDB2315678afecb367f032d93F642f64180aa3 \
  0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 \
  100000000000000000000 \
  1234567890 \
  1000000000000000000 \
  0xcfD60B67cBF1f0d69897712bDec2550eC09F8003
```

## Related Resources

- **Etherscan Mainnet**: https://etherscan.io/
- **Sepolia Etherscan**: https://sepolia.etherscan.io/
- **API Documentation**: https://docs.etherscan.io/
- **API Key Management**: https://etherscan.io/myapikey
- **Contract Verification Guide**: https://docs.etherscan.io/tutorials/verifying-contracts-programmatically
- **Hardhat Verification Plugin**: https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-verify

## FAQ

### Q: Is API Key required?

**A**: Required for contract verification. If you just want to view blockchain data, you can use without API Key (but with limitations).

### Q: Can I use the same API Key in multiple projects?

**A**: Yes, but it's recommended to create separate API Keys for each project for easier management and monitoring.

### Q: Does API Key expire?

**A**: Free plan API Keys do not expire automatically, as long as the account remains active.

### Q: How to delete or disable API Key?

**A**: 
1. Log in to Etherscan Dashboard
2. Go to API-KEYs page
3. Find the API Key to delete
4. Click "Delete" button

### Q: How long does contract verification take?

**A**: Usually from a few seconds to a few minutes, depending on network conditions and Etherscan processing time.

---

**Tip**: Etherscan API Key is free, and the registration process is simple and quick. It's recommended to configure it before deploying contracts so you can verify immediately after deployment.
