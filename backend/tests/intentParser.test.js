const intentParser = require('../services/intentParser');

describe('Intent Parser', () => {
  describe('parseCommand', () => {
    test('should parse valid command with integer amount', () => {
      const result = intentParser.parseCommand('SEND 10 PYUSD TO test@example.com');
      expect(result.valid).toBe(true);
      expect(result.amount).toBe(10);
      expect(result.asset).toBe('PYUSD');
      expect(result.recipientEmail).toBe('test@example.com');
    });

    test('should parse valid command with decimal amount', () => {
      const result = intentParser.parseCommand('SEND 25.5 PYUSD TO alice@gmail.com');
      expect(result.valid).toBe(true);
      expect(result.amount).toBe(25.5);
      expect(result.recipientEmail).toBe('alice@gmail.com');
    });

    test('should be case insensitive', () => {
      const result = intentParser.parseCommand('send 10 pyusd to test@example.com');
      expect(result.valid).toBe(true);
      expect(result.amount).toBe(10);
    });

    test('should reject invalid format - missing TO', () => {
      const result = intentParser.parseCommand('SEND 10 PYUSD test@example.com');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid command format');
    });

    test('should reject invalid format - wrong order', () => {
      const result = intentParser.parseCommand('PYUSD 10 SEND TO test@example.com');
      expect(result.valid).toBe(false);
    });

    test('should reject negative amount', () => {
      const result = intentParser.parseCommand('SEND -10 PYUSD TO test@example.com');
      expect(result.valid).toBe(false);
    });

    test('should reject zero amount', () => {
      const result = intentParser.parseCommand('SEND 0 PYUSD TO test@example.com');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid amount');
    });

    test('should reject invalid email format', () => {
      const result = intentParser.parseCommand('SEND 10 PYUSD TO not-an-email');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid recipient email');
    });

    test('should reject non-numeric amount', () => {
      const result = intentParser.parseCommand('SEND abc PYUSD TO test@example.com');
      expect(result.valid).toBe(false);
    });

    test('should handle extra whitespace', () => {
      const result = intentParser.parseCommand('  SEND   10   PYUSD   TO   test@example.com  ');
      expect(result.valid).toBe(false); // Strict regex requires single spaces
    });

    test('should convert recipient email to lowercase', () => {
      const result = intentParser.parseCommand('SEND 10 PYUSD TO TEST@EXAMPLE.COM');
      expect(result.valid).toBe(true);
      expect(result.recipientEmail).toBe('test@example.com');
    });
  });

  describe('isValidEmail', () => {
    test('should validate correct email formats', () => {
      expect(intentParser.isValidEmail('test@example.com')).toBe(true);
      expect(intentParser.isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(intentParser.isValidEmail('user+tag@example.com')).toBe(true);
    });

    test('should reject invalid email formats', () => {
      expect(intentParser.isValidEmail('not-an-email')).toBe(false);
      expect(intentParser.isValidEmail('@example.com')).toBe(false);
      expect(intentParser.isValidEmail('user@')).toBe(false);
      expect(intentParser.isValidEmail('user@domain')).toBe(false);
    });
  });

  describe('generateTransactionIntent', () => {
    test('should generate valid transaction intent', () => {
      const intent = intentParser.generateTransactionIntent(
        'sender@example.com',
        'recipient@example.com',
        10,
        'PYUSD'
      );

      expect(intent).toHaveProperty('txId');
      expect(intent.senderEmail).toBe('sender@example.com');
      expect(intent.recipientEmail).toBe('recipient@example.com');
      expect(intent.amount).toBe(10);
      expect(intent.asset).toBe('PYUSD');
      expect(intent.chainId).toBe(11155111);
      expect(intent.status).toBe('pending');
      expect(intent).toHaveProperty('timestamp');
      expect(intent).toHaveProperty('expiresAt');
    });

    test('should generate unique transaction IDs', () => {
      const intent1 = intentParser.generateTransactionIntent(
        'sender@example.com',
        'recipient@example.com',
        10
      );
      const intent2 = intentParser.generateTransactionIntent(
        'sender@example.com',
        'recipient@example.com',
        10
      );

      expect(intent1.txId).not.toBe(intent2.txId);
    });
  });

  describe('validatePolicies', () => {
    test('should pass validation for valid transaction', () => {
      const result = intentParser.validatePolicies(50, 100);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject transaction exceeding max amount', () => {
      const result = intentParser.validatePolicies(150, 0);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('exceeds maximum');
    });

    test('should reject transaction exceeding daily cap', () => {
      const result = intentParser.validatePolicies(100, 450);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('exceed daily cap');
    });

    test('should reject transaction with multiple policy violations', () => {
      const result = intentParser.validatePolicies(150, 450);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    test('should allow transaction at exact limits', () => {
      const result = intentParser.validatePolicies(100, 400);
      expect(result.valid).toBe(true);
    });
  });
});
