/**
 * Check .env file configuration
 */

require('dotenv').config();

console.log('\n🔍 Checking .env Configuration\n');

const checks = [
  { name: 'GMAIL_CLIENT_ID', value: process.env.GMAIL_CLIENT_ID },
  { name: 'GMAIL_CLIENT_SECRET', value: process.env.GMAIL_CLIENT_SECRET },
  { name: 'GMAIL_USER', value: process.env.GMAIL_USER },
  { name: 'GMAIL_REFRESH_TOKEN', value: process.env.GMAIL_REFRESH_TOKEN }
];

let hasIssues = false;

checks.forEach(check => {
  const isPlaceholder = !check.value || 
                        check.value.includes('your_') || 
                        check.value.includes('YOUR_') ||
                        check.value.length < 10;
  
  if (isPlaceholder) {
    console.log(`❌ ${check.name}: NOT SET or using placeholder`);
    console.log(`   Current value: ${check.value || '(empty)'}`);
    hasIssues = true;
  } else {
    const preview = check.value.substring(0, 20) + '...';
    console.log(`✅ ${check.name}: ${preview}`);
  }
});

if (hasIssues) {
  console.log('\n⚠️  Please update your .env file with real values!\n');
  console.log('Example format:');
  console.log('GMAIL_CLIENT_ID=368339218833-r8rjop8laedfnd5gjbn65bi5403vovv3.apps.googleusercontent.com');
  console.log('GMAIL_CLIENT_SECRET=GOCSPX-abc123xyz...');
  console.log('GMAIL_USER=emailpay.demo@gmail.com');
  console.log('GMAIL_REFRESH_TOKEN=1//0gXXXXXXXXXXXXXXXXX...');
} else {
  console.log('\n✅ All required environment variables are set!\n');
}
