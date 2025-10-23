const intentParser = require("./intentParser");
const pkpWalletManager = require("./pkpWalletManager");
const policyBoundSigner = require("./policyBoundSigner");
const broadcaster = require("./broadcaster");
const notifier = require("./notifier");
const db = require("../database/db");
const config = require("../config");

class TransactionProcessor {
  async processEmailCommand(email) {
    const senderEmail = this.extractEmail(email.from);

    console.log(
      `Processing email from ${senderEmail}: ${email.body.substring(0, 100)}`
    );

    try {
      // 1. Parse the command
      const parseResult = intentParser.parseCommand(email.body);

      if (!parseResult.valid) {
        await notifier.sendInvalidCommandEmail(
          senderEmail,
          parseResult.error,
          email.threadId
        );
        return;
      }

      // 2. Check if sender has a verified wallet
      const senderVerified = await pkpWalletManager.isWalletVerified(
        senderEmail
      );
      if (!senderVerified) {
        await notifier.sendInvalidCommandEmail(
          senderEmail,
          "Your wallet is not verified. Please verify your wallet at " +
            config.server.frontendUrl,
          email.threadId
        );
        return;
      }

      // 3. Validate policies
      const dailySpending = await db.getDailySpending(
        senderEmail,
        parseResult.asset
      );
      const policyValidation = intentParser.validatePolicies(
        parseResult.amount,
        dailySpending,
        parseResult.asset
      );

      if (!policyValidation.valid) {
        await notifier.sendInvalidCommandEmail(
          senderEmail,
          policyValidation.errors.join(", "),
          email.threadId
        );
        return;
      }

      // 4. Generate transaction intent
      const txIntent = intentParser.generateTransactionIntent(
        senderEmail,
        parseResult.recipientEmail,
        parseResult.amount,
        parseResult.asset
      );

      // 5. Check if recipient has a verified wallet
      const recipientVerified = await pkpWalletManager.isWalletVerified(
        parseResult.recipientEmail
      );

      if (!recipientVerified) {
        // Recipient needs onboarding
        await this.handleRecipientOnboarding(txIntent, email.threadId);
        return;
      }

      // 6. Process the transaction immediately
      await this.executeTransaction(txIntent, email.threadId);
    } catch (err) {
      console.error("Error processing email command:", err);
      await notifier.sendInvalidCommandEmail(
        senderEmail,
        "An unexpected error occurred. Please try again later.",
        email.threadId
      );
    }
  }

  async handleRecipientOnboarding(txIntent, threadId) {
    try {
      // Store as pending transaction
      await db.createPendingTransaction(txIntent.txId, txIntent);

      // Generate onboarding token
      const token = pkpWalletManager.generateOnboardingToken(
        txIntent.recipientEmail,
        txIntent.txId
      );

      // Create onboarding URL
      const onboardingUrl = `${config.server.frontendUrl}/onboard?token=${token}`;

      // Send onboarding email to recipient
      await notifier.sendOnboardingEmail(
        txIntent.recipientEmail,
        onboardingUrl,
        txIntent.senderEmail,
        txIntent.amount
      );

      // Notify sender
      await notifier.notifySender(
        txIntent.senderEmail,
        txIntent.recipientEmail,
        txIntent.amount
      );

      console.log(
        `Onboarding initiated for ${txIntent.recipientEmail}, txId: ${txIntent.txId}`
      );
    } catch (err) {
      console.error("Error handling recipient onboarding:", err);
      throw err;
    }
  }

  async executeTransaction(txIntent, threadId = null) {
    try {
      console.log(`Executing transaction ${txIntent.txId}...`);

      // 1. Validate and sign
      const signResult = await policyBoundSigner.validateAndSign(txIntent);

      if (!signResult.valid) {
        if (signResult.requiresOnboarding) {
          await this.handleRecipientOnboarding(txIntent, threadId);
          return;
        }

        await notifier.sendTransactionFailureEmail(
          txIntent.senderEmail,
          signResult.error,
          txIntent,
          threadId
        );
        return;
      }

      // 2. Broadcast transaction
      const broadcastResult = await broadcaster.broadcastTransaction(
        txIntent,
        signResult.signedTx
      );

      if (!broadcastResult.success) {
        await notifier.sendTransactionFailureEmail(
          txIntent.senderEmail,
          broadcastResult.error,
          txIntent,
          threadId
        );
        return;
      }

      // 3. Send success notifications
      const txDetails = {
        ...txIntent,
        txHash: broadcastResult.txHash,
        blockNumber: broadcastResult.blockNumber,
        explorerUrl: broadcastResult.explorerUrl,
      };

      // Notify sender
      await notifier.sendTransactionSuccessEmail(
        txIntent.senderEmail,
        txDetails,
        threadId
      );

      // Notify recipient
      await notifier.sendTransactionSuccessEmail(
        txIntent.recipientEmail,
        txDetails
      );

      console.log(`Transaction ${txIntent.txId} completed successfully`);
    } catch (err) {
      console.error("Error executing transaction:", err);
      await notifier.sendTransactionFailureEmail(
        txIntent.senderEmail,
        err.message,
        txIntent,
        threadId
      );
    }
  }

  async processPendingTransactions(recipientEmail) {
    try {
      const pendingTxs = await db.getPendingTransactionsForRecipient(
        recipientEmail
      );

      console.log(
        `Processing ${pendingTxs.length} pending transactions for ${recipientEmail}`
      );

      for (const pendingTx of pendingTxs) {
        // Check if expired
        if (new Date(pendingTx.expiresAt) < new Date()) {
          await db.deletePendingTransaction(pendingTx.id);
          await notifier.sendTransactionFailureEmail(
            pendingTx.senderEmail,
            "Transaction expired before recipient verification",
            pendingTx
          );
          continue;
        }

        // Execute the transaction
        await this.executeTransaction(pendingTx);

        // Mark as completed
        await db.completePendingTransaction(pendingTx.id);
      }
    } catch (err) {
      console.error("Error processing pending transactions:", err);
    }
  }

  extractEmail(emailString) {
    const match =
      emailString.match(/<(.+?)>/) || emailString.match(/([^\s]+@[^\s]+)/);
    return match ? match[1].toLowerCase() : emailString.toLowerCase();
  }
}

module.exports = new TransactionProcessor();
