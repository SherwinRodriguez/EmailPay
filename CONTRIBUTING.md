# Contributing to EmailPay

Thank you for your interest in contributing to EmailPay! This document provides guidelines and instructions for contributing.

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Our Standards

- Be respectful and considerate
- Accept constructive criticism gracefully
- Focus on what's best for the project
- Show empathy towards other contributors

---

## How to Contribute

### Reporting Bugs

Before creating a bug report:
1. Check existing issues to avoid duplicates
2. Collect relevant information (logs, screenshots, etc.)
3. Create a minimal reproduction case

**Bug Report Template:**
```markdown
**Description:**
Clear description of the bug

**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Environment:**
- OS: [e.g., macOS 13.0]
- Node.js version: [e.g., 18.17.0]
- EmailPay version: [e.g., 1.0.0]

**Logs:**
```
Paste relevant logs here
```

**Screenshots:**
If applicable
```

### Suggesting Features

**Feature Request Template:**
```markdown
**Feature Description:**
Clear description of the feature

**Use Case:**
Why is this feature needed?

**Proposed Solution:**
How should it work?

**Alternatives Considered:**
Other approaches you've thought about

**Additional Context:**
Any other relevant information
```

### Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/emailpay.git
   cd emailpay
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow coding standards
   - Write tests
   - Update documentation

4. **Test your changes**
   ```bash
   npm test
   npm run dev
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Fill out the PR template

---

## Development Setup

### Prerequisites
- Node.js 18+
- npm 9+
- Git

### Setup Steps

1. **Clone and install:**
   ```bash
   git clone https://github.com/yourusername/emailpay.git
   cd emailpay
   npm install
   cd frontend
   npm install
   cd ..
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

---

## Coding Standards

### JavaScript Style Guide

**General Rules:**
- Use ES6+ features
- Use `const` and `let`, avoid `var`
- Use arrow functions for callbacks
- Use template literals for strings
- Use async/await over promises
- Use descriptive variable names

**Example:**
```javascript
// Good
const getUserWallet = async (email) => {
  const user = await db.getUser(email);
  return user ? user.wallet : null;
};

// Bad
var get_wallet = function(e) {
  return db.getUser(e).then(u => u ? u.wallet : null);
};
```

### File Structure

```
backend/
├── config/          # Configuration files
├── database/        # Database management
├── services/        # Business logic services
├── tests/           # Test files
└── index.js         # Main entry point

frontend/
├── app/             # Next.js app directory
│   ├── page.tsx     # Pages
│   └── globals.css  # Global styles
└── components/      # Reusable components
```

### Naming Conventions

**Files:**
- Use camelCase for JavaScript files: `gmailPoller.js`
- Use PascalCase for React components: `WalletCard.tsx`
- Use kebab-case for CSS files: `wallet-card.css`

**Variables:**
- Use camelCase: `userEmail`, `transactionId`
- Use UPPER_SNAKE_CASE for constants: `MAX_TX_AMOUNT`
- Use PascalCase for classes: `GmailPoller`

**Functions:**
- Use descriptive verb-noun format: `getUserWallet()`, `sendEmail()`
- Use `is/has` prefix for booleans: `isVerified()`, `hasWallet()`

### Comments

```javascript
// Good: Explain why, not what
// Use exponential backoff to avoid rate limiting
await sleep(Math.pow(2, retryCount) * 1000);

// Bad: Obvious comment
// Set x to 5
const x = 5;
```

### Error Handling

```javascript
// Good: Specific error handling
try {
  const result = await someOperation();
  return result;
} catch (err) {
  console.error('Operation failed:', err);
  throw new Error(`Failed to complete operation: ${err.message}`);
}

// Bad: Silent failure
try {
  await someOperation();
} catch (err) {
  // Do nothing
}
```

---

## Testing Guidelines

### Writing Tests

**Test Structure:**
```javascript
describe('Component/Function Name', () => {
  describe('method name', () => {
    test('should do something specific', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = functionUnderTest(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

**Test Coverage:**
- Aim for 80%+ code coverage
- Test happy paths
- Test error cases
- Test edge cases
- Test boundary conditions

**Running Tests:**
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

---

## Commit Message Guidelines

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat:** New feature
- **fix:** Bug fix
- **docs:** Documentation changes
- **style:** Code style changes (formatting, etc.)
- **refactor:** Code refactoring
- **test:** Adding or updating tests
- **chore:** Maintenance tasks

### Examples

```bash
# Feature
git commit -m "feat(wallet): add balance display"

# Bug fix
git commit -m "fix(parser): handle decimal amounts correctly"

# Documentation
git commit -m "docs(readme): update setup instructions"

# With body
git commit -m "feat(onboarding): add email verification

- Add OTP generation
- Send verification email
- Validate OTP on verification

Closes #123"
```

---

## Pull Request Guidelines

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added where needed
- [ ] Documentation updated
- [ ] No new warnings generated

## Screenshots
If applicable

## Related Issues
Closes #123
```

### Review Process

1. **Automated checks must pass:**
   - All tests passing
   - Linting passing
   - Build successful

2. **Code review:**
   - At least one approval required
   - Address all comments
   - Keep discussion professional

3. **Merge:**
   - Squash commits if needed
   - Update changelog
   - Delete branch after merge

---

## Documentation

### Code Documentation

```javascript
/**
 * Sends a PYUSD payment via email command
 * 
 * @param {string} senderEmail - Sender's email address
 * @param {string} recipientEmail - Recipient's email address
 * @param {number} amount - Amount in PYUSD
 * @returns {Promise<Object>} Transaction result with hash and status
 * @throws {Error} If validation fails or transaction cannot be processed
 */
async function sendPayment(senderEmail, recipientEmail, amount) {
  // Implementation
}
```

### README Updates

When adding features, update:
- Feature list
- Usage examples
- API documentation
- Configuration options

---

## Release Process

### Version Numbers

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR:** Breaking changes
- **MINOR:** New features (backward compatible)
- **PATCH:** Bug fixes

### Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] Git tag created
- [ ] Release notes written

---

## Project Structure

### Backend Architecture

```
backend/
├── config/
│   └── index.js              # Central configuration
├── database/
│   └── db.js                 # Database operations
├── services/
│   ├── gmailPoller.js        # Gmail integration
│   ├── intentParser.js       # Command parsing
│   ├── pkpWalletManager.js   # Wallet management
│   ├── policyBoundSigner.js  # Transaction signing
│   ├── broadcaster.js        # Blockchain interaction
│   ├── notifier.js           # Email notifications
│   └── transactionProcessor.js # Main orchestrator
├── tests/
│   └── *.test.js             # Test files
└── index.js                  # Entry point
```

### Frontend Architecture

```
frontend/
├── app/
│   ├── page.tsx              # Home page
│   ├── verify/page.tsx       # Verification page
│   ├── onboard/page.tsx      # Onboarding page
│   ├── wallet/page.tsx       # Wallet info page
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
└── components/               # Reusable components
```

---

## Getting Help

### Resources

- **Documentation:** README.md, ARCHITECTURE.md, SETUP_GUIDE.md
- **Issues:** Check existing issues on GitHub
- **Discussions:** Use GitHub Discussions for questions

### Contact

- **Email:** support@emailpay.example
- **GitHub:** Open an issue
- **Discord:** [Join our server] (if available)

---

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project README

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to EmailPay! 🎉
