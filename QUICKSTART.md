# EmailPay Quick Start Guide

Get EmailPay running in under 10 minutes!

---

## Prerequisites

- Node.js 18+ installed
- Gmail account
- 15 minutes of your time

---

## Step 1: Clone and Install (2 minutes)

```bash
# Clone the repository
git clone <repository-url>
cd emailpay

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

---

## Step 2: Gmail API Setup (5 minutes)

### Quick Gmail Setup

1. **Go to Google Cloud Console:** https://console.cloud.google.com/
2. **Create a new project** named "EmailPay"
3. **Enable Gmail API:**
   - Go to "APIs & Services" → "Library"
   - Search "Gmail API" → Enable
4. **Create OAuth Credentials:**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Configure consent screen (External, add your email)
   - Application type: Desktop app
   - Download credentials

### Get Refresh Token

Create `get-token.js` in the root:

```javascript
const { google } = require('googleapis');
const readline = require('readline');

const CLIENT_ID = 'YOUR_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify'
  ],
});

console.log('Visit this URL:', authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the code: ', (code) => {
  rl.close();
  oauth2Client.getToken(code, (err, token) => {
    if (err) return console.error('Error:', err);
    console.log('\nRefresh Token:', token.refresh_token);
  });
});
```

Run it:
```bash
node get-token.js
# Follow the instructions
```

---

## Step 3: Configure Environment (2 minutes)

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Ethereum (use default Sepolia values)
SEPOLIA_RPC=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
CHAIN_ID=11155111
EXPLORER_BASE=https://sepolia.etherscan.io/tx/
PYUSD_ADDRESS=0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9

# Gmail (from Step 2)
GMAIL_CLIENT_ID=your_client_id
GMAIL_CLIENT_SECRET=your_client_secret
GMAIL_REFRESH_TOKEN=your_refresh_token
GMAIL_USER=your_email@gmail.com
GMAIL_POLL_QUERY=in:inbox newer_than:1d

# Lit Protocol (use defaults for demo)
LIT_NETWORK=datil-dev
LIT_ACTION_IPFS_CID=

# Policies (use defaults)
MAX_TX_AMOUNT=100
DAILY_TX_CAP=500
TX_EXPIRY_MINUTES=30

# Server
PORT=3001
FRONTEND_URL=http://localhost:3000
DB_PATH=./data/db.json
```

Create `frontend/.env.local`:

```bash
cd frontend
cp .env.local.example .env.local
```

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Step 4: Run the Application (1 minute)

```bash
# From the root directory
npm run dev
```

You should see:
```
🚀 EmailPay Backend Server running on port 3001
✓ All services initialized successfully

▲ Next.js 14.0.4
- Local: http://localhost:3000
```

---

## Step 5: Test It Out! (5 minutes)

### Create Your First Wallet

1. **Open browser:** http://localhost:3000
2. **Enter your email** (use a real email you can access)
3. **Click "Create Wallet"**
4. **Check your email** for the OTP code
5. **Go to verification page** and enter the OTP
6. **Success!** Your wallet is now active

### Send Your First Payment

1. **Open Gmail** and compose a new email
2. **To:** Your Gmail address (from GMAIL_USER in .env)
3. **Subject:** (anything)
4. **Body:**
   ```
   SEND 10 PYUSD TO recipient@example.com
   ```
5. **Send the email**
6. **Wait 30-60 seconds**
7. **Check your email** for confirmation!

---

## Common Issues

### "Invalid credentials" error
- Double-check CLIENT_ID and CLIENT_SECRET
- Make sure you copied the refresh token correctly

### "Cannot connect to RPC"
- Get a free Infura account: https://infura.io/
- Create a project and copy the Sepolia endpoint

### "Email not received"
- Check spam folder
- Verify GMAIL_USER matches your Gmail address
- Check backend logs for errors

### Frontend won't start
- Make sure backend is running first
- Check that PORT 3000 is available
- Verify NEXT_PUBLIC_API_URL is correct

---

## Next Steps

✅ **You're all set!** Here's what to explore next:

1. **Read the full README:** Understand all features
2. **Check ARCHITECTURE.md:** Learn how it works
3. **Review TESTING.md:** Test different scenarios
4. **Explore the code:** Customize for your needs

---

## Quick Commands Reference

```bash
# Start both services
npm run dev

# Start backend only
npm run dev:backend

# Start frontend only
cd frontend && npm run dev

# Run tests
npm test

# View logs
tail -f backend.log

# Clear database
rm data/db.json
```

---

## Getting Help

- **Documentation:** Check README.md
- **Issues:** Open a GitHub issue
- **Questions:** See CONTRIBUTING.md

---

**Congratulations! You're now running EmailPay!** 🎉

Send PYUSD payments as easily as sending an email.
