# EmailPay - Email-Native PYUSD Wallet

**Send PYUSD payments as easily as sending an email.**

EmailPay transforms every email address into a PKP (Programmable Key Pair) wallet after verification. Users can send PYUSD stablecoin payments on Ethereum Sepolia entirely via email commands—no blockchain knowledge required.

---

## 🌟 Key Features

### Email-as-Wallet
- Every verified email address represents a unique PKP wallet
- No private keys stored server-side
- Wallet creation and verification via OTP

### Email-to-Payment Commands
Send payments by emailing simple commands to `send@yourdomain.com`:

```
SEND 10 PYUSD TO alice@example.com
SEND 25.5 PYUSD TO bob@gmail.com
```

### Automatic Recipient Onboarding
- If recipient doesn't have a wallet, system sends onboarding link
- Pending payment automatically resumes after recipient verification
- Time-limited onboarding links (configurable expiry)

### Policy-Bound Security
- Maximum per-transaction limits
- Daily spending caps
- Transaction expiry times
- Idempotency to prevent double-spending

### Asset & Network
- **Asset:** PYUSD stablecoin only
- **Network:** Ethereum Sepolia (Chain ID: 11155111)
- **Token Address:** `0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9`

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         USER FLOW                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  1. User creates wallet via Web UI → Receives OTP via email │
│  2. User verifies wallet with OTP code                      │
│  3. User sends email: "SEND 10 PYUSD TO recipient@email"    │
│  4. System processes → Broadcasts transaction                │
│  5. User receives confirmation email with tx hash            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    BACKEND ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────────┐      ┌─────────────┐
│ Gmail Poller │─────▶│ Intent Parser    │─────▶│ Policy      │
│              │      │                  │      │ Validator   │
│ • Polls inbox│      │ • Regex parsing  │      │             │
│ • Deduplicates│      │ • Extract amount │      │ • Max tx    │
│ • Parses email│      │ • Extract recipient│    │ • Daily cap │
└──────────────┘      └──────────────────┘      └─────────────┘
                                                        │
                                                        ▼
┌──────────────┐      ┌──────────────────┐      ┌─────────────┐
│ Notifier     │◀─────│ Broadcaster      │◀─────│ PKP Wallet  │
│              │      │                  │      │ Manager     │
│ • Success    │      │ • ERC-20 transfer│      │             │
│ • Failure    │      │ • Gas estimation │      │ • Create    │
│ • Onboarding │      │ • Tx broadcast   │      │ • Verify    │
│ • Confirmations│    │                  │      │ • Sign      │
└──────────────┘      └──────────────────┘      └─────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Ethereum Sepolia │
                    │ PYUSD Contract   │
                    └──────────────────┘
```

---

## 📁 Project Structure

```
emailpay/
├── backend/
│   ├── config/
│   │   └── index.js              # Configuration management
│   ├── database/
│   │   └── db.js                 # JSON-based database
│   ├── services/
│   │   ├── gmailPoller.js        # Gmail API integration
│   │   ├── intentParser.js       # Command parsing & validation
│   │   ├── pkpWalletManager.js   # PKP wallet operations
│   │   ├── policyBoundSigner.js  # Policy enforcement & signing
│   │   ├── broadcaster.js        # Transaction broadcasting
│   │   ├── notifier.js           # Email notifications
│   │   └── transactionProcessor.js # Main transaction flow
│   └── index.js                  # Express server & initialization
├── frontend/
│   ├── app/
│   │   ├── page.tsx              # Home page (wallet creation)
│   │   ├── verify/page.tsx       # OTP verification
│   │   ├── onboard/page.tsx      # Recipient onboarding
│   │   ├── wallet/page.tsx       # Wallet info display
│   │   ├── layout.tsx            # Root layout
│   │   └── globals.css           # Global styles
│   ├── package.json
│   └── next.config.js
├── package.json
├── .env.example
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Gmail account with API access
- Infura or Alchemy account for Sepolia RPC
- (Optional) Lit Protocol API keys for production PKP

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd emailpay
```

2. **Install backend dependencies:**
```bash
npm install
```

3. **Install frontend dependencies:**
```bash
cd frontend
npm install
cd ..
```

4. **Configure environment variables:**

Create `.env` in the root directory:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# Ethereum Network
SEPOLIA_RPC=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
CHAIN_ID=11155111
EXPLORER_BASE=https://sepolia.etherscan.io/tx/
PYUSD_ADDRESS=0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9

# Gmail Configuration
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret
GMAIL_REFRESH_TOKEN=your_gmail_refresh_token
GMAIL_USER=send@yourdomain.com
GMAIL_POLL_QUERY=in:inbox newer_than:1d

# Lit Protocol
LIT_NETWORK=datil-dev
LIT_ACTION_IPFS_CID=your_lit_action_cid

# Transaction Policies
MAX_TX_AMOUNT=100
DAILY_TX_CAP=500
TX_EXPIRY_MINUTES=30

# Server
PORT=3001
FRONTEND_URL=http://localhost:3000
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

### Gmail API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Download credentials and extract:
   - `GMAIL_CLIENT_ID`
   - `GMAIL_CLIENT_SECRET`
6. Generate refresh token using OAuth playground or script
7. Add credentials to `.env`

### Running the Application

**Development mode (both backend and frontend):**
```bash
npm run dev
```

**Or run separately:**

Backend:
```bash
npm run dev:backend
```

Frontend (in another terminal):
```bash
npm run dev:frontend
```

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

---

## 📧 Usage Guide

### 1. Create Your Wallet

1. Visit http://localhost:3000
2. Enter your email address
3. Click "Create Wallet"
4. Check your email for the 6-digit OTP code

### 2. Verify Your Wallet

1. Go to the verification page (or click link in email)
2. Enter your email and OTP code
3. Click "Verify Wallet"
4. Your wallet is now active!

### 3. Send Payments via Email

Send an email to `send@yourdomain.com` with the command:

```
SEND 10 PYUSD TO recipient@example.com
```

**Command Format:**
- `SEND` - Command keyword
- `<amount>` - Numeric amount (e.g., 10, 25.5)
- `PYUSD` - Asset (only PYUSD supported)
- `TO` - Keyword
- `<recipient_email>` - Valid email address

**Examples:**
```
SEND 10 PYUSD TO alice@gmail.com
SEND 25.5 PYUSD TO bob@example.com
SEND 100 PYUSD TO charlie@company.com
```

### 4. Receive Confirmation

You'll receive an email with:
- Transaction hash
- Block number
- Etherscan explorer link
- Sender and recipient details
- Amount and asset

### 5. Recipient Onboarding

If the recipient doesn't have a wallet:
1. They receive an onboarding email with a link
2. Click the link to create their wallet
3. Verify with OTP
4. Pending payment automatically processes

---

## 🔒 Security Features

### Policy Enforcement
- **Max Transaction Amount:** Configurable limit per transaction
- **Daily Spending Cap:** Total daily limit per wallet
- **Transaction Expiry:** Time-limited transaction intents
- **Idempotency:** Email deduplication prevents double-spending

### PKP Wallet Security
- No private keys stored on server
- Policy-bound signing via Lit Protocol
- Wallet creation requires email verification
- OTP-based authentication

### Email Security
- Gmail OAuth 2.0 authentication
- Refresh token rotation
- Rate limiting on API calls
- Email deduplication

---

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Manual Testing Flow

1. **Create Wallet:**
   - Visit homepage
   - Create wallet with test email
   - Verify OTP

2. **Send Payment:**
   - Email command to system
   - Check confirmation email
   - Verify transaction on Sepolia Etherscan

3. **Recipient Onboarding:**
   - Send to non-existent email
   - Check onboarding email
   - Complete verification
   - Verify payment processed

### Test Accounts
Use temporary email services for testing:
- [Temp Mail](https://temp-mail.org/)
- [Guerrilla Mail](https://www.guerrillamail.com/)

---

## 🛠️ API Reference

### Backend Endpoints

#### Create Wallet
```http
POST /api/wallet/create
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Verify Wallet
```http
POST /api/wallet/verify
Content-Type: application/json

{
  "email": "user@example.com",
  "otpCode": "123456"
}
```

#### Get Wallet Info
```http
GET /api/wallet/:email
```

#### Onboard Recipient
```http
POST /api/onboard
Content-Type: application/json

{
  "token": "onboarding_token"
}
```

#### Get Transaction Status
```http
GET /api/transaction/:txId
```

---

## 📊 Database Schema

The system uses a simple JSON file database (`data/db.json`):

```json
{
  "users": {
    "user@example.com": {
      "email": "user@example.com",
      "pkpPublicKey": "0x...",
      "pkpEthAddress": "0x...",
      "otpCode": "123456",
      "verified": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "verifiedAt": "2024-01-01T00:05:00.000Z"
    }
  },
  "transactions": {
    "tx-uuid": {
      "txId": "tx-uuid",
      "senderEmail": "sender@example.com",
      "recipientEmail": "recipient@example.com",
      "amount": 10,
      "asset": "PYUSD",
      "txHash": "0x...",
      "status": "completed"
    }
  },
  "pendingTransactions": {},
  "processedEmails": ["email-id-1", "email-id-2"],
  "dailySpending": {
    "user@example.com:2024-01-01": 50.5
  }
}
```

---

## 🚧 Roadmap

### Phase 1 (Current)
- ✅ Email-based wallet creation
- ✅ OTP verification
- ✅ PYUSD transfers via email
- ✅ Recipient onboarding
- ✅ Policy enforcement

### Phase 2 (Future)
- [ ] Support for 0x address recipients
- [ ] Multiple asset support (USDC, USDT)
- [ ] Transaction history in UI
- [ ] Webhook notifications
- [ ] Production Lit Protocol integration

### Phase 3 (Future)
- [ ] Multi-chain support
- [ ] Batch transactions
- [ ] Scheduled payments
- [ ] Payment requests
- [ ] Mobile app

---

## 🐛 Troubleshooting

### Gmail Polling Not Working
- Verify Gmail API credentials
- Check refresh token validity
- Ensure Gmail API is enabled in Google Cloud Console
- Check `GMAIL_POLL_QUERY` filter

### Transactions Not Broadcasting
- Verify Sepolia RPC endpoint
- Check PYUSD contract address
- Ensure wallet has ETH for gas (in production)
- Check transaction policies

### OTP Not Received
- Check spam folder
- Verify Gmail sending permissions
- Check email service logs
- Ensure correct email format

### Frontend Not Connecting to Backend
- Verify `NEXT_PUBLIC_API_URL` in frontend `.env.local`
- Check backend is running on correct port
- Verify CORS settings

---

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `SEPOLIA_RPC` | Ethereum Sepolia RPC URL | `https://sepolia.infura.io/v3/...` |
| `CHAIN_ID` | Ethereum chain ID | `11155111` |
| `PYUSD_ADDRESS` | PYUSD token contract address | `0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9` |
| `GMAIL_CLIENT_ID` | Gmail OAuth client ID | From Google Cloud Console |
| `GMAIL_CLIENT_SECRET` | Gmail OAuth client secret | From Google Cloud Console |
| `GMAIL_REFRESH_TOKEN` | Gmail OAuth refresh token | Generated via OAuth flow |
| `GMAIL_USER` | Gmail account email | `send@yourdomain.com` |
| `MAX_TX_AMOUNT` | Max PYUSD per transaction | `100` |
| `DAILY_TX_CAP` | Max PYUSD per day per wallet | `500` |
| `TX_EXPIRY_MINUTES` | Transaction intent expiry | `30` |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- **Lit Protocol** for PKP wallet infrastructure
- **PayPal** for PYUSD stablecoin
- **Ethereum** for blockchain infrastructure
- **Gmail API** for email integration

---

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Email: support@emailpay.example

---

## ⚠️ Disclaimer

This is a demonstration project running on Ethereum Sepolia testnet. Do not use with real funds or in production without proper security audits and testing.

**PYUSD on Sepolia is for testing purposes only.**

---

**Built with ❤️ for the future of email-native payments**
