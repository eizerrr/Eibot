require('dotenv').config();
const { Client, NoAuth } = require('whatsapp-web.js');

async function generatePairingCode() {
    const client = new Client({
        authStrategy: new NoAuth(),
        puppeteer: {
            headless: true,
            executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        }
    });

    const phoneNumber = process.env.PHONE_NUMBER || '+6288228836758';
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');

    console.log('Requesting pairing code for:', cleanNumber);

    client.on('qr', async (qr) => {
        try {
            const code = await client.requestPairingCode(cleanNumber);
            console.log('');
            console.log('===============================================');
            console.log('YOUR 8-DIGIT PAIRING CODE:', code);
            console.log('===============================================');
            console.log('');
            console.log('Steps to use:');
            console.log('1. Open WhatsApp on your phone');
            console.log('2. Settings > Linked Devices');
            console.log('3. Link a Device > Link with phone number');
            console.log('4. Enter:', code);
            console.log('');
            process.exit(0);
        } catch (error) {
            console.log('Failed to generate pairing code:', error.message);
            process.exit(1);
        }
    });

    await client.initialize();
}

generatePairingCode().catch(console.error);