const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const config = require("./config");
const db = require("./database/db");
const gmailPoller = require("./services/gmailPoller");
const pkpWalletManager = require("./services/pkpWalletManager");
const policyBoundSigner = require("./services/policyBoundSigner");
const broadcaster = require("./services/broadcaster");
const intentParser = require("./services/intentParser");
const transactionProcessor = require("./services/transactionProcessor");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Create wallet
app.post("/api/wallet/create", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if wallet already exists
    const exists = await pkpWalletManager.walletExists(email);
    if (exists) {
      return res
        .status(400)
        .json({ error: "Wallet already exists for this email" });
    }

    // Create wallet
    const wallet = await pkpWalletManager.createWallet(email);
    console.log(`Wallet created for ${email}, OTP: ${wallet.otpCode}`);

    // Send verification email
    const notifier = require("./services/notifier");
    try {
      await notifier.sendWalletCreationEmail(email, wallet.otpCode);
      console.log(`✓ Verification email sent to ${email}`);
    } catch (emailErr) {
      console.error(
        `✗ Failed to send verification email to ${email}:`,
        emailErr.message
      );
      // Continue anyway - user can request resend
    }

    // For development: include OTP in response if not a real email domain
    const isDevelopment = process.env.NODE_ENV !== "production";
    const isTestEmail =
      email.includes("example.com") || email.includes("test.com");

    const response = {
      success: true,
      email: wallet.email,
      address: wallet.address,
      message: "Wallet created. Please check your email for verification code.",
    };

    // Include OTP for development/testing with non-real emails
    if (isDevelopment && isTestEmail) {
      response.otpCode = wallet.otpCode;
      response.devNote = "OTP included for development (test email detected)";
    }

    res.json(response);
  } catch (err) {
    console.error("Error creating wallet:", err);
    res.status(500).json({ error: "Failed to create wallet" });
  }
});

// Resend OTP
app.post("/api/wallet/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Get wallet
    const wallet = await pkpWalletManager.getWallet(email);
    if (!wallet) {
      return res
        .status(404)
        .json({ error: "Wallet not found. Please create a wallet first." });
    }

    if (wallet.verified) {
      return res.status(400).json({
        error: "Wallet already verified",
        alreadyVerified: true,
        wallet: {
          email: wallet.email,
          address: wallet.address,
        },
      });
    }

    // Generate new OTP
    const newOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await db.updateUserOtp(email, newOtpCode);
    console.log(`New OTP generated for ${email}: ${newOtpCode}`);

    // Send verification email
    const notifier = require("./services/notifier");
    try {
      await notifier.sendWalletCreationEmail(email, newOtpCode);
      console.log(`✓ OTP resent to ${email}`);
    } catch (emailErr) {
      console.error(`✗ Failed to resend OTP to ${email}:`, emailErr.message);
      return res
        .status(500)
        .json({ error: "Failed to send email. Please try again." });
    }

    // For development: include OTP in response if not a real email domain
    const isDevelopment = process.env.NODE_ENV !== "production";
    const isTestEmail =
      email.includes("example.com") || email.includes("test.com");

    const response = {
      success: true,
      message: "Verification code sent. Please check your email.",
    };

    // Include OTP for development/testing with non-real emails
    if (isDevelopment && isTestEmail) {
      response.otpCode = newOtpCode;
      response.devNote = "OTP included for development (test email detected)";
    }

    res.json(response);
  } catch (err) {
    console.error("Error resending OTP:", err);
    res.status(500).json({ error: "Failed to resend OTP" });
  }
});

// Dev-only: Import a PKP for a user (sets pkpPublicKey and derived address)
app.post("/api/wallet/import-pkp", async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res
        .status(403)
        .json({ error: "This endpoint is disabled in production" });
    }

    const { email, pkpPublicKey } = req.body || {};
    if (!email || !pkpPublicKey) {
      return res
        .status(400)
        .json({ error: "email and pkpPublicKey are required" });
    }

    // Ensure the wallet exists
    const exists = await pkpWalletManager.walletExists(email);
    if (!exists) {
      return res
        .status(404)
        .json({ error: "Wallet not found. Create it first." });
    }

    const result = await pkpWalletManager.importPKP(email, pkpPublicKey);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error("Error importing PKP:", err);
    res.status(500).json({ error: "Failed to import PKP" });
  }
});

// Verify wallet
app.post("/api/wallet/verify", async (req, res) => {
  try {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      return res.status(400).json({ error: "Email and OTP code are required" });
    }

    const verified = await pkpWalletManager.verifyWallet(email, otpCode);

    if (!verified) {
      return res.status(400).json({ error: "Invalid OTP code" });
    }

    // Process any pending transactions for this recipient
    await transactionProcessor.processPendingTransactions(email);

    res.json({
      success: true,
      message: "Wallet verified successfully",
    });
  } catch (err) {
    console.error("Error verifying wallet:", err);
    res.status(500).json({ error: "Failed to verify wallet" });
  }
});

// Get wallet info
app.get("/api/wallet/:email", async (req, res) => {
  try {
    const { email } = req.params;

    const wallet = await pkpWalletManager.getWallet(email);

    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    // Get all balances (ETH and PYUSD)
    const balances = await broadcaster.checkAllBalances(wallet.address);

    res.json({
      email: wallet.email,
      address: wallet.address,
      verified: wallet.verified,
      balances: {
        eth: balances.eth,
        pyusd: balances.pyusd,
      },
      // Legacy field for backward compatibility
      balance: balances.pyusd,
      asset: "PYUSD",
    });
  } catch (err) {
    console.error("Error getting wallet:", err);
    res.status(500).json({ error: "Failed to get wallet info" });
  }
});

// Dev-only: Send a transaction without email (for testing)
app.post("/api/tx/send", async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res
        .status(403)
        .json({ error: "This endpoint is disabled in production" });
    }

    const {
      senderEmail,
      recipientEmail,
      amount,
      asset = "ETH",
    } = req.body || {};

    if (!senderEmail || !recipientEmail || typeof amount !== "number") {
      return res
        .status(400)
        .json({
          error: "senderEmail, recipientEmail, and numeric amount are required",
        });
    }

    const normalizedAsset = (asset || "ETH").toUpperCase();

    // Validate policies (per-asset)
    const dailySpending = await db.getDailySpending(
      senderEmail,
      normalizedAsset
    );
    const policyValidation = intentParser.validatePolicies(
      amount,
      dailySpending,
      normalizedAsset
    );
    if (!policyValidation.valid) {
      return res
        .status(400)
        .json({ error: policyValidation.errors.join(", ") });
    }

    // Ensure both wallets exist and are verified
    const senderVerified = await pkpWalletManager.isWalletVerified(senderEmail);
    if (!senderVerified) {
      return res.status(400).json({ error: "Sender wallet not verified" });
    }

    const recipientVerified = await pkpWalletManager.isWalletVerified(
      recipientEmail
    );
    if (!recipientVerified) {
      return res
        .status(400)
        .json({
          error: "Recipient wallet not verified. Please onboard/verify first.",
        });
    }

    // Create transaction intent and execute
    const txIntent = intentParser.generateTransactionIntent(
      senderEmail,
      recipientEmail,
      amount,
      normalizedAsset
    );

    // Fire-and-forget execution; notifications and DB updates handled internally
    transactionProcessor
      .executeTransaction(txIntent)
      .catch((err) => console.error("Dev send endpoint execution error:", err));

    return res.json({
      accepted: true,
      txId: txIntent.txId,
      asset: normalizedAsset,
      amount,
    });
  } catch (err) {
    console.error("Dev send endpoint error:", err);
    res.status(500).json({ error: "Failed to initiate transaction" });
  }
});

// Onboard recipient
app.post("/api/onboard", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    // Parse token
    const tokenData = pkpWalletManager.parseOnboardingToken(token);
    if (!tokenData) {
      return res.status(400).json({ error: "Invalid token" });
    }

    const { email, txId } = tokenData;

    // Check if wallet already exists
    const exists = await pkpWalletManager.walletExists(email);
    if (exists) {
      return res.json({
        success: true,
        alreadyExists: true,
        email,
      });
    }

    // Create wallet
    const wallet = await pkpWalletManager.createWallet(email);

    // Send verification email
    const notifier = require("./services/notifier");
    await notifier.sendWalletCreationEmail(email, wallet.otpCode);

    res.json({
      success: true,
      email: wallet.email,
      address: wallet.address,
      txId,
      message: "Wallet created. Please check your email for verification code.",
    });
  } catch (err) {
    console.error("Error onboarding:", err);
    res.status(500).json({ error: "Failed to onboard" });
  }
});

// Get transaction status
app.get("/api/transaction/:txId", async (req, res) => {
  try {
    const { txId } = req.params;

    const tx = await db.getTransaction(txId);

    if (!tx) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json(tx);
  } catch (err) {
    console.error("Error getting transaction:", err);
    res.status(500).json({ error: "Failed to get transaction" });
  }
});

// Initialize services
async function initializeServices() {
  try {
    console.log("Initializing EmailPay backend...");

    // Initialize database
    await db.initialize();
    console.log("✓ Database initialized");

    // Initialize PKP Wallet Manager
    await pkpWalletManager.initialize();
    console.log("✓ PKP Wallet Manager initialized");

    // Initialize Policy Bound Signer
    await policyBoundSigner.initialize();
    console.log("✓ Policy Bound Signer initialized");

    // Initialize Broadcaster
    await broadcaster.initialize();
    console.log("✓ Broadcaster initialized");

    // Initialize Gmail Poller
    await gmailPoller.initialize();
    console.log("✓ Gmail Poller initialized");

    // Start polling emails
    await gmailPoller.startPolling(async (email) => {
      await transactionProcessor.processEmailCommand(email);
    });
    console.log("✓ Gmail polling started");

    // Cleanup expired transactions every 5 minutes
    setInterval(async () => {
      await db.cleanupExpiredTransactions();
    }, 5 * 60 * 1000);

    console.log("\n✓ All services initialized successfully\n");
  } catch (err) {
    console.error("Failed to initialize services:", err);
    process.exit(1);
  }
}

// Start server
const PORT = config.server.port;

app.listen(PORT, async () => {
  console.log(`\n🚀 EmailPay Backend Server running on port ${PORT}\n`);
  await initializeServices();
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down gracefully...");
  gmailPoller.stopPolling();
  await pkpWalletManager.disconnect();
  process.exit(0);
});
