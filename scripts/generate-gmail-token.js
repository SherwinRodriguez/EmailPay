/**
 * Gmail OAuth Token Generator
 * Run this script to generate your GMAIL_REFRESH_TOKEN
 * 
 * Usage: node scripts/generate-gmail-token.js
 */

require('dotenv').config();
const { google } = require('googleapis');
const readline = require('readline');

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'http://localhost:3001/oauth/callback'
);

// Gmail API scopes needed
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify'
];

console.log('\n🔐 Gmail OAuth Token Generator\n');
console.log('Follow these steps:\n');

// Step 1: Generate authorization URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent' // Force to get refresh token
});

console.log('1. Open this URL in your browser:\n');
console.log(authUrl);
console.log('\n2. Authorize the application');
console.log('3. Copy the authorization code from the URL (after "code=")\n');

// Step 2: Get the code from user
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('4. Paste the authorization code here: ', async (code) => {
  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('\n✅ Success! Your tokens:\n');
    console.log('GMAIL_REFRESH_TOKEN=' + tokens.refresh_token);
    console.log('\n📝 Copy the refresh token above to your .env file\n');
    
    if (tokens.access_token) {
      console.log('Access token (expires):', tokens.access_token.substring(0, 20) + '...');
    }
    
  } catch (error) {
    console.error('\n❌ Error getting tokens:', error.message);
    console.log('\nMake sure:');
    console.log('- Your Client ID and Secret are correct in .env');
    console.log('- You copied the FULL authorization code');
    console.log('- The redirect URI matches: http://localhost:3001/oauth/callback');
  } finally {
    rl.close();
  }
});
