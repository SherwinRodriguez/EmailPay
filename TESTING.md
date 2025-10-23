# EmailPay Testing Guide

Comprehensive testing guide for EmailPay functionality.

---

## Test Environment Setup

### Prerequisites
- EmailPay running locally (see SETUP_GUIDE.md)
- Access to test email accounts
- Sepolia testnet access

### Test Email Accounts

Use temporary email services for testing:
- [Temp Mail](https://temp-mail.org/)
- [Guerrilla Mail](https://www.guerrillamail.com/)
- [10 Minute Mail](https://10minutemail.com/)

Or create multiple Gmail accounts for testing.

---

## Unit Tests

### Backend Service Tests

Create `backend/tests/intentParser.test.js`:

```javascript
const intentParser = require('../services/intentParser');

describe('Intent Parser', () => {
  test('should parse valid command', () => {
    const result = intentParser.parseCommand('SEND 10 PYUSD TO test@example.com');
    expect(result.valid).toBe(true);
    expect(result.amount).toBe(10);
    expect(result.recipientEmail).toBe('test@example.com');
  });

  test('should reject invalid format', () => {
    const result = intentParser.parseCommand('Send me 10 PYUSD');
    expect(result.valid).toBe(false);
  });

  test('should reject negative amount', () => {
    const result = intentParser.parseCommand('SEND -10 PYUSD TO test@example.com');
    expect(result.valid).toBe(false);
  });

  test('should reject invalid email', () => {
    const result = intentParser.parseCommand('SEND 10 PYUSD TO invalid-email');
    expect(result.valid).toBe(false);
  });
});
```

Run tests:
```bash
npm test
```

---

## Integration Tests

### Test 1: Wallet Creation Flow

**Objective:** Verify complete wallet creation and verification

**Steps:**
1. Open http://localhost:3000
2. Enter test email: `test1@tempmail.com`
3. Click "Create Wallet"
4. Verify success message appears
5. Check email inbox for OTP
6. Navigate to verification page
7. Enter email and OTP code
8. Click "Verify Wallet"
9. Verify wallet info displays

**Expected Results:**
- ✅ Wallet created successfully
- ✅ OTP email received within 30 seconds
- ✅ OTP verification succeeds
- ✅ Wallet address displayed
- ✅ Balance shows 0 PYUSD

**Backend Logs to Check:**
```
Wallet created for test1@tempmail.com: 0x...
Email sent to test1@tempmail.com: Verify Your Wallet
Wallet verified for test1@tempmail.com
```

---

### Test 2: Simple Payment (Both Verified)

**Objective:** Send payment between two verified wallets

**Setup:**
1. Create and verify wallet for `sender@test.com`
2. Create and verify wallet for `recipient@test.com`

**Steps:**
1. From `sender@test.com` Gmail, compose email
2. To: Your EmailPay Gmail address
3. Body: `SEND 10 PYUSD TO recipient@test.com`
4. Send email
5. Wait for processing (check backend logs)
6. Check confirmation emails

**Expected Results:**
- ✅ Email processed within 60 seconds
- ✅ Sender receives confirmation email
- ✅ Recipient receives notification email
- ✅ Transaction hash included
- ✅ Etherscan link works
- ✅ Database updated with transaction

**Backend Logs to Check:**
```
Processing email from sender@test.com: SEND 10 PYUSD TO recipient@test.com
Executing transaction tx-uuid...
Transaction tx-uuid broadcasted successfully: 0x...
Email sent to sender@test.com: Transaction Successful
Email sent to recipient@test.com: Transaction Successful
```

---

### Test 3: Recipient Onboarding Flow

**Objective:** Send payment to unverified recipient

**Setup:**
1. Create and verify wallet for `sender@test.com`
2. Use new email `newuser@test.com` (no wallet)

**Steps:**
1. From `sender@test.com`, send email:
   ```
   SEND 5 PYUSD TO newuser@test.com
   ```
2. Check `newuser@test.com` inbox for onboarding email
3. Click onboarding link
4. Verify wallet creation page loads
5. Check email for OTP
6. Verify wallet with OTP
7. Check for pending payment processing

**Expected Results:**
- ✅ Sender receives "pending" notification
- ✅ Recipient receives onboarding email
- ✅ Onboarding link works
- ✅ Wallet created for recipient
- ✅ OTP verification succeeds
- ✅ Pending payment auto-processes
- ✅ Both parties receive confirmation

**Backend Logs to Check:**
```
Onboarding initiated for newuser@test.com, txId: tx-uuid
Email sent to newuser@test.com: You Have a Pending Payment!
Email sent to sender@test.com: Payment Pending Recipient Verification
Wallet created for newuser@test.com: 0x...
Wallet verified for newuser@test.com
Processing 1 pending transactions for newuser@test.com
Transaction tx-uuid completed successfully
```

---

### Test 4: Policy Enforcement

**Objective:** Verify transaction policies are enforced

#### Test 4a: Max Transaction Amount

**Steps:**
1. Send email: `SEND 150 PYUSD TO test@example.com`
   (Assuming MAX_TX_AMOUNT=100)

**Expected Results:**
- ✅ Transaction rejected
- ✅ Error email received
- ✅ Error message: "exceeds maximum of 100 PYUSD"

#### Test 4b: Daily Cap

**Steps:**
1. Send email: `SEND 100 PYUSD TO test1@example.com`
2. Send email: `SEND 100 PYUSD TO test2@example.com`
3. Send email: `SEND 100 PYUSD TO test3@example.com`
4. Send email: `SEND 100 PYUSD TO test4@example.com`
5. Send email: `SEND 100 PYUSD TO test5@example.com`
6. Send email: `SEND 100 PYUSD TO test6@example.com`
   (Assuming DAILY_TX_CAP=500)

**Expected Results:**
- ✅ First 5 transactions succeed (500 PYUSD total)
- ✅ 6th transaction rejected
- ✅ Error message: "exceed daily cap of 500 PYUSD"

#### Test 4c: Transaction Expiry

**Steps:**
1. Modify TX_EXPIRY_MINUTES to 1 minute
2. Send payment to unverified recipient
3. Wait 2 minutes
4. Recipient attempts to verify

**Expected Results:**
- ✅ Onboarding link expires
- ✅ Transaction marked as expired
- ✅ Sender notified of expiry

---

### Test 5: Invalid Commands

**Objective:** Verify error handling for invalid commands

#### Test 5a: Wrong Format
```
Send 10 PYUSD please to test@example.com
```
**Expected:** Error email with correct format

#### Test 5b: Invalid Amount
```
SEND abc PYUSD TO test@example.com
```
**Expected:** Error email about invalid amount

#### Test 5c: Invalid Email
```
SEND 10 PYUSD TO not-an-email
```
**Expected:** Error email about invalid email

#### Test 5d: Missing Parts
```
SEND 10 PYUSD
```
**Expected:** Error email with format instructions

---

### Test 6: Unverified Sender

**Objective:** Verify unverified senders cannot send payments

**Steps:**
1. Create wallet but don't verify
2. Send payment command email

**Expected Results:**
- ✅ Transaction rejected
- ✅ Error email received
- ✅ Message: "wallet is not verified"

---

### Test 7: Concurrent Transactions

**Objective:** Test multiple simultaneous transactions

**Steps:**
1. Send 3 emails rapidly:
   ```
   SEND 10 PYUSD TO user1@test.com
   SEND 20 PYUSD TO user2@test.com
   SEND 15 PYUSD TO user3@test.com
   ```

**Expected Results:**
- ✅ All 3 transactions process
- ✅ No duplicate processing
- ✅ Daily spending updated correctly (45 PYUSD)
- ✅ All confirmations sent

---

### Test 8: Email Deduplication

**Objective:** Verify duplicate emails aren't processed twice

**Steps:**
1. Send payment email
2. Gmail may show the same email multiple times in polling
3. System should process only once

**Expected Results:**
- ✅ Email processed exactly once
- ✅ Email ID stored in processedEmails
- ✅ No duplicate transactions
- ✅ No duplicate confirmations

---

## API Tests

### Test API Endpoints

Use curl or Postman:

#### Health Check
```bash
curl http://localhost:3001/health
```
**Expected:** `{"status":"ok","timestamp":"..."}`

#### Create Wallet
```bash
curl -X POST http://localhost:3001/api/wallet/create \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```
**Expected:** `{"success":true,"email":"...","address":"0x..."}`

#### Verify Wallet
```bash
curl -X POST http://localhost:3001/api/wallet/verify \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otpCode":"123456"}'
```
**Expected:** `{"success":true,"message":"Wallet verified successfully"}`

#### Get Wallet Info
```bash
curl http://localhost:3001/api/wallet/test@example.com
```
**Expected:** `{"email":"...","address":"0x...","verified":true,"balance":"0"}`

---

## Load Testing

### Test Gmail Polling Performance

**Objective:** Verify system handles high email volume

**Setup:**
1. Send 50 emails with payment commands
2. Monitor processing time
3. Check for errors

**Metrics to Track:**
- Average processing time per email
- Peak memory usage
- Gmail API quota usage
- Error rate

**Tools:**
- Apache JMeter
- Artillery
- Custom scripts

---

## Security Tests

### Test 1: SQL Injection (N/A - JSON DB)

### Test 2: Command Injection

**Objective:** Verify email commands don't execute code

**Steps:**
1. Send email with malicious content:
   ```
   SEND 10 PYUSD TO test@example.com; rm -rf /
   ```

**Expected Results:**
- ✅ Command rejected as invalid format
- ✅ No code execution
- ✅ Error email sent

### Test 3: XSS in Email

**Objective:** Verify HTML/JS in emails is sanitized

**Steps:**
1. Send email:
   ```
   SEND 10 PYUSD TO <script>alert('xss')</script>@test.com
   ```

**Expected Results:**
- ✅ Invalid email format detected
- ✅ No script execution
- ✅ Error email sent

### Test 4: Rate Limiting

**Objective:** Verify rate limiting prevents abuse

**Steps:**
1. Send 100 emails rapidly

**Expected Results:**
- ✅ Gmail API quota respected
- ✅ No service degradation
- ✅ Graceful error handling

---

## Frontend Tests

### Test 1: Responsive Design

**Objective:** Verify UI works on all devices

**Devices to Test:**
- Desktop (1920x1080)
- Laptop (1366x768)
- Tablet (768x1024)
- Mobile (375x667)

**Expected Results:**
- ✅ All elements visible
- ✅ Forms usable
- ✅ Text readable
- ✅ Buttons clickable

### Test 2: Browser Compatibility

**Browsers to Test:**
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Expected Results:**
- ✅ All features work
- ✅ Styling consistent
- ✅ No console errors

### Test 3: Form Validation

**Objective:** Verify client-side validation

**Steps:**
1. Try submitting empty forms
2. Try invalid email formats
3. Try invalid OTP codes

**Expected Results:**
- ✅ Validation errors shown
- ✅ Helpful error messages
- ✅ No API calls for invalid data

---

## Test Checklist

### Pre-Deployment Tests

- [ ] All unit tests pass
- [ ] Wallet creation works
- [ ] OTP verification works
- [ ] Payment between verified wallets works
- [ ] Recipient onboarding works
- [ ] Policy enforcement works
- [ ] Invalid commands handled correctly
- [ ] Email deduplication works
- [ ] API endpoints respond correctly
- [ ] Frontend loads without errors
- [ ] Responsive design works
- [ ] Browser compatibility verified
- [ ] Security tests pass
- [ ] Load testing completed
- [ ] Error handling verified
- [ ] Logging works correctly

### Production Monitoring

- [ ] Set up error tracking
- [ ] Configure uptime monitoring
- [ ] Set up transaction monitoring
- [ ] Configure alerts
- [ ] Set up log aggregation
- [ ] Monitor API metrics
- [ ] Track user metrics

---

## Test Data Cleanup

After testing, clean up:

```bash
# Clear database
rm data/db.json

# Clear logs
> backend.log

# Restart services
npm run dev
```

---

## Continuous Testing

### Automated Test Suite

Create `package.json` scripts:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:integration": "jest --testPathPattern=integration"
  }
}
```

### CI/CD Integration

Add to `.github/workflows/test.yml`:
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
```

---

## Reporting Issues

When reporting bugs, include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Backend logs
5. Frontend console logs
6. Environment details
7. Screenshots (if applicable)

---

**Happy Testing!** 🧪
