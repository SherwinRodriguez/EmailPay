const { LitNodeClient } = require("@lit-protocol/lit-node-client");
const { ethers } = require("ethers");
const config = require("../config");
const db = require("../database/db");

class PKPWalletManager {
  constructor() {
    this.litNodeClient = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      // Map old network names to valid Lit Protocol networks
      // Valid networks: 'cayenne', 'manzano', 'habanero', 'custom'
      // 'habanero' is the testnet
      let litNetwork = config.lit.network;
      if (litNetwork === "datil-dev" || litNetwork === "datil-test") {
        litNetwork = "habanero"; // Use habanero testnet
      }

      this.litNodeClient = new LitNodeClient({
        litNetwork: litNetwork,
        debug: false,
      });

      await this.litNodeClient.connect();
      this.initialized = true;
      console.log("PKP Wallet Manager initialized successfully");
    } catch (err) {
      console.error("PKP Wallet Manager initialization error:", err);
      // For demo purposes, continue without Lit if it fails
      console.warn("⚠️  Continuing without Lit Protocol integration");
      this.initialized = true;
    }
  }

  async createWallet(email) {
    try {
      // Generate a random wallet for demo purposes
      // In production, you would use Lit Protocol's PKP minting
      const wallet = ethers.Wallet.createRandom();

      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Store in database
      const user = await db.createUser(
        email,
        wallet.publicKey,
        wallet.address,
        otpCode
      );

      console.log(`Wallet created for ${email}: ${wallet.address}`);

      return {
        email,
        address: wallet.address,
        publicKey: wallet.publicKey,
        otpCode,
      };
    } catch (err) {
      console.error("Error creating wallet:", err);
      throw err;
    }
  }

  async getWallet(email) {
    try {
      const user = await db.getUser(email);
      if (!user) {
        return null;
      }

      return {
        email: user.email,
        address: user.pkpEthAddress,
        publicKey: user.pkpPublicKey,
        verified: user.verified,
        hasPKP: !!user.pkpPublicKey,
      };
    } catch (err) {
      console.error("Error getting wallet:", err);
      throw err;
    }
  }

  async importPKP(email, pkpPublicKey) {
    try {
      const normalized = pkpPublicKey.startsWith("0x")
        ? pkpPublicKey
        : "0x" + pkpPublicKey;
      // Compute EVM address from uncompressed public key
      const address = ethers.computeAddress(normalized);
      await db.updateUserPKP(email, normalized, address);
      console.log(`Imported PKP for ${email}: ${address}`);
      return { email, address, publicKey: normalized };
    } catch (err) {
      console.error("Error importing PKP:", err);
      throw err;
    }
  }

  async verifyWallet(email, otpCode) {
    try {
      const verified = await db.verifyUser(email, otpCode);
      if (verified) {
        console.log(`Wallet verified for ${email}`);
      }
      return verified;
    } catch (err) {
      console.error("Error verifying wallet:", err);
      throw err;
    }
  }

  async isWalletVerified(email) {
    try {
      return await db.isUserVerified(email);
    } catch (err) {
      console.error("Error checking wallet verification:", err);
      return false;
    }
  }

  async walletExists(email) {
    try {
      return await db.userExists(email);
    } catch (err) {
      console.error("Error checking wallet existence:", err);
      return false;
    }
  }

  generateOnboardingToken(email, txId) {
    // In production, use JWT or secure token generation
    const token = Buffer.from(
      JSON.stringify({ email, txId, timestamp: Date.now() })
    )
      .toString("base64")
      .replace(/=/g, "");
    return token;
  }

  parseOnboardingToken(token) {
    try {
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      return JSON.parse(decoded);
    } catch (err) {
      return null;
    }
  }

  async disconnect() {
    if (this.litNodeClient) {
      await this.litNodeClient.disconnect();
      this.initialized = false;
      console.log("PKP Wallet Manager disconnected");
    }
  }
}

module.exports = new PKPWalletManager();
