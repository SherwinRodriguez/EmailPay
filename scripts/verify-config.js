/**
 * Verify complete .env configuration for EmailPay
 */

require('dotenv').config();

console.log('\n✅ EmailPay Configuration Verification\n');

const config = {
  'Ethereum Network': {
    'SEPOLIA_RPC': process.env.SEPOLIA_RPC,
    'CHAIN_ID': process.env.CHAIN_ID,
    'PYUSD_ADDRESS': process.env.PYUSD_ADDRESS
  },
  'Gmail API': {
    'GMAIL_CLIENT_ID': process.env.GMAIL_CLIENT_ID,
    'GMAIL_CLIENT_SECRET': process.env.GMAIL_CLIENT_SECRET,
    'GMAIL_REFRESH_TOKEN': process.env.GMAIL_REFRESH_TOKEN,
    'GMAIL_USER': process.env.GMAIL_USER,
    'GMAIL_POLL_QUERY': process.env.GMAIL_POLL_QUERY
  },
  'Lit Protocol': {
    'LIT_NETWORK': process.env.LIT_NETWORK,
    'LIT_ACTION_IPFS_CID': process.env.LIT_ACTION_IPFS_CID
  },
  'Transaction Policies': {
    'MAX_TX_AMOUNT': process.env.MAX_TX_AMOUNT,
    'DAILY_TX_CAP': process.env.DAILY_TX_CAP,
    'TX_EXPIRY_MINUTES': process.env.TX_EXPIRY_MINUTES
  },
  'Server': {
    'PORT': process.env.PORT,
    'FRONTEND_URL': process.env.FRONTEND_URL
  }
};

let allGood = true;
let warnings = [];

Object.entries(config).forEach(([section, vars]) => {
  console.log(`📦 ${section}:`);
  Object.entries(vars).forEach(([key, value]) => {
    const isPlaceholder = !value || 
                          value.includes('your_') || 
                          value.includes('YOUR_') ||
                          value.includes('PLACEHOLDER');
    
    if (isPlaceholder) {
      console.log(`   ❌ ${key}: NOT SET`);
      allGood = false;
    } else if (value.length > 50) {
      console.log(`   ✅ ${key}: ${value.substring(0, 30)}...`);
    } else {
      console.log(`   ✅ ${key}: ${value}`);
    }
  });
  console.log('');
});

// Additional validations
if (process.env.CHAIN_ID !== '11155111') {
  warnings.push('⚠️  CHAIN_ID should be 11155111 for Sepolia');
}

if (process.env.LIT_NETWORK !== 'datil-dev') {
  warnings.push('⚠️  LIT_NETWORK should be "datil-dev" for testnet');
}

if (warnings.length > 0) {
  console.log('⚠️  Warnings:\n');
  warnings.forEach(w => console.log(`   ${w}`));
  console.log('');
}

if (allGood) {
  console.log('🎉 All configuration complete! Ready to run EmailPay!\n');
  console.log('Next steps:');
  console.log('   1. npm run dev          # Start both backend and frontend');
  console.log('   2. Open http://localhost:3000 in your browser');
  console.log('   3. Create your first wallet!\n');
} else {
  console.log('❌ Please complete the missing configuration in your .env file\n');
}
