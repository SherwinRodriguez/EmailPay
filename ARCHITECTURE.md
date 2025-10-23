# EmailPay Architecture Documentation

## System Overview

EmailPay is an email-native payment system that enables PYUSD transfers via simple email commands. The architecture consists of three main layers:

1. **Frontend Layer** - Next.js web application for wallet management
2. **Backend Layer** - Node.js services for email processing and blockchain interaction
3. **Infrastructure Layer** - Gmail API, Ethereum Sepolia, and Lit Protocol

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                           │
│                      (Next.js + React)                           │
├─────────────────────────────────────────────────────────────────┤
│  • Wallet Creation UI      • OTP Verification                   │
│  • Onboarding Flow         • Wallet Info Display                │
│  • Responsive Design       • Error Handling                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND LAYER                            │
│                    (Node.js + Express)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Gmail Poller │  │ Intent Parser│  │ PKP Wallet   │         │
│  │              │  │              │  │ Manager      │         │
│  │ • Poll inbox │  │ • Parse cmd  │  │ • Create     │         │
│  │ • Dedupe     │  │ • Validate   │  │ • Verify     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Policy       │  │ Broadcaster  │  │ Notifier     │         │
│  │ Bound Signer │  │              │  │              │         │
│  │ • Enforce    │  │ • Broadcast  │  │ • Success    │         │
│  │ • Sign       │  │ • Track      │  │ • Failure    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────────────────────────────────────────┐          │
│  │         Transaction Processor (Orchestrator)      │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Gmail API    │  │ Ethereum     │  │ Lit Protocol │         │
│  │              │  │ Sepolia      │  │              │         │
│  │ • OAuth 2.0  │  │ • PYUSD      │  │ • PKP        │         │
│  │ • Send/Read  │  │ • ERC-20     │  │ • Signing    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────────────────────────────────────────┐          │
│  │         Database (JSON File Storage)              │          │
│  │  • Users  • Transactions  • Pending  • Emails    │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. Gmail Poller

**Responsibility:** Monitor Gmail inbox for payment commands

**Key Functions:**
- Poll Gmail API at regular intervals (30s default)
- Parse email headers and body
- Deduplicate processed emails
- Extract sender information
- Send email notifications

**Technologies:**
- Google APIs Node.js Client
- OAuth 2.0 authentication
- Gmail API v1

**Flow:**
```
1. Poll inbox with query filter
2. Fetch unprocessed messages
3. Parse email content
4. Mark as processed in database
5. Pass to Transaction Processor
```

---

### 2. Intent Parser

**Responsibility:** Parse and validate email commands

**Key Functions:**
- Regex-based command parsing
- Amount validation
- Email format validation
- Policy checks (max amount, daily cap)

**Command Format:**
```
SEND <amount> PYUSD TO <recipient_email>
```

**Validation Rules:**
- Amount must be positive number
- Recipient must be valid email
- Amount ≤ MAX_TX_AMOUNT
- Daily spending + amount ≤ DAILY_TX_CAP

**Output:**
```javascript
{
  valid: true,
  amount: 10,
  asset: 'PYUSD',
  recipientEmail: 'recipient@example.com',
  command: 'SEND 10 PYUSD TO recipient@example.com'
}
```

---

### 3. PKP Wallet Manager

**Responsibility:** Manage PKP wallet lifecycle

**Key Functions:**
- Create PKP wallets
- Generate OTP codes
- Verify wallets
- Store wallet metadata
- Generate onboarding tokens

**Wallet Creation Flow:**
```
1. Generate random wallet (demo) or mint PKP (production)
2. Generate 6-digit OTP
3. Store in database (unverified)
4. Send OTP via email
5. User verifies → wallet activated
```

**Data Structure:**
```javascript
{
  email: 'user@example.com',
  pkpPublicKey: '0x...',
  pkpEthAddress: '0x...',
  otpCode: '123456',
  verified: false,
  createdAt: '2024-01-01T00:00:00.000Z'
}
```

---

### 4. Policy Bound Signer

**Responsibility:** Enforce policies and sign transactions

**Key Functions:**
- Validate sender wallet exists and verified
- Check transaction hasn't expired
- Enforce max transaction amount
- Check daily spending cap
- Validate recipient wallet
- Create unsigned transaction
- Sign with PKP (production) or mock (demo)

**Policy Checks:**
```javascript
1. Sender wallet exists? ✓
2. Sender wallet verified? ✓
3. Transaction not expired? ✓
4. Amount ≤ MAX_TX_AMOUNT? ✓
5. Daily spending + amount ≤ DAILY_TX_CAP? ✓
6. Recipient wallet exists and verified? ✓
```

**Transaction Structure:**
```javascript
{
  to: PYUSD_CONTRACT_ADDRESS,
  data: encodedTransferFunction,
  gasLimit: 100000,
  chainId: 11155111
}
```

---

### 5. Broadcaster

**Responsibility:** Broadcast transactions to Ethereum

**Key Functions:**
- Broadcast signed transactions
- Track transaction status
- Update daily spending
- Store transaction records
- Check wallet balances

**Broadcasting Flow:**
```
1. Receive signed transaction
2. Broadcast to Sepolia network
3. Wait for confirmation
4. Update database with tx hash
5. Return transaction receipt
```

**PYUSD Token Details:**
- **Decimals:** 6
- **Standard:** ERC-20
- **Network:** Ethereum Sepolia
- **Address:** `0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9`

---

### 6. Notifier

**Responsibility:** Send email notifications

**Email Types:**

1. **Wallet Creation**
   - OTP code
   - Verification link
   - Expiry time

2. **Transaction Success**
   - Sender and recipient
   - Amount and asset
   - Transaction hash
   - Explorer link

3. **Transaction Failure**
   - Error message
   - Transaction details
   - Retry instructions

4. **Onboarding**
   - Pending payment info
   - Onboarding link
   - Expiry time

5. **Invalid Command**
   - Error explanation
   - Correct format examples

---

### 7. Transaction Processor

**Responsibility:** Orchestrate transaction flow

**Main Flow:**
```
1. Receive email from Gmail Poller
2. Extract sender email
3. Parse command with Intent Parser
4. Validate sender wallet verified
5. Check policies
6. Generate transaction intent
7. Check recipient wallet
   a. If exists & verified → execute transaction
   b. If not exists → initiate onboarding
8. Send notifications
```

**Onboarding Flow:**
```
1. Store as pending transaction
2. Generate onboarding token
3. Create onboarding URL
4. Send onboarding email to recipient
5. Notify sender of pending status
6. Wait for recipient verification
7. Auto-process pending transaction
```

**Pending Transaction Processing:**
```
1. Recipient verifies wallet
2. System fetches pending transactions
3. Check expiry
4. Execute each pending transaction
5. Send confirmations
6. Mark as completed
```

---

## Data Flow Diagrams

### Wallet Creation Flow

```
User                Frontend              Backend              Gmail
 │                     │                     │                   │
 │──Enter Email───────▶│                     │                   │
 │                     │──POST /wallet/create│                   │
 │                     │────────────────────▶│                   │
 │                     │                     │──Generate Wallet──│
 │                     │                     │──Generate OTP─────│
 │                     │                     │──Store in DB──────│
 │                     │                     │──Send Email──────▶│
 │                     │◀────Success─────────│                   │
 │◀──Redirect to Verify│                     │                   │
 │                     │                     │                   │
 │◀──────────────────────────────OTP Email──────────────────────│
```

### Payment Flow (Verified Recipient)

```
Sender              Gmail               Backend            Ethereum
 │                    │                    │                  │
 │──Send Email───────▶│                    │                  │
 │  "SEND 10 PYUSD"   │                    │                  │
 │                    │──Poll & Fetch─────▶│                  │
 │                    │                    │──Parse Command───│
 │                    │                    │──Validate────────│
 │                    │                    │──Sign Tx─────────│
 │                    │                    │──Broadcast──────▶│
 │                    │                    │◀──Tx Hash────────│
 │                    │◀──Send Confirmation│                  │
 │◀──Confirmation Email│                    │                  │
```

### Payment Flow (New Recipient)

```
Sender          Backend          Recipient         Gmail
 │                 │                 │               │
 │──Send Email────▶│                 │               │
 │                 │──Check Recipient│               │
 │                 │──Not Found──────│               │
 │                 │──Create Pending─│               │
 │                 │──Generate Token─│               │
 │                 │──Send Onboarding│──────────────▶│
 │                 │                 │◀──Email───────│
 │                 │                 │──Click Link───│
 │                 │◀──Create Wallet─│               │
 │                 │──Send OTP───────│──────────────▶│
 │                 │                 │◀──OTP Email───│
 │                 │◀──Verify OTP────│               │
 │                 │──Process Pending│               │
 │                 │──Broadcast Tx───│               │
 │◀──Confirmation──│                 │               │
 │                 │──Confirmation───│──────────────▶│
```

---

## Security Architecture

### Authentication & Authorization

1. **Email Verification**
   - OTP-based verification
   - 6-digit codes
   - Time-limited validity

2. **Gmail OAuth 2.0**
   - Client credentials
   - Refresh token rotation
   - Scope limitation

3. **PKP Wallets**
   - No private keys on server
   - Policy-bound signing
   - Lit Protocol integration

### Policy Enforcement

```javascript
// Transaction Policies
{
  maxTxAmount: 100,        // Max PYUSD per transaction
  dailyTxCap: 500,         // Max PYUSD per day per wallet
  txExpiryMinutes: 30      // Transaction intent expiry
}
```

### Idempotency

- Email deduplication via processed email IDs
- Transaction intent UUIDs
- Database-level uniqueness constraints

### Rate Limiting

- Gmail API quota management
- Polling interval optimization
- Batch processing

---

## Database Schema

### Users Collection
```javascript
{
  "user@example.com": {
    email: string,
    pkpPublicKey: string,
    pkpEthAddress: string,
    otpCode: string,
    verified: boolean,
    createdAt: ISO8601,
    verifiedAt: ISO8601
  }
}
```

### Transactions Collection
```javascript
{
  "tx-uuid": {
    txId: string,
    senderEmail: string,
    recipientEmail: string,
    amount: number,
    asset: string,
    chainId: number,
    tokenAddress: string,
    txHash: string,
    blockNumber: number,
    status: 'pending' | 'completed' | 'failed',
    createdAt: ISO8601,
    completedAt: ISO8601
  }
}
```

### Pending Transactions Collection
```javascript
{
  "tx-uuid": {
    txId: string,
    senderEmail: string,
    recipientEmail: string,
    amount: number,
    asset: string,
    completed: boolean,
    createdAt: ISO8601,
    expiresAt: ISO8601
  }
}
```

### Processed Emails Set
```javascript
Set<string> // Email IDs
```

### Daily Spending Map
```javascript
{
  "user@example.com:2024-01-01": 50.5
}
```

---

## Error Handling

### Error Categories

1. **Validation Errors**
   - Invalid command format
   - Invalid email address
   - Invalid amount

2. **Policy Errors**
   - Exceeds max transaction amount
   - Exceeds daily cap
   - Transaction expired

3. **Wallet Errors**
   - Wallet not found
   - Wallet not verified
   - Invalid OTP

4. **Blockchain Errors**
   - Insufficient gas
   - Transaction reverted
   - Network errors

5. **System Errors**
   - Gmail API errors
   - Database errors
   - Network timeouts

### Error Response Flow

```
Error Occurs
    │
    ▼
Log Error
    │
    ▼
Store in Database
    │
    ▼
Send Error Email to User
    │
    ▼
Include:
  • Error message
  • Transaction details
  • Retry instructions
  • Support contact
```

---

## Scalability Considerations

### Current Limitations (Demo)

- JSON file database (not production-ready)
- Single server instance
- Synchronous email polling
- Mock PKP signing

### Production Recommendations

1. **Database**
   - PostgreSQL or MongoDB
   - Indexed queries
   - Connection pooling

2. **Message Queue**
   - Redis or RabbitMQ
   - Async email processing
   - Job retries

3. **Caching**
   - Redis for wallet lookups
   - Cache daily spending
   - Cache processed emails

4. **Load Balancing**
   - Multiple backend instances
   - Nginx or AWS ALB
   - Session affinity

5. **Monitoring**
   - Application logs
   - Transaction metrics
   - Error tracking (Sentry)
   - Uptime monitoring

---

## Deployment Architecture

### Development
```
localhost:3000 (Frontend)
localhost:3001 (Backend)
```

### Production
```
┌─────────────────┐
│   CloudFlare    │
│   CDN + DDoS    │
└────────┬────────┘
         │
┌────────▼────────┐
│  Load Balancer  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼───┐
│ Web  │  │ Web  │
│ App  │  │ App  │
│ (UI) │  │ (UI) │
└──────┘  └──────┘
         │
┌────────▼────────┐
│  API Gateway    │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼───┐
│ API  │  │ API  │
│ Node │  │ Node │
└───┬──┘  └──┬───┘
    │         │
    └────┬────┘
         │
┌────────▼────────┐
│   PostgreSQL    │
│   + Redis       │
└─────────────────┘
```

---

## Performance Metrics

### Target Metrics

- **Email Processing:** < 5 seconds
- **Transaction Broadcast:** < 30 seconds
- **Wallet Creation:** < 2 seconds
- **OTP Verification:** < 1 second
- **API Response Time:** < 500ms

### Monitoring Points

- Gmail API quota usage
- Transaction success rate
- Average processing time
- Error rate by type
- Daily active wallets

---

## Future Enhancements

### Short Term
- Support 0x address recipients
- Transaction history API
- Webhook notifications
- Email templates

### Medium Term
- Multi-asset support (USDC, USDT)
- Batch transactions
- Scheduled payments
- Payment requests

### Long Term
- Multi-chain support
- Mobile app
- Smart contract integration
- DeFi integrations

---

## Conclusion

EmailPay's architecture is designed for simplicity and extensibility. The modular service-based design allows for easy testing, maintenance, and future enhancements. The system prioritizes security through policy enforcement, email verification, and PKP wallet integration while maintaining a user-friendly email-native interface.
