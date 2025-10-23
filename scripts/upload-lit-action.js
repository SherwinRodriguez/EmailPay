/**
 * Upload Lit Action to IPFS using Pinata
 * 
 * Usage: node scripts/upload-lit-action.js
 * 
 * You'll need a free Pinata account: https://pinata.cloud/
 * Get your API key from: https://app.pinata.cloud/keys
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Check for Pinata credentials
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;

console.log('\n🔥 Lit Action IPFS Uploader\n');

if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
  console.log('⚠️  Pinata credentials not found in environment variables.\n');
  console.log('📋 Setup Instructions:\n');
  console.log('1. Create a free account at: https://pinata.cloud/');
  console.log('2. Go to: https://app.pinata.cloud/keys');
  console.log('3. Create a new API key with "pinFileToIPFS" permission');
  console.log('4. Add to your .env file:');
  console.log('   PINATA_API_KEY=your_api_key_here');
  console.log('   PINATA_SECRET_KEY=your_secret_key_here\n');
  console.log('5. Run this script again\n');
  
  // Alternative: Manual upload instructions
  console.log('🔄 Alternative: Manual Upload\n');
  console.log('1. Go to: https://app.pinata.cloud/pinmanager');
  console.log('2. Click "Upload" → "File"');
  console.log('3. Upload: lit-actions/emailpay-signing-policy.js');
  console.log('4. Copy the CID (starts with "Qm..." or "bafy...")');
  console.log('5. Add to .env: LIT_ACTION_IPFS_CID=<your_cid>\n');
  
  process.exit(1);
}

// Read the Lit Action file
const litActionPath = path.join(__dirname, '../lit-actions/emailpay-signing-policy.js');
const litActionCode = fs.readFileSync(litActionPath, 'utf8');

console.log('📄 Lit Action file loaded');
console.log(`   Size: ${litActionCode.length} bytes\n`);

// Prepare the upload
const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
const metadata = JSON.stringify({
  name: 'emailpay-signing-policy.js',
  keyvalues: {
    project: 'EmailPay',
    type: 'lit-action',
    version: '1.0.0'
  }
});

const body = [
  `--${boundary}`,
  'Content-Disposition: form-data; name="file"; filename="emailpay-signing-policy.js"',
  'Content-Type: application/javascript',
  '',
  litActionCode,
  `--${boundary}`,
  'Content-Disposition: form-data; name="pinataMetadata"',
  '',
  metadata,
  `--${boundary}--`
].join('\r\n');

const options = {
  hostname: 'api.pinata.cloud',
  path: '/pinning/pinFileToIPFS',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': Buffer.byteLength(body),
    'pinata_api_key': PINATA_API_KEY,
    'pinata_secret_api_key': PINATA_SECRET_KEY
  }
};

console.log('📤 Uploading to IPFS via Pinata...\n');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (response.IpfsHash) {
        console.log('✅ Upload successful!\n');
        console.log('📍 IPFS CID:', response.IpfsHash);
        console.log('🔗 IPFS Gateway URL:', `https://gateway.pinata.cloud/ipfs/${response.IpfsHash}`);
        console.log('🔗 Public Gateway:', `https://ipfs.io/ipfs/${response.IpfsHash}\n`);
        console.log('📝 Add this to your .env file:');
        console.log(`   LIT_ACTION_IPFS_CID=${response.IpfsHash}\n`);
        
        // Optionally update .env file automatically
        console.log('💡 Tip: You can now use this CID in your Lit Protocol integration!\n');
      } else {
        console.error('❌ Upload failed:', data);
      }
    } catch (error) {
      console.error('❌ Error parsing response:', error.message);
      console.error('Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Upload error:', error.message);
});

req.write(body);
req.end();
