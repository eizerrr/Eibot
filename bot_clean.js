require('dotenv').config();
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

// Import aesthetic menu system
const { CLEAN_COMMANDS, generateMainMenu, generateHelpMenu, generateCategoryHelp } = require('./menu_aesthetic');

// Import core handlers that work
const AIHandler = require('./handlers/aiHandler');
const StickerHandler = require('./handlers/stickerHandler');
const DownloadHandler = require('./handlers/downloadHandler');
const ToolsHandler = require('./handlers/toolsHandler');
const GroupHandler = require('./handlers/groupHandler');
const TextMakerHandler = require('./handlers/textMakerHandler');
const RandomHandler = require('./handlers/randomHandler');
const SearchHandler = require('./handlers/searchHandler');
const PremiumHandler = require('./handlers/premiumHandler');

const { initDatabase, getUserData, updateUserLimit } = require('./utils/database');
const { getTimeGreeting } = require('./utils/helpers');

class CleanWhatsAppBot {
    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth({
                clientId: "ei-bot-clean",
                dataPath: './.wwebjs_auth'
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor'
                ]
            }
        });

        // Initialize handlers
        this.aiHandler = new AIHandler();
        this.stickerHandler = new StickerHandler();
        this.downloadHandler = new DownloadHandler();
        this.toolsHandler = new ToolsHandler();
        this.groupHandler = new GroupHandler();
        this.textMakerHandler = new TextMakerHandler();
        this.randomHandler = new RandomHandler();
        this.searchHandler = new SearchHandler();
        this.premiumHandler = new PremiumHandler();

        this.setupEventHandlers();
        this.initializeBot();
    }

    async initializeBot() {
        try {
            console.log('🚀 Starting Clean EI Bot...');
            await initDatabase();
            console.log('✅ Database initialized');
            
            await this.client.initialize();
        } catch (error) {
            console.error('❌ Failed to start bot:', error.message);
        }
    }

    setupEventHandlers() {
        // QR Code for authentication
        this.client.on('qr', (qr) => {
            console.log('📱 Scan QR code untuk login:');
            qrcode.generate(qr, {small: true});
        });

        // Ready event
        this.client.on('ready', async () => {
            console.log('✅ Clean EI Bot is ready!');
            console.log(`📱 Bot Number: ${this.client.info.wid.user}`);
        });

        // Message handler
        this.client.on('message_create', async (message) => {
            try {
                await this.handleMessage(message);
            } catch (error) {
                console.error('❌ Error handling message:', error);
            }
        });
    }

    async handleMessage(message) {
        // Skip if from status broadcast
        if (message.from === 'status@broadcast') return;

        // Skip if not text message and no media
        if (!message.body && !message.hasMedia) return;

        const contact = await message.getContact();
        const chat = await message.getChat();

        // Skip if from bot itself
        if (contact.id._serialized === this.client.info.wid._serialized) return;

        // Check if message starts with command prefix
        if (!message.body.startsWith('.')) return;

        await this.processCommand(message, contact, chat);
    }

    async processCommand(message, contact, chat) {
        const args = message.body.slice(1).trim().split(' ');
        const command = args.shift().toLowerCase();

        console.log(`Processing command: ${command}`);

        try {
            // Check if command exists in our clean command list
            const allCommands = Object.values(CLEAN_COMMANDS).flat();
            if (!allCommands.includes(command) && !['menu', 'help'].includes(command)) {
                await message.reply('❌ Command tidak ditemukan!\n\nKetik .menu untuk melihat daftar command yang tersedia.');
                return;
            }

            // Handle core commands
            switch (command) {
                case 'menu':
                    const menuText = generateMainMenu(contact);
                    await message.reply(menuText, undefined, { mentions: [contact.id._serialized] });
                    break;

                case 'help':
                    if (args.length === 0) {
                        const helpText = generateHelpMenu();
                        await message.reply(helpText);
                    } else {
                        const categoryHelp = generateCategoryHelp(args[0]);
                        if (categoryHelp) {
                            await message.reply(categoryHelp);
                        } else {
                            await message.reply('❌ Kategori tidak ditemukan!\n\nKetik .help untuk melihat semua kategori yang tersedia.');
                        }
                    }
                    break;

                // AI Commands
                case 'ai':
                case 'openai':
                case 'aiimage':
                case 'bard':
                    await this.aiHandler.handleCommand(command, args, message, contact, chat, this.client);
                    break;

                // Sticker Commands
                case 'sticker':
                case 's':
                case 'toimg':
                case 'ttp':
                case 'attp':
                case 'brat':
                    await this.stickerHandler.handleCommand(command, args, message, contact, chat, this.client);
                    break;

                // Download Commands
                case 'ytmp3':
                case 'ytmp4':
                case 'tiktoknowm':
                case 'tt':
                    await this.downloadHandler.handleCommand(command, args, message, contact, chat, this.client);
                    break;

                // Tools Commands
                case 'translate':
                case 'qrcode':
                case 'tts':
                case 'shortlink':
                case 'ebase64':
                case 'dbase64':
                    await this.toolsHandler.handleCommand(command, args, message, contact, chat, this.client);
                    break;

                // Group Commands
                case 'hidetag':
                case 'tagall':
                case 'kick':
                case 'promote':
                case 'antilink':
                case 'groupinfo':
                case 'welcome':
                    await this.groupHandler.handleCommand(command, args, message, contact, chat, this.client);
                    break;

                // Text Maker Commands
                case 'thunder':
                case 'blackpink':
                case 'neonlight':
                case 'glow':
                case 'batman':
                case 'glitch':
                    await this.textMakerHandler.handleCommand(command, args, message, contact, chat, this.client);
                    break;

                // Random Commands
                case 'quotesanime':
                case 'pantun':
                case 'waifu':
                case 'neko':
                case 'apakah':
                case 'rate':
                    await this.randomHandler.handleCommand(command, args, message, contact, chat, this.client);
                    break;

                // Search Commands
                case 'google':
                case 'wikipedia':
                case 'ytsearch':
                case 'cuaca':
                    await this.searchHandler.handleCommand(command, args, message, contact, chat, this.client);
                    break;

                // Premium Commands
                case 'premium':
                case 'upgrade':
                case 'premiumstatus':
                    await this.premiumHandler.handleCommand(command, args, message, contact, chat, this.client);
                    break;

                // Info Commands
                case 'profile':
                    await this.showProfile(message, contact);
                    break;
                case 'ping':
                    const startTime = Date.now();
                    await message.reply('🏓 Pong!');
                    const endTime = Date.now();
                    await message.reply(`⚡ Latency: ${endTime - startTime}ms`);
                    break;
                case 'runtime':
                    const uptime = process.uptime();
                    const days = Math.floor(uptime / 86400);
                    const hours = Math.floor((uptime % 86400) / 3600);
                    const minutes = Math.floor((uptime % 3600) / 60);
                    const seconds = Math.floor(uptime % 60);
                    await message.reply(`⏱️ *Bot Runtime*\n${days}d ${hours}h ${minutes}m ${seconds}s`);
                    break;
                case 'owner':
                    await message.reply('👑 *Owner Bot*\n\nNama: EI Bot Developer\nKontak: +6281331143218\n\nBot ini dikembangkan untuk membantu aktivitas grup WhatsApp dengan berbagai fitur menarik!');
                    break;
                case 'limit':
                case 'balance':
                    const userData = await getUserData(contact.id._serialized);
                    await message.reply(`💰 *Status Akun*\n\nPoin: ${userData.points || 0}\nLimit: ${userData.limitUsed || 0}/${userData.limitTotal || 30}\nXP: ${userData.xp || 0}`);
                    break;

                default:
                    await message.reply('❌ Command tidak dikenali!\n\nKetik .menu untuk melihat daftar command yang tersedia.');
            }

        } catch (error) {
            console.error(`Error processing command ${command}:`, error);
            await message.reply('❌ Terjadi kesalahan saat memproses command. Silakan coba lagi.');
        }
    }

    async showProfile(message, contact) {
        const userData = await getUserData(contact.id._serialized);
        const isOwner = contact.id._serialized === '6281331143218@c.us';
        
        let status = isOwner ? 'VVIP 👑' : (userData.isPremium ? 'VIP 👑' : '🆓 Free');
        let limitText = isOwner || userData.isPremium ? 'Unlimited ♾️' : `${userData.limitUsed || 0}/${userData.limitTotal || 30}`;
        
        const profileText = `╔══════════════════════════════════════╗
║               👤 PROFIL USER             ║
╚══════════════════════════════════════╝

🆔 **Info Dasar**
   • Nama: ${contact.pushname || 'Tidak diset'}
   • Nomor: ${contact.number}
   • Status: ${status}

📊 **Statistik**
   • Level: ${userData.level || 'Warrior'}
   • XP: ${userData.xp || 0}
   • Poin: ${userData.points || 0}
   • Limit: ${limitText}

📅 **Riwayat**
   • Bergabung: ${new Date(userData.joinDate || Date.now()).toLocaleDateString('id-ID')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ Terima kasih telah menggunakan EI Bot!`;

        await message.reply(profileText);
    }

    async start() {
        // Start the bot
    }
}

// Start the clean bot
const bot = new CleanWhatsAppBot();
bot.start();

module.exports = CleanWhatsAppBot;