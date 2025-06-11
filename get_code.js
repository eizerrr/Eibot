require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth({ clientId: "pairing-bot" }),
    puppeteer: {
        headless: true,
        executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    }
});

const phoneNumber = '+6288228836758';

console.log('Attempting to generate pairing code for:', phoneNumber);

client.on('qr', async () => {
    console.log('QR event triggered, requesting pairing code...');
    
    try {
        const pairingCode = await client.requestPairingCode(phoneNumber.replace(/[^\d+]/g, ''));
        console.log('\n========================================');
        console.log('8-DIGIT PAIRING CODE:', pairingCode);
        console.log('========================================\n');
        console.log('Enter this code in WhatsApp:');
        console.log('Settings > Linked Devices > Link with phone number');
        console.log('\nCode:', pairingCode);
        
        setTimeout(() => process.exit(0), 2000);
    } catch (error) {
        console.log('Pairing code generation failed. WhatsApp may not support pairing codes for your region or account type.');
        console.log('Please use the QR code method instead by scanning the code displayed in the main bot.');
        process.exit(1);
    }
});

client.on('ready', () => {
    console.log('Client ready but should have generated pairing code first');
    process.exit(0);
});

client.on('auth_failure', () => {
    console.log('Authentication failed');
    process.exit(1);
});

setTimeout(() => {
    console.log('Timeout reached. Pairing code generation may not be available.');
    console.log('Please use the QR code method shown in the main bot console.');
    process.exit(1);
}, 15000);

client.initialize();