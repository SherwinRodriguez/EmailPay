const { v4: uuidv4 } = require("uuid");
const config = require("../config");

class IntentParser {
  constructor() {
    // Updated regex: SEND <amount> <ETH|PYUSD> TO <email>
    this.commandRegex =
      /^SEND\s+(\d+(?:\.\d+)?)\s+(ETH|PYUSD)\s+TO\s+([^\s]+@[^\s]+)$/i;
  }

  parseCommand(emailBody) {
    // Clean up the body
    const cleanBody = emailBody.trim().split("\n")[0].trim();

    const match = cleanBody.match(this.commandRegex);

    if (!match) {
      return {
        valid: false,
        error:
          "Invalid command format. Use: SEND <amount> ETH|PYUSD TO <recipient_email>",
      };
    }

    const amount = parseFloat(match[1]);
    const asset = match[2].toUpperCase();
    const recipientEmail = match[3].toLowerCase();

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      return {
        valid: false,
        error: "Invalid amount. Must be a positive number.",
      };
    }

    // Validate email format
    if (!this.isValidEmail(recipientEmail)) {
      return {
        valid: false,
        error: "Invalid recipient email address.",
      };
    }

    return {
      valid: true,
      amount,
      asset: asset,
      recipientEmail,
      command: cleanBody,
    };
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  generateTransactionIntent(
    senderEmail,
    recipientEmail,
    amount,
    asset = "PYUSD"
  ) {
    const txId = uuidv4();
    const timestamp = new Date().toISOString();

    return {
      txId,
      senderEmail,
      recipientEmail,
      amount,
      asset,
      chainId: config.sepolia.chainId,
      tokenAddress: config.sepolia.pyusdAddress,
      timestamp,
      status: "pending",
      expiresAt: new Date(
        Date.now() + config.policies.txExpiryMinutes * 60000
      ).toISOString(),
    };
  }

  validatePolicies(amount, dailySpending, asset = "PYUSD") {
    const errors = [];

    // Different limits for ETH vs PYUSD
    const maxAmount = asset === "ETH" ? 0.1 : config.policies.maxTxAmount; // Max 0.1 ETH or 100 PYUSD
    const dailyCap = asset === "ETH" ? 0.5 : config.policies.dailyTxCap; // Max 0.5 ETH or 500 PYUSD per day

    // Check max transaction amount
    if (amount > maxAmount) {
      errors.push(
        `Transaction amount exceeds maximum of ${maxAmount} ${asset} per transaction`
      );
    }

    // Check daily cap
    if (dailySpending + amount > dailyCap) {
      errors.push(
        `Transaction would exceed daily cap of ${dailyCap} ${asset}. Current spending: ${dailySpending} ${asset}`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

module.exports = new IntentParser();
