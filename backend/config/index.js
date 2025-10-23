require("dotenv").config();

module.exports = {
  // Network Configuration
  sepolia: {
    rpc: process.env.SEPOLIA_RPC,
    chainId: parseInt(process.env.CHAIN_ID || "11155111"),
    explorerBase:
      process.env.EXPLORER_BASE || "https://sepolia.etherscan.io/tx/",
    pyusdAddress:
      process.env.PYUSD_ADDRESS || "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9",
  },

  // Gmail Configuration
  gmail: {
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    refreshToken: process.env.GMAIL_REFRESH_TOKEN,
    user: process.env.GMAIL_USER,
    pollQuery: process.env.GMAIL_POLL_QUERY || "in:inbox newer_than:1d",
    pollIntervalMs: 30000, // Poll every 30 seconds
  },

  // Lit Protocol Configuration
  lit: {
    network: process.env.LIT_NETWORK || "habanero",
    actionIpfsCid: process.env.LIT_ACTION_IPFS_CID,
  },

  // Transaction Policies
  policies: {
    maxTxAmount: parseFloat(process.env.MAX_TX_AMOUNT || "100"),
    dailyTxCap: parseFloat(process.env.DAILY_TX_CAP || "500"),
    txExpiryMinutes: parseInt(process.env.TX_EXPIRY_MINUTES || "30"),
  },

  // Hot Wallet for signing transactions
  hotWallet: {
    privateKey: process.env.HOT_WALLET_PRIVATE_KEY || "",
  },

  // Server Configuration
  server: {
    port: parseInt(process.env.PORT || "3001"),
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  },

  // Database Configuration
  database: {
    path: process.env.DB_PATH || "./data/db.json",
  },
};
