const { ethers } = require("ethers");
const { PKPEthersWallet } = require("@lit-protocol/pkp-ethers");
const config = require("../config");
const db = require("../database/db");

class Broadcaster {
  constructor() {
    this.provider = null;
    this.wallet = null;
  }

  async initialize() {
    try {
      this.provider = new ethers.JsonRpcProvider(config.sepolia.rpc);

      // Use hot wallet if private key is provided
      if (config.hotWallet && config.hotWallet.privateKey) {
        this.wallet = new ethers.Wallet(
          config.hotWallet.privateKey,
          this.provider
        );
        console.log("Broadcaster initialized with hot wallet");
        console.log("Broadcaster address:", this.wallet.address);

        // Check balance
        const balance = await this.provider.getBalance(this.wallet.address);
        console.log("Hot wallet balance:", ethers.formatEther(balance), "ETH");

        if (balance === 0n) {
          console.warn(
            "⚠️  Hot wallet has no ETH! Fund it to enable real transactions."
          );
          console.warn(`   Address: ${this.wallet.address}`);
          console.warn("   Get Sepolia ETH from: https://sepoliafaucet.com/");
        }
      } else {
        // Fallback to random wallet (demo mode)
        this.wallet = ethers.Wallet.createRandom().connect(this.provider);
        console.log(
          "Broadcaster initialized in DEMO MODE (no private key configured)"
        );
        console.log("Broadcaster address:", this.wallet.address);
      }
    } catch (err) {
      console.error("Broadcaster initialization error:", err);
      throw err;
    }
  }

  async broadcastTransaction(txIntent, signedTx) {
    try {
      console.log(`Broadcasting transaction ${txIntent.txId}...`);

      // Prefer PKP-based sending if sender has a PKP registered and we can use Lit
      const sender = await db.getUser(txIntent.senderEmail);
      const senderHasPKP = sender && sender.pkpPublicKey;

      // Real blockchain transaction for ETH
      if (txIntent.asset === "ETH") {
        // Resolve recipient EVM address from email
        const recipient = await db.getUser(txIntent.recipientEmail);
        if (!recipient || !recipient.pkpEthAddress) {
          throw new Error("Recipient wallet/address not found");
        }
        const toAddress = recipient.pkpEthAddress;

        // If PKP available, try sending from the user's PKP address
        if (senderHasPKP) {
          try {
            const result = await this.sendEthWithPKP(
              txIntent,
              toAddress,
              sender
            );
            if (result) return result;
          } catch (pkpErr) {
            console.error(
              "PKP send failed, will try hot wallet fallback:",
              pkpErr.message
            );
          }
        }

        // Otherwise, fallback to hot wallet (requires funding)
        try {
          const balance = await this.provider.getBalance(this.wallet.address);
          if (balance === 0n) {
            console.warn("⚠️  Hot wallet has no ETH for gas. Using demo mode.");
            return await this.broadcastDemoTransaction(txIntent, signedTx);
          }

          const tx = await this.wallet.sendTransaction({
            to: toAddress,
            value: ethers.parseEther(txIntent.amount.toString()),
            gasLimit: 21000,
          });

          console.log(`✓ Real transaction sent: ${tx.hash}`);
          console.log(`  Waiting for confirmation...`);

          const txReceipt = await tx.wait();

          console.log(
            `✓ Transaction confirmed in block ${txReceipt.blockNumber}`
          );

          // Update daily spending
          await db.addDailySpending(
            txIntent.senderEmail,
            txIntent.amount,
            txIntent.asset || "PYUSD"
          );

          // Store transaction in database
          await db.createTransaction(txIntent.txId, {
            ...txIntent,
            txHash: txReceipt.hash,
            blockNumber: txReceipt.blockNumber,
            status: "completed",
            completedAt: new Date().toISOString(),
            realTransaction: true,
            fromAddress: this.wallet.address,
            senderType: "hot-wallet",
          });

          console.log(
            `Transaction ${txIntent.txId} broadcasted successfully: ${txReceipt.hash}`
          );

          return {
            success: true,
            txHash: txReceipt.hash,
            blockNumber: txReceipt.blockNumber,
            explorerUrl: `${config.sepolia.explorerBase}${txReceipt.hash}`,
            realTransaction: true,
          };
        } catch (txErr) {
          console.error(
            "Hot wallet transaction failed, using demo mode:",
            txErr.message
          );
          return await this.broadcastDemoTransaction(txIntent, signedTx);
        }
      }

      // For PYUSD or other tokens, use demo mode for now
      console.log("PYUSD transactions not yet implemented, using demo mode");
      return await this.broadcastDemoTransaction(txIntent, signedTx);
    } catch (err) {
      console.error("Error broadcasting transaction:", err);

      // Store failed transaction
      await db.createTransaction(txIntent.txId, {
        ...txIntent,
        status: "failed",
        error: err.message,
        failedAt: new Date().toISOString(),
      });

      return {
        success: false,
        error: err.message,
      };
    }
  }

  async broadcastDemoTransaction(txIntent, signedTx) {
    try {
      // Demo mode - simulate a successful transaction
      const mockTxHash =
        "0x" +
        Array(64)
          .fill(0)
          .map(() => Math.floor(Math.random() * 16).toString(16))
          .join("");

      const txReceipt = {
        hash: mockTxHash,
        from: signedTx.from,
        to: signedTx.to,
        blockNumber: Math.floor(Math.random() * 1000000) + 5000000,
        status: 1,
        gasUsed: 65000n,
        effectiveGasPrice: ethers.parseUnits("20", "gwei"),
      };

      // Update daily spending
      await db.addDailySpending(
        txIntent.senderEmail,
        txIntent.amount,
        txIntent.asset || "PYUSD"
      );

      // Store transaction in database
      await db.createTransaction(txIntent.txId, {
        ...txIntent,
        txHash: txReceipt.hash,
        blockNumber: txReceipt.blockNumber,
        status: "completed",
        completedAt: new Date().toISOString(),
        realTransaction: false,
        demoMode: true,
      });

      console.log(
        `Transaction ${txIntent.txId} broadcasted in DEMO MODE: ${txReceipt.hash}`
      );

      return {
        success: true,
        txHash: txReceipt.hash,
        blockNumber: txReceipt.blockNumber,
        explorerUrl: `${config.sepolia.explorerBase}${txReceipt.hash}`,
        realTransaction: false,
        demoMode: true,
      };
    } catch (err) {
      console.error("Error in demo transaction:", err);

      // Store failed transaction
      await db.createTransaction(txIntent.txId, {
        ...txIntent,
        status: "failed",
        error: err.message,
        failedAt: new Date().toISOString(),
      });

      return {
        success: false,
        error: err.message,
      };
    }
  }

  async sendEthWithPKP(txIntent, toAddress, senderUser) {
    // Uses Lit PKP to send ETH from the user's PKP address
    // Requires: HOT_WALLET_PRIVATE_KEY to produce controller authSig/session
    try {
      if (!senderUser || !senderUser.pkpPublicKey) return null;

      const controller = new ethers.Wallet(
        config.hotWallet.privateKey,
        this.provider
      );

      // Simple authSig: sign a deterministic message (for demo/dev)
      const authMessage = `Authorize PKP session for EmailPay at ${new Date().toISOString()}`;
      const signature = await controller.signMessage(authMessage);
      const controllerAuthSig = {
        sig: signature,
        derivedVia: "web3.eth.personal.sign",
        signedMessage: authMessage,
        address: controller.address,
      };

      const pkpWallet = new PKPEthersWallet({
        controllerAuthSig,
        pkpPubKey: senderUser.pkpPublicKey,
        rpc: config.sepolia.rpc,
        litNetwork: config.lit.network,
      });

      await pkpWallet.init();

      const tx = await pkpWallet.sendTransaction({
        to: toAddress,
        value: ethers.parseEther(txIntent.amount.toString()),
        gasLimit: 21000,
      });

      console.log(`✓ PKP transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(
        `✓ PKP transaction confirmed in block ${receipt.blockNumber}`
      );

      // Update daily spending
      await db.addDailySpending(
        txIntent.senderEmail,
        txIntent.amount,
        txIntent.asset || "PYUSD"
      );

      // Store transaction in database
      await db.createTransaction(txIntent.txId, {
        ...txIntent,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        status: "completed",
        completedAt: new Date().toISOString(),
        realTransaction: true,
        fromAddress: await pkpWallet.getAddress(),
        senderType: "pkp",
      });

      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        explorerUrl: `${config.sepolia.explorerBase}${receipt.hash}`,
        realTransaction: true,
      };
    } catch (err) {
      console.error("Error sending with PKP:", err);
      return null;
    }
  }

  async getTransactionStatus(txHash) {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!receipt) {
        return { status: "pending" };
      }

      return {
        status: receipt.status === 1 ? "success" : "failed",
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (err) {
      console.error("Error getting transaction status:", err);
      return { status: "unknown", error: err.message };
    }
  }

  async checkBalance(address) {
    try {
      const pyusdInterface = new ethers.Interface([
        "function balanceOf(address account) view returns (uint256)",
      ]);

      const contract = new ethers.Contract(
        config.sepolia.pyusdAddress,
        pyusdInterface,
        this.provider
      );

      const balance = await contract.balanceOf(address);
      return ethers.formatUnits(balance, 6); // PYUSD has 6 decimals
    } catch (err) {
      console.error("Error checking PYUSD balance:", err);
      return "0";
    }
  }

  async checkEthBalance(address) {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (err) {
      console.error("Error checking ETH balance:", err);
      return "0";
    }
  }

  async checkAllBalances(address) {
    try {
      const [ethBalance, pyusdBalance] = await Promise.all([
        this.checkEthBalance(address),
        this.checkBalance(address),
      ]);

      return {
        eth: ethBalance,
        pyusd: pyusdBalance,
      };
    } catch (err) {
      console.error("Error checking balances:", err);
      return {
        eth: "0",
        pyusd: "0",
      };
    }
  }
}

module.exports = new Broadcaster();
