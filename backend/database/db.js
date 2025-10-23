const fs = require("fs").promises;
const path = require("path");
const config = require("../config");

class Database {
  constructor() {
    this.dbPath = config.database.path;
    this.data = null;
  }

  async initialize() {
    try {
      const dir = path.dirname(this.dbPath);
      await fs.mkdir(dir, { recursive: true });

      try {
        const content = await fs.readFile(this.dbPath, "utf-8");
        this.data = JSON.parse(content);
      } catch (err) {
        // Initialize empty database
        this.data = {
          users: {},
          transactions: {},
          pendingTransactions: {},
          processedEmails: new Set(),
          dailySpending: {},
        };
        await this.save();
      }

      // Convert processedEmails array to Set if needed
      if (Array.isArray(this.data.processedEmails)) {
        this.data.processedEmails = new Set(this.data.processedEmails);
      }
    } catch (err) {
      console.error("Database initialization error:", err);
      throw err;
    }
  }

  async save() {
    const dataToSave = {
      ...this.data,
      processedEmails: Array.from(this.data.processedEmails),
    };
    await fs.writeFile(this.dbPath, JSON.stringify(dataToSave, null, 2));
  }

  // User Management
  async createUser(email, pkpPublicKey, pkpEthAddress, otpCode) {
    this.data.users[email] = {
      email,
      pkpPublicKey,
      pkpEthAddress,
      otpCode,
      verified: false,
      createdAt: new Date().toISOString(),
    };
    await this.save();
    return this.data.users[email];
  }

  async verifyUser(email, otpCode) {
    const user = this.data.users[email];
    if (!user) return false;

    if (user.otpCode === otpCode) {
      user.verified = true;
      user.verifiedAt = new Date().toISOString();
      await this.save();
      return true;
    }
    return false;
  }

  async getUser(email) {
    return this.data.users[email] || null;
  }

  async updateUserOtp(email, newOtpCode) {
    const user = this.data.users[email];
    if (!user) return false;

    user.otpCode = newOtpCode;
    await this.save();
    return true;
  }

  async updateUserPKP(email, pkpPublicKey, pkpEthAddress) {
    const user = this.data.users[email];
    if (!user) throw new Error("User not found");
    user.pkpPublicKey = pkpPublicKey;
    user.pkpEthAddress = pkpEthAddress;
    await this.save();
    return true;
  }

  async userExists(email) {
    return !!this.data.users[email];
  }

  async isUserVerified(email) {
    const user = this.data.users[email];
    return user && user.verified;
  }

  // Transaction Management
  async createTransaction(txId, txData) {
    this.data.transactions[txId] = {
      ...txData,
      createdAt: new Date().toISOString(),
    };
    await this.save();
    return this.data.transactions[txId];
  }

  async getTransaction(txId) {
    return this.data.transactions[txId] || null;
  }

  async createPendingTransaction(txId, txData) {
    this.data.pendingTransactions[txId] = {
      ...txData,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(
        Date.now() + config.policies.txExpiryMinutes * 60000
      ).toISOString(),
    };
    await this.save();
    return this.data.pendingTransactions[txId];
  }

  async getPendingTransaction(txId) {
    return this.data.pendingTransactions[txId] || null;
  }

  async getPendingTransactionsForRecipient(recipientEmail) {
    return Object.entries(this.data.pendingTransactions)
      .filter(
        ([_, tx]) => tx.recipientEmail === recipientEmail && !tx.completed
      )
      .map(([id, tx]) => ({ id, ...tx }));
  }

  async completePendingTransaction(txId) {
    if (this.data.pendingTransactions[txId]) {
      this.data.pendingTransactions[txId].completed = true;
      await this.save();
    }
  }

  async deletePendingTransaction(txId) {
    delete this.data.pendingTransactions[txId];
    await this.save();
  }

  // Email Deduplication
  async isEmailProcessed(emailId) {
    return this.data.processedEmails.has(emailId);
  }

  async markEmailProcessed(emailId) {
    this.data.processedEmails.add(emailId);
    await this.save();
  }

  // Daily Spending Tracking
  async getDailySpending(
    email,
    asset = "PYUSD",
    date = new Date().toISOString().split("T")[0]
  ) {
    const key = `${email}:${asset}:${date}`;
    return this.data.dailySpending[key] || 0;
  }

  async addDailySpending(
    email,
    amount,
    asset = "PYUSD",
    date = new Date().toISOString().split("T")[0]
  ) {
    const key = `${email}:${asset}:${date}`;
    this.data.dailySpending[key] = (this.data.dailySpending[key] || 0) + amount;
    await this.save();
    return this.data.dailySpending[key];
  }

  // Cleanup expired pending transactions
  async cleanupExpiredTransactions() {
    const now = new Date();
    let cleaned = 0;

    for (const [txId, tx] of Object.entries(this.data.pendingTransactions)) {
      if (new Date(tx.expiresAt) < now && !tx.completed) {
        delete this.data.pendingTransactions[txId];
        cleaned++;
      }
    }

    if (cleaned > 0) {
      await this.save();
      console.log(`Cleaned up ${cleaned} expired pending transactions`);
    }
  }
}

module.exports = new Database();
