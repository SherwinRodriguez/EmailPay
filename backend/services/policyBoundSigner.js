const { ethers } = require('ethers');
const config = require('../config');
const db = require('../database/db');

class PolicyBoundSigner {
  constructor() {
    this.provider = null;
  }

  async initialize() {
    try {
      this.provider = new ethers.JsonRpcProvider(config.sepolia.rpc);
      console.log('Policy Bound Signer initialized successfully');
    } catch (err) {
      console.error('Policy Bound Signer initialization error:', err);
      throw err;
    }
  }

  async validateAndSign(txIntent) {
    try {
      // 1. Validate sender wallet exists and is verified
      const senderWallet = await db.getUser(txIntent.senderEmail);
      if (!senderWallet) {
        return {
          valid: false,
          error: 'Sender wallet not found. Please create a wallet first.'
        };
      }

      if (!senderWallet.verified) {
        return {
          valid: false,
          error: 'Sender wallet not verified. Please verify your wallet first.'
        };
      }

      // 2. Check if transaction has expired
      if (new Date(txIntent.expiresAt) < new Date()) {
        return {
          valid: false,
          error: 'Transaction intent has expired.'
        };
      }

      // 3. Validate amount policies
      if (txIntent.amount > config.policies.maxTxAmount) {
        return {
          valid: false,
          error: `Transaction amount exceeds maximum of ${config.policies.maxTxAmount} PYUSD per transaction.`
        };
      }

      // 4. Check daily spending cap
      const dailySpending = await db.getDailySpending(txIntent.senderEmail);
      if (dailySpending + txIntent.amount > config.policies.dailyTxCap) {
        return {
          valid: false,
          error: `Transaction would exceed daily cap of ${config.policies.dailyTxCap} PYUSD. Current spending: ${dailySpending} PYUSD.`
        };
      }

      // 5. Get recipient wallet
      const recipientWallet = await db.getUser(txIntent.recipientEmail);
      if (!recipientWallet) {
        return {
          valid: false,
          error: 'Recipient wallet not found.',
          requiresOnboarding: true
        };
      }

      if (!recipientWallet.verified) {
        return {
          valid: false,
          error: 'Recipient wallet not verified.',
          requiresOnboarding: true
        };
      }

      // 6. Create unsigned transaction
      const unsignedTx = await this.createUnsignedTransaction(
        senderWallet.pkpEthAddress,
        recipientWallet.pkpEthAddress,
        txIntent.amount
      );

      // 7. Sign transaction (in production, use Lit Protocol PKP signing)
      // For demo purposes, we'll create a mock signature
      const signedTx = {
        ...unsignedTx,
        from: senderWallet.pkpEthAddress,
        to: recipientWallet.pkpEthAddress,
        value: '0',
        data: unsignedTx.data,
        chainId: config.sepolia.chainId,
        // Mock signature - in production, use PKP signing
        signature: {
          r: '0x' + '1'.repeat(64),
          s: '0x' + '2'.repeat(64),
          v: 27
        }
      };

      return {
        valid: true,
        signedTx,
        senderAddress: senderWallet.pkpEthAddress,
        recipientAddress: recipientWallet.pkpEthAddress
      };
    } catch (err) {
      console.error('Error in validateAndSign:', err);
      return {
        valid: false,
        error: `Signing error: ${err.message}`
      };
    }
  }

  async createUnsignedTransaction(fromAddress, toAddress, amount) {
    try {
      // PYUSD ERC-20 transfer
      const pyusdInterface = new ethers.Interface([
        'function transfer(address to, uint256 amount) returns (bool)'
      ]);

      // PYUSD has 6 decimals
      const amountInSmallestUnit = ethers.parseUnits(amount.toString(), 6);

      const data = pyusdInterface.encodeFunctionData('transfer', [
        toAddress,
        amountInSmallestUnit
      ]);

      // Get gas estimate
      const gasLimit = 100000n; // Standard ERC-20 transfer

      return {
        to: config.sepolia.pyusdAddress,
        data,
        gasLimit,
        chainId: config.sepolia.chainId
      };
    } catch (err) {
      console.error('Error creating unsigned transaction:', err);
      throw err;
    }
  }

  async estimateGas(fromAddress, toAddress, amount) {
    try {
      const pyusdInterface = new ethers.Interface([
        'function transfer(address to, uint256 amount) returns (bool)'
      ]);

      const amountInSmallestUnit = ethers.parseUnits(amount.toString(), 6);
      const data = pyusdInterface.encodeFunctionData('transfer', [
        toAddress,
        amountInSmallestUnit
      ]);

      const gasEstimate = await this.provider.estimateGas({
        from: fromAddress,
        to: config.sepolia.pyusdAddress,
        data
      });

      return gasEstimate;
    } catch (err) {
      console.error('Error estimating gas:', err);
      return 100000n; // Fallback
    }
  }
}

module.exports = new PolicyBoundSigner();
