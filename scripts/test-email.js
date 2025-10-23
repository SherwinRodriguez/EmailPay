/**
 * Test email sending functionality
 */

require('dotenv').config();
const gmailPoller = require('../backend/services/gmailPoller');

async function testEmail() {
  console.log('\n📧 Testing Email Sending\n');
  
  try {
    // Initialize Gmail
    await gmailPoller.initialize();
    console.log('✓ Gmail initialized');
    
    // Test sending an email
    const testEmail = process.argv[2] || 'sherwin7rodriguez10@gmail.com';
    const subject = 'EmailPay Test - OTP Code';
    const body = `
Hello!

This is a test email from EmailPay.

Your verification code is: 123456

If you received this email, it means the email sending is working correctly!

---
EmailPay Test
    `.trim();
    
    console.log(`\nSending test email to: ${testEmail}`);
    await gmailPoller.sendEmail(testEmail, subject, body);
    console.log('✓ Email sent successfully!');
    console.log('\nCheck your inbox for the test email.');
    
  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error('\nFull error:', error);
  }
}

testEmail();
