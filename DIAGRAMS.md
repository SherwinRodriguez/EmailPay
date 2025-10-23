# EmailPay System Diagrams

Visual representations of EmailPay architecture and flows.

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                            USER LAYER                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐         ┌──────────────┐         ┌─────────────┐ │
│  │   Web UI     │         │    Gmail     │         │   Email     │ │
│  │  (Next.js)   │         │   Client     │         │   Inbox     │ │
│  │              │         │              │         │             │ │
│  │ • Create     │         │ • Compose    │         │ • Receive   │ │
│  │ • Verify     │         │ • Send       │         │ • Read      │ │
│  │ • View       │         │ • Commands   │         │ • Confirm   │ │
│  └──────┬───────┘         └──────┬───────┘         └──────┬──────┘ │
│         │                        │                        │         │
└─────────┼────────────────────────┼────────────────────────┼─────────┘
          │                        │                        │
          │ HTTPS                  │ SMTP                   │ IMAP
          │                        │                        │
┌─────────▼────────────────────────▼────────────────────────▼─────────┐
│                        APPLICATION LAYER                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Express API Server                         │  │
│  │                                                               │  │
│  │  REST Endpoints:                                             │  │
│  │  • POST /api/wallet/create                                   │  │
│  │  • POST /api/wallet/verify                                   │  │
│  │  • GET  /api/wallet/:email                                   │  │
│  │  • POST /api/onboard                                         │  │
│  │  • GET  /api/transaction/:txId                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐  │
│  │   Gmail     │  │   Intent    │  │     PKP     │  │  Policy  │  │
│  │   Poller    │─▶│   Parser    │─▶│   Wallet    │─▶│  Bound   │  │
│  │             │  │             │  │   Manager   │  │  Signer  │  │
│  │ • Poll      │  │ • Parse     │  │             │  │          │  │
│  │ • Dedupe    │  │ • Validate  │  │ • Create    │  │ • Enforce│  │
│  │ • Extract   │  │ • Generate  │  │ • Verify    │  │ • Sign   │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────┬─────┘  │
│                                                            │         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────▼─────┐  │
│  │  Notifier   │◀─│ Broadcaster │◀─│  Transaction Processor    │  │
│  │             │  │             │  │                           │  │
│  │ • Success   │  │ • Broadcast │  │ • Orchestrate             │  │
│  │ • Failure   │  │ • Track     │  │ • Validate                │  │
│  │ • Onboard   │  │ • Confirm   │  │ • Execute                 │  │
│  └─────────────┘  └─────────────┘  └───────────────────────────┘  │
│                                                                      │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
┌──────────────────────────────────▼───────────────────────────────────┐
│                        INFRASTRUCTURE LAYER                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐  │
│  │   Gmail     │  │  Ethereum   │  │     Lit     │  │ Database │  │
│  │    API      │  │   Sepolia   │  │  Protocol   │  │  (JSON)  │  │
│  │             │  │             │  │             │  │          │  │
│  │ • OAuth 2.0 │  │ • PYUSD     │  │ • PKP       │  │ • Users  │  │
│  │ • Send/Read │  │ • ERC-20    │  │ • Signing   │  │ • Txns   │  │
│  │ • Reply     │  │ • Broadcast │  │ • Actions   │  │ • Pending│  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Wallet Creation Flow

```
┌─────────┐                                                    ┌─────────┐
│  User   │                                                    │  Gmail  │
└────┬────┘                                                    └────┬────┘
     │                                                              │
     │  1. Visit Homepage                                          │
     │  http://localhost:3000                                      │
     │                                                              │
     │  2. Enter Email                                             │
     │  user@example.com                                           │
     │                                                              │
     ▼                                                              │
┌─────────────────┐                                               │
│   Frontend UI   │                                               │
└────┬────────────┘                                               │
     │                                                              │
     │  3. POST /api/wallet/create                                │
     │  { email: "user@example.com" }                             │
     │                                                              │
     ▼                                                              │
┌─────────────────────────┐                                       │
│  Backend API Server     │                                       │
│                         │                                       │
│  4. PKP Wallet Manager  │                                       │
│     • Generate wallet   │                                       │
│     • Generate OTP      │                                       │
│     • Store in DB       │                                       │
└────┬────────────────────┘                                       │
     │                                                              │
     │  5. Send OTP Email ──────────────────────────────────────▶ │
     │  "Your code: 123456"                                        │
     │                                                              │
     │  6. Return Success                                          │
     │  { address: "0x...", email: "..." }                        │
     │                                                              │
     ▼                                                              │
┌─────────────────┐                                               │
│   Frontend UI   │                                               │
│                 │                                               │
│  7. Redirect to │                                               │
│  /verify        │                                               │
└────┬────────────┘                                               │
     │                                                              │
     │  8. Check Email ◀────────────────────────────────────────── │
     │  Receive OTP: 123456                                        │
     │                                                              │
     │  9. Enter OTP                                               │
     │  POST /api/wallet/verify                                    │
     │  { email: "...", otpCode: "123456" }                       │
     │                                                              │
     ▼                                                              │
┌─────────────────────────┐                                       │
│  Backend API Server     │                                       │
│                         │                                       │
│  10. Verify OTP         │                                       │
│      Mark as verified   │                                       │
│      Process pending tx │                                       │
└────┬────────────────────┘                                       │
     │                                                              │
     │  11. Return Success                                         │
     │  { success: true }                                          │
     │                                                              │
     ▼                                                              │
┌─────────────────┐                                               │
│   Frontend UI   │                                               │
│                 │                                               │
│  12. Show       │                                               │
│  Wallet Info    │                                               │
│  • Address      │                                               │
│  • Balance      │                                               │
└─────────────────┘                                               │
```

---

## Payment Flow (Both Users Verified)

```
┌────────┐                                              ┌──────────┐
│ Sender │                                              │ Recipient│
└───┬────┘                                              └────┬─────┘
    │                                                        │
    │  1. Compose Email                                     │
    │  To: send@emailpay.com                                │
    │  Body: SEND 10 PYUSD TO recipient@example.com        │
    │                                                        │
    ▼                                                        │
┌────────────┐                                              │
│   Gmail    │                                              │
└─────┬──────┘                                              │
      │                                                      │
      │  2. Email Sent                                      │
      │                                                      │
      ▼                                                      │
┌──────────────────┐                                        │
│  Gmail Poller    │                                        │
│                  │                                        │
│  3. Poll Inbox   │                                        │
│  4. Fetch Email  │                                        │
│  5. Parse Body   │                                        │
└─────┬────────────┘                                        │
      │                                                      │
      │  6. Email Data                                      │
      │  { from, body, ... }                                │
      │                                                      │
      ▼                                                      │
┌──────────────────────┐                                    │
│  Intent Parser       │                                    │
│                      │                                    │
│  7. Parse Command    │                                    │
│  8. Validate Format  │                                    │
│  9. Extract Data     │                                    │
│     • Amount: 10     │                                    │
│     • Asset: PYUSD   │                                    │
│     • Recipient      │                                    │
└─────┬────────────────┘                                    │
      │                                                      │
      │  10. Transaction Intent                             │
      │  { txId, sender, recipient, amount, ... }          │
      │                                                      │
      ▼                                                      │
┌──────────────────────┐                                    │
│  Policy Validator    │                                    │
│                      │                                    │
│  11. Check Sender    │                                    │
│      Verified? ✓     │                                    │
│  12. Check Recipient │                                    │
│      Verified? ✓     │                                    │
│  13. Check Amount    │                                    │
│      ≤ Max? ✓        │                                    │
│  14. Check Daily Cap │                                    │
│      OK? ✓           │                                    │
└─────┬────────────────┘                                    │
      │                                                      │
      │  15. Validation Passed                              │
      │                                                      │
      ▼                                                      │
┌──────────────────────┐                                    │
│  PKP Signer          │                                    │
│                      │                                    │
│  16. Create TX       │                                    │
│  17. Encode ERC-20   │                                    │
│  18. Sign TX         │                                    │
└─────┬────────────────┘                                    │
      │                                                      │
      │  19. Signed Transaction                             │
      │                                                      │
      ▼                                                      │
┌──────────────────────┐                                    │
│  Broadcaster         │                                    │
│                      │                                    │
│  20. Broadcast TX    │                                    │
│  21. Wait for Receipt│                                    │
│  22. Get TX Hash     │                                    │
└─────┬────────────────┘                                    │
      │                                                      │
      │  23. TX Hash: 0x...                                 │
      │                                                      │
      ▼                                                      │
┌──────────────────────┐                                    │
│  Notifier            │                                    │
│                      │                                    │
│  24. Send Success    │                                    │
│      Email to Sender │──────────────────────────────────▶│
│                      │                                    │
│  25. Send Success    │                                    │
│      Email to        │                                    │
│      Recipient       │────────────────────────────────────▶
└──────────────────────┘
```

---

## Recipient Onboarding Flow

```
┌────────┐                                    ┌─────────────┐
│ Sender │                                    │  Recipient  │
└───┬────┘                                    │ (No Wallet) │
    │                                         └──────┬──────┘
    │  1. Send Email Command                        │
    │  SEND 5 PYUSD TO newuser@example.com         │
    │                                               │
    ▼                                               │
┌──────────────────────┐                           │
│  Transaction         │                           │
│  Processor           │                           │
│                      │                           │
│  2. Parse Command    │                           │
│  3. Check Sender ✓   │                           │
│  4. Check Recipient  │                           │
│     Not Found! ✗     │                           │
└─────┬────────────────┘                           │
      │                                             │
      │  5. Create Pending TX                      │
      │  Store in DB with expiry                   │
      │                                             │
      ▼                                             │
┌──────────────────────┐                           │
│  PKP Wallet Manager  │                           │
│                      │                           │
│  6. Generate Token   │                           │
│  7. Create URL       │                           │
│     /onboard?token=  │                           │
└─────┬────────────────┘                           │
      │                                             │
      │  8. Send Onboarding Email                  │
      │  "You have 5 PYUSD pending"                │
      │  Click: https://.../onboard?token=xyz      │
      │                                             │
      ├─────────────────────────────────────────────▶
      │                                             │
      │  9. Send Notification to Sender            │
      │  "Payment pending recipient verification"  │
      │                                             │
      ◀─────────────────────────────────────────────┤
      │                                             │
      │                                             │  10. Click Link
      │                                             │
      │                                             ▼
      │                                    ┌──────────────────┐
      │                                    │  Onboarding Page │
      │                                    │                  │
      │                                    │  11. Parse Token │
      │                                    │  12. Show Info   │
      │                                    └────────┬─────────┘
      │                                             │
      │  13. POST /api/onboard                     │
      │  { token: "xyz" }                          │
      │                                             │
      ◀─────────────────────────────────────────────┤
      │                                             │
┌─────▼────────────────┐                           │
│  Backend             │                           │
│                      │                           │
│  14. Validate Token  │                           │
│  15. Create Wallet   │                           │
│  16. Generate OTP    │                           │
│  17. Send OTP Email  │                           │
└─────┬────────────────┘                           │
      │                                             │
      │  18. OTP Email: 123456                     │
      │                                             │
      ├─────────────────────────────────────────────▶
      │                                             │
      │                                             │  19. Enter OTP
      │                                             │  POST /verify
      │                                             │
      ◀─────────────────────────────────────────────┤
      │                                             │
┌─────▼────────────────┐                           │
│  Backend             │                           │
│                      │                           │
│  20. Verify OTP ✓    │                           │
│  21. Mark Verified   │                           │
│  22. Get Pending TX  │                           │
│  23. Execute TX      │                           │
│  24. Broadcast       │                           │
└─────┬────────────────┘                           │
      │                                             │
      │  25. Send Confirmation to Both             │
      │  "Payment completed!"                      │
      │  TX Hash: 0x...                            │
      │                                             │
      ├─────────────────────────────────────────────▶
      │                                             │
      ◀─────────────────────────────────────────────┤
```

---

## Database Schema Diagram

```
┌─────────────────────────────────────────┐
│              USERS TABLE                │
├─────────────────────────────────────────┤
│ PK  email              VARCHAR(255)     │
│     pkp_public_key     TEXT             │
│     pkp_eth_address    VARCHAR(42)      │
│     otp_code           VARCHAR(6)       │
│     verified           BOOLEAN          │
│     created_at         TIMESTAMP        │
│     verified_at        TIMESTAMP        │
└──────────────┬──────────────────────────┘
               │
               │ 1:N
               │
┌──────────────▼──────────────────────────┐
│         TRANSACTIONS TABLE              │
├─────────────────────────────────────────┤
│ PK  tx_id              UUID             │
│ FK  sender_email       VARCHAR(255)     │
│ FK  recipient_email    VARCHAR(255)     │
│     amount             DECIMAL(18,6)    │
│     asset              VARCHAR(10)      │
│     chain_id           INTEGER          │
│     token_address      VARCHAR(42)      │
│     tx_hash            VARCHAR(66)      │
│     block_number       BIGINT           │
│     status             VARCHAR(20)      │
│     created_at         TIMESTAMP        │
│     completed_at       TIMESTAMP        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│     PENDING_TRANSACTIONS TABLE          │
├─────────────────────────────────────────┤
│ PK  tx_id              UUID             │
│ FK  sender_email       VARCHAR(255)     │
│     recipient_email    VARCHAR(255)     │
│     amount             DECIMAL(18,6)    │
│     asset              VARCHAR(10)      │
│     completed          BOOLEAN          │
│     created_at         TIMESTAMP        │
│     expires_at         TIMESTAMP        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│      PROCESSED_EMAILS TABLE             │
├─────────────────────────────────────────┤
│ PK  email_id           VARCHAR(255)     │
│     processed_at       TIMESTAMP        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│       DAILY_SPENDING TABLE              │
├─────────────────────────────────────────┤
│ PK  email              VARCHAR(255)     │
│ PK  date               DATE             │
│     amount             DECIMAL(18,6)    │
└─────────────────────────────────────────┘
```

---

## State Machine Diagram

```
                    ┌──────────────┐
                    │   WALLET     │
                    │  UNVERIFIED  │
                    └──────┬───────┘
                           │
                           │ OTP Verified
                           │
                    ┌──────▼───────┐
                    │   WALLET     │
                    │   VERIFIED   │
                    └──────┬───────┘
                           │
                           │ Send Command
                           │
                    ┌──────▼───────┐
                    │ TRANSACTION  │
                    │   PENDING    │
                    └──────┬───────┘
                           │
                ┌──────────┼──────────┐
                │          │          │
         Policy │   Recipient    Expired
         Failed │   Not Verified     │
                │          │          │
         ┌──────▼──┐  ┌───▼────┐  ┌──▼──────┐
         │  FAILED │  │ONBOARD-│  │ EXPIRED │
         │         │  │  ING   │  │         │
         └─────────┘  └───┬────┘  └─────────┘
                          │
                          │ Recipient
                          │ Verified
                          │
                    ┌─────▼──────┐
                    │  SIGNING   │
                    └─────┬──────┘
                          │
                          │ Signed
                          │
                    ┌─────▼──────┐
                    │BROADCASTING│
                    └─────┬──────┘
                          │
                ┌─────────┼─────────┐
                │         │         │
         Broadcast  Confirmed  Broadcast
         Failed        │       Failed
                │         │         │
         ┌──────▼──┐  ┌──▼──────┐  │
         │  FAILED │  │COMPLETED│◀─┘
         │         │  │         │
         └─────────┘  └─────────┘
```

---

## Security Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                       │
└─────────────────────────────────────────────────────────┘

Layer 1: Email Verification
┌─────────────────────────────────────────────────────────┐
│  • OTP Generation (6-digit)                             │
│  • Time-limited codes (30 min)                          │
│  • One-time use only                                    │
│  • Email ownership proof                                │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
Layer 2: Policy Enforcement
┌─────────────────────────────────────────────────────────┐
│  • Max transaction amount check                         │
│  • Daily spending cap enforcement                       │
│  • Transaction expiry validation                        │
│  • Sender verification required                         │
│  • Recipient verification required                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
Layer 3: Idempotency
┌─────────────────────────────────────────────────────────┐
│  • Email ID deduplication                               │
│  • Transaction UUID generation                          │
│  • Database-level uniqueness                            │
│  • Prevent double-spending                              │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
Layer 4: PKP Wallet Security
┌─────────────────────────────────────────────────────────┐
│  • No private keys stored                               │
│  • Policy-bound signing                                 │
│  • Lit Protocol integration                             │
│  • Secure key management                                │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
Layer 5: Transaction Security
┌─────────────────────────────────────────────────────────┐
│  • ERC-20 standard compliance                           │
│  • Gas estimation                                       │
│  • Transaction confirmation                             │
│  • Receipt verification                                 │
└─────────────────────────────────────────────────────────┘
```

---

These diagrams provide visual representations of EmailPay's architecture, flows, and security model. Use them for understanding, documentation, and presentations.
