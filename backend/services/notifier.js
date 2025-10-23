const gmailPoller = require('./gmailPoller');
const config = require('../config');

class Notifier {
  async sendWalletCreationEmail(email, otpCode) {
    const subject = 'EmailPay - Verify Your Wallet';
    const body = `
Welcome to EmailPay!

Your wallet has been created successfully. Please verify your email address to activate your wallet.

Your verification code: ${otpCode}

Visit ${config.server.frontendUrl}/verify?email=${encodeURIComponent(email)} to complete verification.

This code will expire in ${config.policies.txExpiryMinutes} minutes.

---
EmailPay - Email-Native PYUSD Wallet
    `.trim();

    await gmailPoller.sendEmail(email, subject, body);
  }

  async sendOnboardingEmail(email, onboardingUrl, senderEmail, amount) {
    const subject = 'EmailPay - You Have a Pending Payment!';
    const body = `
Hello!

${senderEmail} wants to send you ${amount} PYUSD via EmailPay.

To receive this payment, you need to create your EmailPay wallet:

${onboardingUrl}

This link will expire in ${config.policies.txExpiryMinutes} minutes.

After you verify your wallet, the payment will be automatically processed.

---
EmailPay - Email-Native PYUSD Wallet
    `.trim();

    await gmailPoller.sendEmail(email, subject, body);
  }

  async sendTransactionSuccessEmail(email, txDetails, threadId = null) {
    const subject = 'EmailPay - Transaction Successful';
    const body = `
Transaction Completed Successfully!

Details:
- From: ${txDetails.senderEmail}
- To: ${txDetails.recipientEmail}
- Amount: ${txDetails.amount} ${txDetails.asset}
- Network: Ethereum Sepolia (Chain ID: ${txDetails.chainId})
- Transaction Hash: ${txDetails.txHash}
- Block Number: ${txDetails.blockNumber}

View on Explorer: ${txDetails.explorerUrl}

---
EmailPay - Email-Native PYUSD Wallet
    `.trim();

    if (threadId) {
      await gmailPoller.replyToEmail(threadId, email, subject, body);
    } else {
      await gmailPoller.sendEmail(email, subject, body);
    }
  }

  async sendTransactionFailureEmail(email, error, txIntent, threadId = null) {
    const subject = 'EmailPay - Transaction Failed';
    const body = `
Transaction Failed

Your transaction could not be completed.

Error: ${error}

Transaction Details:
- From: ${txIntent.senderEmail}
- To: ${txIntent.recipientEmail}
- Amount: ${txIntent.amount} ${txIntent.asset}
- Transaction ID: ${txIntent.txId}

Please try again or contact support if the issue persists.

---
EmailPay - Email-Native PYUSD Wallet
    `.trim();

    if (threadId) {
      await gmailPoller.replyToEmail(threadId, email, subject, body);
    } else {
      await gmailPoller.sendEmail(email, subject, body);
    }
  }

  async sendInvalidCommandEmail(email, error, threadId = null) {
    const subject = 'EmailPay - Invalid Command';
    const body = `
Invalid Command

Your email command could not be processed.

Error: ${error}

Valid command format:
SEND <amount> PYUSD TO <recipient_email>

Examples:
- SEND 10 PYUSD TO alice@example.com
- SEND 25.5 PYUSD TO bob@gmail.com

Please try again with the correct format.

---
EmailPay - Email-Native PYUSD Wallet
    `.trim();

    if (threadId) {
      await gmailPoller.replyToEmail(threadId, email, subject, body);
    } else {
      await gmailPoller.sendEmail(email, subject, body);
    }
  }

  async sendPendingTransactionResumedEmail(email, txDetails) {
    const subject = 'EmailPay - Pending Payment Processed';
    const body = `
Your Pending Payment Has Been Processed!

Now that you've verified your wallet, your pending payment has been automatically completed.

Transaction Details:
- From: ${txDetails.senderEmail}
- To: ${txDetails.recipientEmail}
- Amount: ${txDetails.amount} ${txDetails.asset}
- Transaction Hash: ${txDetails.txHash}

View on Explorer: ${txDetails.explorerUrl}

---
EmailPay - Email-Native PYUSD Wallet
    `.trim();

    await gmailPoller.sendEmail(email, subject, body);
  }

  async notifySender(senderEmail, recipientEmail, amount) {
    const subject = 'EmailPay - Payment Pending Recipient Verification';
    const body = `
Payment Initiated

Your payment of ${amount} PYUSD to ${recipientEmail} has been initiated.

The recipient needs to create and verify their EmailPay wallet before the payment can be completed.

We've sent them an onboarding link. The payment will be automatically processed once they verify their wallet.

This pending transaction will expire in ${config.policies.txExpiryMinutes} minutes.

---
EmailPay - Email-Native PYUSD Wallet
    `.trim();

    await gmailPoller.sendEmail(senderEmail, subject, body);
  }
}

module.exports = new Notifier();
