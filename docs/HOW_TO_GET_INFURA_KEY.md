# How to Get Infura API Key

This guide will walk you through the steps to obtain an Infura API Key for connecting to Sepolia testnet.

## What is Infura?

Infura is a hosted Ethereum node service provider that provides you with HTTP API access to Ethereum networks. Benefits of using Infura:

- ✅ No need to run and maintain your own node
- ✅ High availability and stability
- ✅ Supports multiple networks (Mainnet, Sepolia, etc.)
- ✅ Free tier suitable for development and testing

## Steps to Get Infura API Key

### Step 1: Visit Infura Website

Open your browser and visit: **https://www.infura.io/**

### Step 2: Register Account

1. Click the **"Get Started for Free"** or **"Sign Up"** button in the top right corner
2. Register an account with your email
3. Verify email address
4. Set password (recommended to use strong password)

### Step 3: Login and Create Project

1. Log in to Infura Dashboard with your account
2. Enter the console (Dashboard)
3. Click **"Create New Key"** or **"Create a key"** button
4. In the popup window:
   - **Network**: Select **"Web3 API"** (includes all Ethereum networks)
   - **Name**: Enter project name, for example `"EuropeanCallOption-DeFi"`

### Step 4: Get Project ID

After creating the project, you will see an **API Key** or **Project ID**

- Usually displayed as: `"Your Project ID: abc123def456..."`
- May also be displayed as string format
- **Important**: This is your `YOUR_INFURA_KEY`

### Step 5: Configure .env File

Configure in the `.env` file in the project root directory:

```bash
# Infura Sepolia RPC URL
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# Example (please replace with your actual Project ID)
# SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/abc123def456789...
```

## Complete .env Configuration Example

```bash
# Infura RPC URL
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_actual_project_id_here

# Account private key (exported from MetaMask or hardware wallet)
PRIVATE_KEY=your_private_key_here

# Etherscan API Key (optional, for contract verification)
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

## Notes

### ⚠️ Security Tips

1. **Do not commit API Key to code repository**
   - `.env` file should be in `.gitignore`
   - Do not share real API Key with others

2. **Limit API Key permissions**
   - Only enable needed networks (Sepolia testnet)
   - Regularly rotate API Keys

3. **Monitor usage**
   - Infura has request limits
   - Free plan: 100,000 requests per day

### 📊 Infura Free Plan Limits

- **Requests per day**: 100,000
- **Requests per second**: 100
- **Networks**: Supports all Ethereum networks
- **Sufficient**: More than enough for development and testing

### 🔄 If Exceeding Limits

If you encounter rate limit errors, you can:

1. **Use other RPC providers**:
   - **Alchemy**: https://www.alchemy.com/
   - **QuickNode**: https://www.quicknode.com/
   - **Public RPC**: https://publicnode.com/

2. **Upgrade Infura plan**: Pay for higher limits

3. **Run local node**: Use Hardhat built-in node

## Alternative: Use Public RPC

If you don't want to register with Infura, you can use public RPC (not recommended for production):

```bash
# Sepolia public RPC
SEPOLIA_RPC_URL=https://rpc.sepolia.org
```

**Note**:
- Public RPC is unstable and may timeout frequently
- Does not support WebSocket
- No usage statistics
- May have rate limits

## Verify Configuration

After configuration, use the following command to test connection:

```bash
# Test RPC connection
npx hardhat run --network sepolia -e "console.log('Chain ID:', await ethers.provider._networkPromise.then(n => n.chainId))"
```

If configured correctly, should output: `Chain ID: 11155111`

## Troubleshooting

### Issue 1: "Invalid Project ID"

**Cause**: Project ID format error or doesn't exist

**Solution**:
1. Check if Project ID is correctly copied
2. Confirm there are no extra spaces or line breaks
3. Recreate project and get new Project ID

### Issue 2: "Rate limit exceeded"

**Cause**: Requests exceeded free plan limits

**Solution**:
1. Wait until next billing cycle (24 hours)
2. Use other RPC providers
3. Upgrade to paid plan

### Issue 3: "Network not found"

**Cause**: Project has not enabled Sepolia network

**Solution**:
1. Edit project in Infura Dashboard
2. Ensure Sepolia network is enabled
3. Re-save project configuration

## Related Resources

- **Infura Website**: https://www.infura.io/
- **Infura Documentation**: https://docs.infura.io/
- **Infura Dashboard**: https://dashboard.infura.io/
- **Sepolia Public RPC**: https://ethereum.org/en/developers/docs/apis/json-rpc/
- **Alchemy Alternative**: https://www.alchemy.com/

---

**Tip**: Registering an Infura account is free and only takes a few minutes. It's recommended to create a separate Infura project for your project for easier management and monitoring.
