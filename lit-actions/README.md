# Lit Action for EmailPay

This directory contains the Lit Action code that enforces transaction policies for EmailPay PKP wallets.

## What is a Lit Action?

A Lit Action is JavaScript code that runs inside Lit Protocol's decentralized network. It controls when and how your PKP (Programmable Key Pair) wallet can sign transactions.

## EmailPay Signing Policy

The `emailpay-signing-policy.js` Lit Action enforces:

- ✅ **Maximum transaction amount** - Prevents sending more than the configured limit
- ✅ **Daily spending cap** - Limits total daily spending per wallet
- ✅ **Transaction expiry** - Rejects old/stale transactions
- ✅ **Chain validation** - Only allows Sepolia testnet transactions
- ✅ **Email validation** - Ensures sender and recipient emails are valid

## Upload to IPFS

To use this Lit Action, you need to upload it to IPFS and get a CID (Content Identifier).

### Method 1: Automated Upload (Pinata)

1. **Create a free Pinata account:**
   - Go to: https://pinata.cloud/
   - Sign up for free

2. **Get API credentials:**
   - Go to: https://app.pinata.cloud/keys
   - Click "New Key"
   - Enable "pinFileToIPFS" permission
   - Copy the API Key and Secret

3. **Add to your .env file:**
   ```env
   PINATA_API_KEY=your_api_key_here
   PINATA_SECRET_KEY=your_secret_key_here
   ```

4. **Run the upload script:**
   ```bash
   node scripts/upload-lit-action.js
   ```

5. **Copy the CID to your .env:**
   ```env
   LIT_ACTION_IPFS_CID=QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

### Method 2: Manual Upload (Pinata Web UI)

1. Go to: https://app.pinata.cloud/pinmanager
2. Click "Upload" → "File"
3. Select: `lit-actions/emailpay-signing-policy.js`
4. After upload, copy the CID (starts with "Qm..." or "bafy...")
5. Add to `.env`: `LIT_ACTION_IPFS_CID=<your_cid>`

### Method 3: Use web3.storage (Alternative)

1. Go to: https://web3.storage/
2. Sign up for free
3. Upload the file via their web interface
4. Copy the CID
5. Add to `.env`

## Verify Upload

After uploading, you can verify the Lit Action is accessible:

```bash
# Using IPFS gateway
curl https://ipfs.io/ipfs/<YOUR_CID>

# Using Pinata gateway
curl https://gateway.pinata.cloud/ipfs/<YOUR_CID>
```

## Testing the Lit Action

The Lit Action will be automatically used by the EmailPay backend when:
- Creating PKP wallets
- Signing transactions
- Enforcing policies

You can test it by:
1. Creating a wallet via the UI
2. Sending a payment command via email
3. Checking the logs for policy enforcement

## Modifying the Policy

To change the signing policy:

1. Edit `emailpay-signing-policy.js`
2. Upload the new version to IPFS
3. Update `LIT_ACTION_IPFS_CID` in `.env` with the new CID
4. Restart the backend server

## Security Notes

- The Lit Action code is **immutable** once uploaded to IPFS
- The CID is a cryptographic hash of the code
- Any changes to the code will result in a new CID
- PKP wallets are bound to specific Lit Actions for security

## Learn More

- Lit Protocol Docs: https://developer.litprotocol.com/
- Lit Actions Guide: https://developer.litprotocol.com/sdk/serverless-signing/quick-start
- IPFS Docs: https://docs.ipfs.tech/
