const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter your phone number (with country code, e.g. +1234567890): ', (phoneNumber) => {
  // Clean the phone number
  const cleanNumber = phoneNumber.replace(/\s+/g, '').replace(/[^\d+]/g, '');
  
  // Save to environment
  const envContent = `PHONE_NUMBER=${cleanNumber}\n`;
  fs.writeFileSync('.env', envContent);
  
  console.log(`Phone number saved: ${cleanNumber}`);
  console.log('Restarting bot to generate pairing code...');
  
  rl.close();
  process.exit(0);
});