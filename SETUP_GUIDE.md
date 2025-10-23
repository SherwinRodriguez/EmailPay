# EmailPay Setup Guide

Complete step-by-step guide to set up and run EmailPay locally.

---

## Prerequisites

### Required Software
- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **Git**
- **Gmail account** with API access
- **Infura or Alchemy account** for Ethereum RPC

### Required Accounts
1. Google Cloud Platform account (for Gmail API)
2. Infura account (for Sepolia RPC)
3. (Optional) Lit Protocol account for production PKP

---

## Step 1: Clone and Install

### Clone Repository
```bash
git clone <repository-url>
cd emailpay
```

### Install Dependencies

**Backend:**
```bash
npm install
```

**Frontend:**
```bash
cd frontend
npm install
cd ..
```

---

## Step 2: Gmail API Setup

### 2.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: "EmailPay"
4. Click "Create"

### 2.2 Enable Gmail API

1. In the project dashboard, go to "APIs & Services" → "Library"
2. Search for "Gmail API"
3. Click "Gmail API" → "Enable"

### 2.3 Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure OAuth consent screen:
   - User Type: External
   - App name: EmailPay
   - User support email: your email
   - Developer contact: your email
   - Scopes: Add `gmail.readonly`, `gmail.send`, `gmail.modify`
   - Test users: Add your email
   - Save and continue

4. Create OAuth Client ID:
   - Application type: Desktop app
   - Name: EmailPay Desktop Client
   - Click "Create"

5. Download the credentials JSON file
6. Note the **Client ID** and **Client Secret**

### 2.4 Generate Refresh Token

Create a file `get-gmail-token.js` in the root directory:

```javascript
const { google } = require('googleapis');
const readline = require('readline');

const CLIENT_ID = 'your_client_id_here';
const CLIENT_SECRET = 'your_client_secret_here';
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify'
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
});

console.log('Authorize this app by visiting this url:', authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the code from that page here: ', (code) => {
  rl.close();
  oauth2Client.getToken(code, (err, token) => {
    if (err) return console.error('Error retrieving access token', err);
    console.log('Refresh Token:', token.refresh_token);
  });
});
```

Run the script:
```bash
node get-gmail-token.js
```

1. Open the URL in your browser
2. Sign in with your Gmail account
3. Grant permissions
4. Copy the authorization code
5. Paste it in the terminal
6. Copy the **Refresh Token** from the output

---

## Step 3: Infura Setup

### 3.1 Create Infura Account

1. Go to [Infura](https://infura.io/)
2. Sign up for a free account
3. Verify your email

### 3.2 Create Project

1. Click "Create New Key"
2. Select "Web3 API"
3. Name: "EmailPay"
4. Click "Create"

### 3.3 Get Sepolia Endpoint

1. In your project dashboard, find "Endpoints"
2. Select "Sepolia" from the dropdown
3. Copy the HTTPS endpoint URL
   - Format: `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`

---

## Step 4: Environment Configuration

### 4.1 Backend Configuration

Create `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Ethereum Network Configuration
SEPOLIA_RPC=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
CHAIN_ID=11155111
EXPLORER_BASE=https://sepolia.etherscan.io/tx/
PYUSD_ADDRESS=0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9

# Gmail Configuration
GMAIL_CLIENT_ID=your_gmail_client_id_from_step_2
GMAIL_CLIENT_SECRET=your_gmail_client_secret_from_step_2
GMAIL_REFRESH_TOKEN=your_refresh_token_from_step_2
GMAIL_USER=your_gmail_address@gmail.com
GMAIL_POLL_QUERY=in:inbox newer_than:1d

# Lit Protocol Configuration
LIT_NETWORK=datil-dev
LIT_ACTION_IPFS_CID=

# Transaction Policies
MAX_TX_AMOUNT=100
DAILY_TX_CAP=500
TX_EXPIRY_MINUTES=30

# Backend Server
PORT=3001
FRONTEND_URL=http://localhost:3000

# Database
DB_PATH=./data/db.json
```

### 4.2 Frontend Configuration

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

## Step 5: Run the Application

### Option 1: Run Both (Recommended)

From the root directory:
```bash
npm run dev
```

This starts both backend and frontend concurrently.

### Option 2: Run Separately

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Verify Services

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/health

You should see:
```
Backend:
🚀 EmailPay Backend Server running on port 3001
✓ Database initialized
✓ PKP Wallet Manager initialized
✓ Policy Bound Signer initialized
✓ Broadcaster initialized
✓ Gmail Poller initialized
✓ Gmail polling started
✓ All services initialized successfully

Frontend:
▲ Next.js 14.0.4
- Local:        http://localhost:3000
```

---

## Step 6: Test the System

### 6.1 Create Your First Wallet

1. Open http://localhost:3000
2. Enter your email address
3. Click "Create Wallet"
4. Check your email for the OTP code
5. Go to verification page
6. Enter email and OTP code
7. Click "Verify Wallet"

### 6.2 Send a Test Payment

**Important:** For testing, send to another email you control.

1. Open your Gmail
2. Compose new email to the Gmail address in `GMAIL_USER`
3. Subject: (anything)
4. Body:
   ```
   SEND 10 PYUSD TO recipient@example.com
   ```
5. Send the email

### 6.3 Monitor Backend Logs

Watch the backend terminal for:
```
Processing email from your@email.com: SEND 10 PYUSD TO recipient@example.com
Executing transaction tx-uuid...
Transaction tx-uuid broadcasted successfully: 0x...
Email sent to your@email.com: Transaction Successful
```

### 6.4 Check Confirmation Email

You should receive an email with:
- Transaction hash
- Block number
- Etherscan link
- Transaction details

---

## Step 7: Test Recipient Onboarding

### 7.1 Send to New Recipient

Send email command to a new email address (that doesn't have a wallet):
```
SEND 5 PYUSD TO newuser@example.com
```

### 7.2 Check Onboarding Email

The new recipient should receive:
- Onboarding link
- Pending payment amount
- Sender information

### 7.3 Complete Onboarding

1. Click onboarding link
2. System creates wallet
3. Check email for OTP
4. Verify wallet
5. Pending payment automatically processes

---

## Troubleshooting

### Gmail API Issues

**Error: "Invalid credentials"**
- Verify CLIENT_ID and CLIENT_SECRET
- Regenerate refresh token
- Check OAuth consent screen configuration

**Error: "Insufficient permissions"**
- Ensure all Gmail scopes are added
- Re-authorize with new scopes

**Error: "Quota exceeded"**
- Gmail API has daily limits
- Reduce polling frequency
- Wait for quota reset (midnight Pacific Time)

### Backend Issues

**Error: "Cannot connect to database"**
- Check DB_PATH directory exists
- Verify write permissions
- Check disk space

**Error: "RPC connection failed"**
- Verify SEPOLIA_RPC URL
- Check Infura project status
- Try alternative RPC provider

**Error: "Module not found"**
- Run `npm install` again
- Delete `node_modules` and reinstall
- Check Node.js version

### Frontend Issues

**Error: "Failed to fetch"**
- Verify backend is running
- Check NEXT_PUBLIC_API_URL
- Check CORS settings
- Verify PORT matches

**Error: "Module not found"**
- Run `npm install` in frontend directory
- Delete `.next` folder
- Restart dev server

### Email Not Received

1. Check spam/junk folder
2. Verify Gmail sending permissions
3. Check backend logs for errors
4. Test Gmail API with simple send
5. Verify email address format

### Transaction Not Broadcasting

1. Check Sepolia RPC connection
2. Verify PYUSD contract address
3. Check transaction policies
4. Review backend logs
5. Verify wallet verification status

---

## Production Deployment Checklist

### Security
- [ ] Use environment-specific .env files
- [ ] Never commit .env to git
- [ ] Use secrets management (AWS Secrets Manager, etc.)
- [ ] Enable HTTPS/TLS
- [ ] Set up rate limiting
- [ ] Implement proper authentication
- [ ] Add request validation
- [ ] Enable CORS whitelist

### Database
- [ ] Replace JSON file with PostgreSQL/MongoDB
- [ ] Set up database backups
- [ ] Implement connection pooling
- [ ] Add database indexes
- [ ] Set up replication

### Monitoring
- [ ] Set up application logging
- [ ] Add error tracking (Sentry)
- [ ] Monitor API metrics
- [ ] Set up uptime monitoring
- [ ] Configure alerts

### Infrastructure
- [ ] Use process manager (PM2)
- [ ] Set up load balancer
- [ ] Configure auto-scaling
- [ ] Set up CDN for frontend
- [ ] Implement caching (Redis)

### Lit Protocol
- [ ] Integrate production PKP minting
- [ ] Configure PKP permissions
- [ ] Set up Lit Action
- [ ] Test PKP signing
- [ ] Fund wallets with gas

### Testing
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Test email flows
- [ ] Test error scenarios
- [ ] Load testing
- [ ] Security audit

---

## Useful Commands

### Development
```bash
# Start both services
npm run dev

# Start backend only
npm run dev:backend

# Start frontend only
npm run dev:frontend

# Run tests
npm test

# Build frontend
npm run build:frontend
```

### Database
```bash
# View database
cat data/db.json | jq

# Clear database
rm data/db.json

# Backup database
cp data/db.json data/db.backup.json
```

### Logs
```bash
# Follow backend logs
tail -f backend.log

# Search logs
grep "ERROR" backend.log

# Clear logs
> backend.log
```

---

## Additional Resources

### Documentation
- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Lit Protocol Docs](https://developer.litprotocol.com/)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Next.js Documentation](https://nextjs.org/docs)

### Tools
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Etherscan Sepolia](https://sepolia.etherscan.io/)
- [Gmail API Explorer](https://developers.google.com/gmail/api/v1/reference)

### Support
- GitHub Issues
- Email: support@emailpay.example
- Documentation: README.md, ARCHITECTURE.md

---

## Next Steps

1. ✅ Complete setup
2. ✅ Test wallet creation
3. ✅ Test payment flow
4. ✅ Test onboarding flow
5. 📖 Read ARCHITECTURE.md
6. 🔧 Customize for your use case
7. 🚀 Deploy to production

---

**Congratulations! EmailPay is now running locally.** 🎉

For questions or issues, refer to the troubleshooting section or open an issue on GitHub.
