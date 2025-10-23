# Changelog

All notable changes to EmailPay will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2024-01-01

### Added

#### Core Features
- **Email-as-Wallet System**
  - PKP wallet creation via email
  - OTP-based email verification
  - Wallet address generation and management

- **Email Command Processing**
  - Gmail API integration for inbox polling
  - Strict command parsing: `SEND <amount> PYUSD TO <email>`
  - Email deduplication to prevent double-processing
  - Automatic email notifications for all transaction states

- **Transaction Management**
  - PYUSD ERC-20 transfers on Ethereum Sepolia
  - Policy-bound transaction signing
  - Transaction broadcasting and confirmation
  - Transaction history storage

- **Recipient Onboarding**
  - Automatic onboarding flow for new recipients
  - Time-limited onboarding links
  - Pending transaction queue
  - Automatic transaction resumption after verification

- **Security Features**
  - Maximum per-transaction limits
  - Daily spending caps
  - Transaction expiry times
  - Idempotency guarantees
  - Email verification requirements

#### Backend Services
- **Gmail Poller**
  - OAuth 2.0 authentication
  - Configurable polling intervals
  - Email parsing and extraction
  - Send and reply functionality

- **Intent Parser**
  - Regex-based command validation
  - Amount and email validation
  - Policy enforcement checks
  - Transaction intent generation

- **PKP Wallet Manager**
  - Wallet creation and storage
  - OTP generation (6-digit codes)
  - Wallet verification
  - Onboarding token management

- **Policy Bound Signer**
  - Transaction validation
  - Policy enforcement
  - ERC-20 transaction encoding
  - Mock signing (demo mode)

- **Broadcaster**
  - Ethereum Sepolia integration
  - Transaction broadcasting
  - Receipt tracking
  - Balance checking

- **Notifier**
  - Wallet creation emails
  - Transaction confirmation emails
  - Onboarding emails
  - Error notification emails

- **Transaction Processor**
  - Email command orchestration
  - Recipient verification checks
  - Onboarding flow management
  - Pending transaction processing

#### Frontend Application
- **Home Page**
  - Wallet creation form
  - Feature showcase
  - How-it-works guide
  - Responsive design

- **Verification Page**
  - OTP input form
  - Wallet info display
  - Balance display
  - Usage instructions

- **Onboarding Page**
  - Token-based onboarding
  - Pending payment notification
  - Automatic wallet creation
  - Verification redirect

- **Wallet Info Page**
  - Wallet details display
  - Balance checking
  - Address copying
  - Etherscan integration

#### Configuration
- Environment-based configuration
- Configurable transaction policies
- Gmail API settings
- Ethereum network settings
- Lit Protocol integration settings

#### Documentation
- Comprehensive README with setup instructions
- Architecture documentation with diagrams
- Detailed setup guide
- Testing guide with test cases
- Contributing guidelines
- Security policy
- API documentation

#### Development Tools
- Jest test framework setup
- Unit tests for intent parser
- GitHub Actions CI/CD workflow
- ESLint configuration (planned)
- Development scripts

### Technical Details

#### Dependencies
- **Backend:**
  - Express.js for API server
  - Google APIs for Gmail integration
  - Ethers.js v6 for Ethereum interaction
  - Lit Protocol SDK for PKP wallets
  - UUID for transaction IDs
  - Nodemailer for email sending

- **Frontend:**
  - Next.js 14 with App Router
  - React 18
  - TailwindCSS for styling
  - Lucide React for icons
  - Axios for API calls

#### Network Configuration
- Ethereum Sepolia testnet (Chain ID: 11155111)
- PYUSD token: `0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9`
- Infura/Alchemy RPC support

#### Database
- JSON file-based storage (demo)
- User wallet records
- Transaction history
- Pending transactions queue
- Processed email tracking
- Daily spending records

### Known Limitations

- JSON database not suitable for production
- Mock PKP signing (demo mode)
- No rate limiting implemented
- No request validation middleware
- Single server instance only
- Sepolia testnet only
- PYUSD only (no multi-asset support)
- Email format only (no 0x address support)

### Security Notes

⚠️ **This is a demonstration project running on Sepolia testnet.**

- Not audited for production use
- No encryption at rest
- No secrets management
- No HTTPS enforcement
- Requires proper security hardening for production

---

## [Unreleased]

### Planned Features

#### Short Term
- [ ] Support for 0x address recipients
- [ ] Transaction history API endpoint
- [ ] Webhook notifications
- [ ] Email template customization
- [ ] Rate limiting middleware
- [ ] Request validation

#### Medium Term
- [ ] Multi-asset support (USDC, USDT)
- [ ] Batch transaction processing
- [ ] Scheduled payments
- [ ] Payment requests
- [ ] PostgreSQL database migration
- [ ] Redis caching layer

#### Long Term
- [ ] Multi-chain support (Polygon, Arbitrum)
- [ ] Mobile application
- [ ] Smart contract integration
- [ ] DeFi protocol integrations
- [ ] Advanced analytics dashboard
- [ ] Multi-language support

### Improvements

#### Performance
- [ ] Database query optimization
- [ ] Caching layer implementation
- [ ] Async job processing
- [ ] Load balancing support

#### Security
- [ ] Production PKP integration
- [ ] Database encryption
- [ ] Secrets management
- [ ] Security audit
- [ ] Penetration testing

#### Developer Experience
- [ ] API documentation (OpenAPI/Swagger)
- [ ] SDK for integrations
- [ ] Webhook examples
- [ ] Postman collection
- [ ] Docker support

---

## Version History

### [1.0.0] - 2024-01-01
- Initial release
- Core email-to-payment functionality
- PKP wallet integration
- Recipient onboarding
- Basic security policies

---

## Migration Guides

### Upgrading to 1.0.0

This is the initial release. No migration needed.

---

## Breaking Changes

None yet.

---

## Deprecations

None yet.

---

## Contributors

Thank you to all contributors who helped make EmailPay possible!

- [Your Name] - Initial development

---

## Links

- [GitHub Repository](https://github.com/yourusername/emailpay)
- [Documentation](https://github.com/yourusername/emailpay/blob/main/README.md)
- [Issue Tracker](https://github.com/yourusername/emailpay/issues)
- [Security Policy](https://github.com/yourusername/emailpay/blob/main/SECURITY.md)

---

**Note:** This changelog follows the [Keep a Changelog](https://keepachangelog.com/) format.
