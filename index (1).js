const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const config = require('./config/config');
const database = require('./utils/database');
const helpers = require('./utils/helpers');
const fs = require('fs');
const path = require('path');

// Import handlers
const aiHandler = require('./handlers/aiHandler');
const stickerHandler = require('./handlers/stickerHandler');
const downloadHandler = require('./handlers/downloadHandler');
const utilityHandler = require('./handlers/utilityHandler');
const groupHandler = require('./handlers/groupHandler');
const textMakerHandler = require('./handlers/textMakerHandler');
const funHandler = require('./handlers/funHandler');
const searchHandler = require('./handlers/searchHandler');
const mediaHandler = require('./handlers/mediaHandler');
const premiumHandler = require('./handlers/premiumHandler');
const profileHandler = require('./handlers/profileHandler');

// Import utilities
const scheduler = require('./utils/scheduler');

// Premium management functions
function loadPremiumUsers() {
    try {
        const premiumPath = path.join(__dirname, 'data', 'premium.json');
        if (fs.existsSync(premiumPath)) {
            const data = fs.readFileSync(premiumPath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading premium users:', error);
    }
    return { users: [], settings: { autoUpdate: true, lastUpdate: null } };
}

function savePremiumUsers(data) {
    try {
        const premiumPath = path.join(__dirname, 'data', 'premium.json');
        fs.writeFileSync(premiumPath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving premium users:', error);
        return false;
    }
}

function isPremiumUser(userId) {
    const premiumData = loadPremiumUsers();
    return premiumData.users.includes(userId);
}

// Auto-update function
async function autoUpdate() {
    const premiumData = loadPremiumUsers();
    if (premiumData.settings.autoUpdate) {
        premiumData.settings.lastUpdate = new Date().toISOString();
        savePremiumUsers(premiumData);
        console.log('✅ Auto-update completed');
    }
}

class EiBot {
    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth(),
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
                    '--disable-features=VizDisplayCompositor',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding',
                    '--disable-extensions',
                    '--disable-plugins',
                    '--disable-default-apps'
                ],
                timeout: 60000
            }
        });

        this.qrTimer = null;
        this.isReady = false;
        this.startTime = Date.now();
        this.ownerNumber = config.OWNER_NUMBER;

        this.setupEventListeners();
        this.initializeDatabase();
    }

    async initializeDatabase() {
        try {
            await database.init();
            console.log('🗄️ Database initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize database:', error);
        }
    }

    setupEventListeners() {
        // QR Code generation
        this.client.on('qr', (qr) => {
            console.log('🔍 QR Code received, scan with your phone:');
            qrcode.generate(qr, { small: true });

            // Auto refresh QR every 30 seconds
            if (this.qrTimer) clearTimeout(this.qrTimer);
            this.qrTimer = setTimeout(() => {
                if (!this.isReady) {
                    console.log('🔄 Refreshing QR code...');
                    this.client.destroy();
                    setTimeout(() => this.client.initialize(), 2000);
                }
            }, 30000);
        });

        // Client ready
        this.client.on('ready', () => {
            console.log('✅ EI BOT is ready!');
            console.log(`🤖 Bot Name: ${config.BOT_NAME}`);
            console.log(`👑 Owner: ${config.OWNER_NUMBER}`);
            console.log('🚀 All systems operational!');
            this.isReady = true;
            if (this.qrTimer) {
                clearTimeout(this.qrTimer);
                this.qrTimer = null;
            }

            // Auto-update on ready
            autoUpdate();
        });

        // Authentication success
        this.client.on('authenticated', () => {
            console.log('🔐 Authentication successful');
        });

        // Authentication failure
        this.client.on('auth_failure', (msg) => {
            console.error('❌ Authentication failed:', msg);
            this.isReady = false;
        });

        // Disconnected
        this.client.on('disconnected', (reason) => {
            console.log('🔌 Client was logged out:', reason);
            this.isReady = false;
            // Auto reconnect after 5 seconds
            setTimeout(() => this.client.initialize(), 5000);
        });

        // Group join event with photo
        this.client.on('group_join', async (notification) => {
            try {
                await this.handleGroupJoin(notification);
            } catch (error) {
                console.error('❌ Error handling group join:', error);
            }
        });

        // Group leave event
        this.client.on('group_leave', async (notification) => {
            try {
                await this.handleGroupLeave(notification);
            } catch (error) {
                console.error('❌ Error handling group leave:', error);
            }
        });

        // Message handling
        this.client.on('message', async (message) => {
            try {
                await this.handleMessage(message);
            } catch (error) {
                console.error('❌ Error handling message:', error);
                // Don't send error message to avoid spam
            }
        });
    }

    async handleMessage(message) {
        // Ignore if message is from bot itself
        if (message.fromMe) return;

        const chat = await message.getChat();
        const contact = await message.getContact();
        const userId = contact.id._serialized;
        const isGroup = chat.isGroup;
        const messageBody = message.body.toLowerCase().trim();

        // Initialize user if not exists
        await database.initUser(userId, contact.pushname || contact.name || 'Unknown');

        // Check AFK status first
        await this.checkAFK(message, userId, isGroup);

        // Check if group is muted for non-admin users
        if (isGroup) {
            const isMuted = await database.isGroupMuted(chat.id._serialized);
            if (isMuted) {
                const participants = await chat.participants;
                const userParticipant = participants.find(p => p.id._serialized === userId);
                const isAdmin = userParticipant && userParticipant.isAdmin;
                const isOwner = userId.includes(config.OWNER_NUMBER);

                if (!isAdmin && !isOwner) {
                    return; // Ignore messages from non-admin users in muted groups
                }
            }
        }

        // Handle basic greetings
        if (messageBody === 'ei' || messageBody === 'bot') {
            await message.reply('Haii aku ei!! 🤖\nAda apa? Ketik *.menu* untuk melihat commands!');
            return;
        }

        // Check if message starts with command prefix
        if (!messageBody.startsWith('.')) return;

        const args = messageBody.split(' ');
        const command = args[0].slice(1).toLowerCase();
        const params = args.slice(1);

        // Free commands that don't consume limit
        const freeCommands = ['profile', 'limit', 'sewa', 'afk', 'ai', 'menu', 'help', 'owner', 'ping', 'ceksewa'];

        // Check user limits (except for free commands and premium users)
        if (!freeCommands.includes(command)) {
            const hasLimit = await this.checkUserLimit(userId);
            if (!hasLimit) {
                await message.reply('⚠️ Limit harian Anda sudah habis! Upgrade ke premium untuk unlimited access atau tunggu reset limit besok pukul 05:05.\n\nKetik *.sewa* untuk info premium!');
                return;
            }
        }

        // Route commands to appropriate handlers
        await this.routeCommand(message, command, params, chat, contact);

        // Update user stats (except for free commands)
        if (!freeCommands.includes(command)) {
            await database.addXP(userId, config.XP_PER_COMMAND);
            await database.consumeLimit(userId);
        }
    }

    async checkUserLimit(userId) {
        try {
            // Owner has unlimited access (VVIP)
            if (userId === config.OWNER_NUMBER || userId.includes(config.OWNER_NUMBER.replace('@c.us', ''))) return true;

            const user = await database.getUser(userId);
            if (!user) return false;

            // Premium users have unlimited access
            if (isPremiumUser(userId)) return true;

            // Check daily limit
            return user.dailyLimit > 0;
        } catch (error) {
            console.error('Limit check error:', error);
            return false;
        }
    }

    async routeCommand(message, command, params, chat, contact) {
        const isGroup = chat.isGroup;
        const userId = contact.id._serialized;

        try {
            // Handle view once images for .hd and .s commands
            if ((command === 'hd' || command === 's') && message.hasQuotedMsg) {
                const quotedMsg = await message.getQuotedMessage();
                if (quotedMsg.type === 'image' && quotedMsg.isViewOnce) {
                    const media = await quotedMsg.downloadMedia();
                    if (command === 'hd') {
                        await utilityHandler.handleHD(this.client, message, media);
                    } else if (command === 's') {
                        await stickerHandler.handleSticker(this.client, message, media);
                    }
                    return;
                }
            }

            // AI Assistant commands
            if (['ai', 'aiimage', 'bard', 'nexara', 'convertanime'].includes(command)) {
                await aiHandler.handle(this.client, message, command, params);
            }

            // Sticker commands
            else if (['s', 'sticker', 'ttp', 'attp', 'brat', 'toimg', 'takesticker', 'circlesticker', 'emojisticker', 'stickerinfo', 'setwm'].includes(command)) {
                await stickerHandler.handle(this.client, message, command, params);
            }

            // Download commands
            else if (['ytmp3', 'ytmp4', 'play', 'tt', 'tiktok', 'ig', 'instagram', 'fb', 'facebook', 'twitter', 'mediafire', 'pin', 'pinterest'].includes(command)) {
                await downloadHandler.handle(this.client, message, command, params);
            }

            // Utility commands
            else if (['translate', 'qrcode', 'readqr', 'tts', 'shortlink', 'base64encode', 'base64decode', 'hexencode', 'hexdecode', 'screenshot', 'blur', 'hd'].includes(command)) {
                await utilityHandler.handle(this.client, message, command, params);
            }

            // Group control commands
            else if (['hidetag', 'h', 'tagall', 'promote', 'kick', 'demote', 'antilink', 'mute', 'unmute', 'groupinfo', 'listadmin', 'revoke', 'setdesc', 'setname', 'welcome', 'goodbye', 'testwelcome', 'afk', 'warn', 'delwarn', 'blacklist', 'delblacklist', 'banmember', 'unbanmember', 'setwelcome', 'd', 'delete'].includes(command)) {
                if (isGroup) {
                    await groupHandler.handle(this.client, message, command, params, chat);
                } else {
                    await message.reply('❌ Command ini hanya bisa digunakan di grup!');
                }
            }

            // Text maker commands
            else if (['thunder', 'neonlight', 'blackpink', 'batman', 'glow', 'glitch', 'greenneon', 'lightglow', 'bear', 'cloud', 'sand', 'magma', 'window', 'sky', 'pencil', 'cartoon', 'spacetxt', 'bokeh', 'firework', 'holo', 'naruto', 'thor', 'wolf', 'avengers', 'marvel', 'halloween', 'graffiti'].includes(command)) {
                await textMakerHandler.handle(this.client, message, command, params);
            }

            // Fun commands
            else if (['quotesanime', 'pantun', 'waifu', 'neko', 'loli', 'husbando', 'apakah', 'kapan', 'siapa', 'rate', 'jodohku', 'randomnumber', 'randomtag', 'randomfact', 'poem', 'wisdom', 'meme', 'couple', 'alay'].includes(command)) {
                await funHandler.handle(this.client, message, command, params, chat);
            }

            // Search commands
            else if (['google', 'wikipedia', 'ytsearch', 'cuaca', 'lyrics', 'jadwalsholat', 'artinama', 'checkip', 'checkml', 'checkff'].includes(command)) {
                await searchHandler.handle(this.client, message, command, params);
            }

            // Media tools commands
            else if (['resize', 'compress', 'enhance', 'filter', 'mediainfo', 'crop', 'rotate', 'flip', 'watermark', 'removebg', 'thumbnail'].includes(command)) {
                await mediaHandler.handle(this.client, message, command, params);
            }

            // Premium commands
            else if (['premium', 'upgrade', 'gift', 'premiumlist', 'features', 'usage', 'subscription', 'sewa', 'ceksewa'].includes(command)) {
                await premiumHandler.handle(this.client, message, command, params, contact);
            }

            // Profile commands
            else if (['profile', 'limit', 'ping', 'runtime', 'owner', 'help', 'menu'].includes(command)) {
                await profileHandler.handle(this.client, message, command, params, contact, this.startTime);
            }

            // Unknown command - ignore to avoid spam

        } catch (error) {
            console.error(`❌ Error handling command ${command}:`, error);
            // Don't send error message to avoid spam
        }
    }

    async checkAFK(message, userId, isGroup) {
        try {
            const afkData = await database.getAFK(userId);

            // If user is AFK and sends a message, remove AFK status
            if (afkData) {
                const afkDuration = helpers.formatDuration(Date.now() - afkData.timestamp);
                await database.removeAFK(userId);
                const contact = await message.getContact();
                await message.reply(`😻 Yey, @${contact.number} kembali dari afk\n\n📝 Reason: ${afkData.reason}\n⏰ Sejak: ${afkDuration}`, {
                    mentions: [userId]
                });
                return;
            }

            // Check if someone mentioned an AFK user in group
            if (isGroup && message.mentionedIds && message.mentionedIds.length > 0) {
                for (const mentionedId of message.mentionedIds) {
                    const mentionedAFK = await database.getAFK(mentionedId);
                    if (mentionedAFK) {
                        const afkDuration = helpers.formatDuration(Date.now() - mentionedAFK.timestamp);
                        const mentionedContact = await this.client.getContactById(mentionedId);
                        await message.reply(`😡 @${mentionedContact.number} sedang afk!\n\n📝 Reason: ${mentionedAFK.reason}\n⏰ Durasi: ${afkDuration}`, {
                            mentions: [mentionedId]
                        });
                    }
                }
            }
        } catch (error) {
            console.error('AFK check error:', error);
        }
    }

    async handleGroupJoin(notification) {
        try {
            const chat = await notification.getChat();
            const groupSettings = await database.getGroupSettings(chat.id._serialized);

            if (groupSettings.welcomeEnabled) {
                const contact = await this.client.getContactById(notification.id.participant);

                // Get profile picture
                let profilePic = null;
                try {
                    profilePic = await contact.getProfilePicUrl();
                } catch (error) {
                    console.log('No profile picture found');
                }

                const welcomeMessage = `╔══════ ≪ •❈• ≫ ══════╗
🌸 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 𝐍𝐄𝐖 𝐌𝐄𝐌𝐁𝐄𝐑 🌸
╚══════ ≪ •❈• ≫ ══════╝

Haii @${contact.number}
Selamat datang di grup! 🎮💫

Silakan perkenalkan diri dan jangan lupa baca rules grup ya! 😊`;

                if (profilePic) {
                    const media = await MessageMedia.fromUrl(profilePic);
                    await chat.sendMessage(media, {
                        caption: welcomeMessage,
                        mentions: [contact]
                    });
                } else {
                    await chat.sendMessage(welcomeMessage, {
                        mentions: [contact]
                    });
                }
            }
        } catch (error) {
            console.error('Group join error:', error);
        }
    }

    async handleGroupLeave(notification) {
        try {
            const chat = await notification.getChat();
            const groupSettings = await database.getGroupSettings(chat.id._serialized);

            if (groupSettings.goodbyeEnabled) {
                const contact = await this.client.getContactById(notification.id.participant);
                const goodbyeMessage = `👋 Selamat tinggal @${contact.number}!\nSemoga sukses selalu! 🌟`;

                await chat.sendMessage(goodbyeMessage, { mentions: [contact] });
            }
        } catch (error) {
            console.error('Group leave error:', error);
        }
    }

    async start() {
        console.log('🚀 Starting EI BOT...');
        console.log('📱 Initializing WhatsApp Web...');
        await this.client.initialize();

        // Auto-update on start
        await autoUpdate();
    }

    async stop() {
        console.log('🛑 Stopping EI BOT...');
        if (this.qrTimer) {
            clearTimeout(this.qrTimer);
        }
        await this.client.destroy();
    }
}

// Start the bot
const bot = new EiBot();
bot.start().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    await bot.stop();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    await bot.stop();
    process.exit(0);
});

module.exports = EiBot;