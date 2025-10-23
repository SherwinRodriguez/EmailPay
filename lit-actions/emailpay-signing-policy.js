/**
 * EmailPay Lit Action - PKP Signing Policy
 * 
 * This Lit Action enforces transaction policies for EmailPay:
 * - Maximum transaction amount
 * - Daily spending cap
 * - Transaction expiry
 * - Sender/recipient validation
 * 
 * This code runs inside Lit Protocol's decentralized network
 * and controls when the PKP wallet can sign transactions.
 */

const go = async () => {
  // Parse the transaction parameters from jsParams
  const {
    txParams,           // Transaction parameters (to, value, data)
    senderEmail,        // Email of sender
    recipientEmail,     // Email of recipient
    amount,             // Amount in PYUSD (human readable)
    timestamp,          // Transaction timestamp
    maxTxAmount,        // Policy: max transaction amount
    dailyTxCap,         // Policy: daily spending cap
    txExpiryMinutes,    // Policy: transaction expiry time
    dailySpent,         // Current daily spending
    chainId             // Chain ID (should be 11155111 for Sepolia)
  } = JSON.parse(jsParams);

  // Validation 1: Check chain ID
  if (chainId !== 11155111) {
    return Lit.Actions.setResponse({
      response: JSON.stringify({
        success: false,
        error: "Invalid chain ID. Only Sepolia (11155111) is supported."
      })
    });
  }

  // Validation 2: Check sender and recipient emails exist
  if (!senderEmail || !recipientEmail) {
    return Lit.Actions.setResponse({
      response: JSON.stringify({
        success: false,
        error: "Sender and recipient emails are required."
      })
    });
  }

  // Validation 3: Check amount is positive
  if (amount <= 0) {
    return Lit.Actions.setResponse({
      response: JSON.stringify({
        success: false,
        error: "Transaction amount must be greater than zero."
      })
    });
  }

  // Validation 4: Check max transaction amount
  if (amount > maxTxAmount) {
    return Lit.Actions.setResponse({
      response: JSON.stringify({
        success: false,
        error: `Transaction amount ${amount} exceeds maximum allowed ${maxTxAmount} PYUSD.`
      })
    });
  }

  // Validation 5: Check daily spending cap
  const newDailyTotal = dailySpent + amount;
  if (newDailyTotal > dailyTxCap) {
    return Lit.Actions.setResponse({
      response: JSON.stringify({
        success: false,
        error: `Daily spending cap exceeded. Current: ${dailySpent}, Attempted: ${amount}, Cap: ${dailyTxCap} PYUSD.`
      })
    });
  }

  // Validation 6: Check transaction expiry
  const now = Date.now();
  const txAge = (now - timestamp) / 1000 / 60; // Age in minutes
  if (txAge > txExpiryMinutes) {
    return Lit.Actions.setResponse({
      response: JSON.stringify({
        success: false,
        error: `Transaction expired. Age: ${txAge.toFixed(1)} minutes, Expiry: ${txExpiryMinutes} minutes.`
      })
    });
  }

  // Validation 7: Validate transaction parameters structure
  if (!txParams || !txParams.to || !txParams.data) {
    return Lit.Actions.setResponse({
      response: JSON.stringify({
        success: false,
        error: "Invalid transaction parameters."
      })
    });
  }

  // All validations passed - sign the transaction
  try {
    // Sign the transaction using the PKP
    const sigShare = await Lit.Actions.signEcdsa({
      toSign: txParams.hash, // Transaction hash to sign
      publicKey,             // PKP public key (provided by Lit)
      sigName: "emailpay-tx-sig"
    });

    return Lit.Actions.setResponse({
      response: JSON.stringify({
        success: true,
        signature: sigShare,
        metadata: {
          senderEmail,
          recipientEmail,
          amount,
          timestamp,
          dailySpentAfter: newDailyTotal
        }
      })
    });
  } catch (error) {
    return Lit.Actions.setResponse({
      response: JSON.stringify({
        success: false,
        error: `Signing failed: ${error.message}`
      })
    });
  }
};

// Execute the Lit Action
go();
