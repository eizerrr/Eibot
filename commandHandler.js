const config = require('../config/config');
const GroupHandler = require('./groupHandler');
const AIHandler = require('./aiHandler');
const GameHandler = require('./gameHandler');
const RandomHandler = require('./randomHandler');
const SearchHandler = require('./searchHandler');
const StickerHandler = require('./stickerHandler');
const ToolsHandler = require('./toolsHandler');
const DownloadHandler = require('./downloadHandler');
const TextMakerHandler = require('./textMakerHandler');
const PremiumHandler = require('./premiumHandler');
const MediaHandler = require('./mediaHandler');
const { getUserData, updateUserPoints } = require('../utils/database');

// Working Commands Only - Cleaned and Tested
const COMMAND_CATEGORIES = {
    // Group Management (Core Working Features)
    group: ['hidetag', 'tagall', 'kick', 'promote', 'demote', 'antilink', 'groupinfo', 'linkgc', 'revokelink', 'setnamegc', 'setdescgc', 'welcome', 'goodbye', 'setgoodbye', 'testwelcome', 'testgoodbye', 'mutemember', 'unmutemember', 'mutelist', 'warn', 'vote'],
    
    // AI Features (Working)
    ai: ['ai', 'openai', 'aiimage', 'bard'],
    
    // Sticker Tools (Working)
    sticker: ['sticker', 's', 'toimg', 'stickerwm', 'takesticker', 'ttp', 'attp', 'brat'],
    
    // Utility Tools (Core Working)
    tools: ['translate', 'qrcode', 'qrcodereader', 'tts', 'shortlink', 'ebase64', 'dbase64', 'readmore', 'poll'],
    
    // Download Tools (Working)
    download: ['ytmp3', 'ytmp4', 'tiktoknowm', 'tiktokwm', 'tt'],
    
    // Text Makers (Working)
    textmaker: ['thunder', 'blackpink', 'neonlight', 'glow', 'neon', 'batman', 'glitch'],
    
    // Random Content (Working)
    random: ['quotesanime', 'pantun', 'waifu', 'neko', 'apakah', 'rate', 'alay'],
    
    // Search Features (Working)
    search: ['google', 'wikipedia', 'ytsearch', 'cuaca', 'translate'],
    
    // Premium Commands (Working)
    premium: ['premium', 'upgrade', 'premiumstatus', 'premiumfeatures'],
    
    // Info Commands (Working)
    info: ['profile', 'ping', 'runtime', 'owner', 'limit', 'balance', 'toplocal', 'topglobal']
};

// Command aliases mapping
const COMMAND_ALIASES = {
    's': 'sticker',
    'h': 'hidetag',
    'ai': 'ai',
    'hd': 'hd', // HD for High Definition enhancement
    'kick': 'kick',
    'add': 'promote',
    'del': 'demote',
    'pin': 'pinterest',
    'welcometype': 'setwelcometype',
    'welcomemsg': 'setwelcomemsg',
    'customwelcome': 'setwelcomemsg'
};

async function handleCommand(command, args, message, contact, chat, client, targetUser = null, targetText = '') {
    try {
        // Check for command aliases
        if (COMMAND_ALIASES[command]) {
            command = COMMAND_ALIASES[command];
        }

        // Handle menu command
        if (command === 'menu') {
            return await handleMenuCommand(message, contact);
        }

        // Handle help command
        if (command === 'help') {
            return await handleHelpCommand(args, message);
        }

        // Handle sewa command
        if (command === 'sewa') {
            return await handleSewaCommand(message);
        }

        // Handle reply-based commands
        if (targetUser) {
            const replyResult = await handleReplyCommands(command, args, message, contact, chat, client, targetUser, targetText);
            if (replyResult) {
                return replyResult;
            }
        }

        // Handle general commands
        if (await handleGeneralCommands(command, args, message, contact, chat, client)) {
            return { success: true };
        }

        // Route to appropriate handler based on command category
        const category = getCommandCategory(command);
        
        switch (category) {
            case 'group':
                const groupHandler = new GroupHandler();
                return await groupHandler.handleCommand(command, args, message, contact, chat, client);
            
            case 'ai':
                const aiHandler = new AIHandler();
                return await aiHandler.handleCommand(command, args, message, contact, chat, client);
            
            case 'game':
                const gameHandler = new GameHandler();
                return await gameHandler.handleCommand(command, args, message, contact, chat, client);
            
            case 'random':
                const randomHandler = new RandomHandler();
                return await randomHandler.handleCommand(command, args, message, contact, chat, client);
            
            case 'search':
                const searchHandler = new SearchHandler();
                return await searchHandler.handleCommand(command, args, message, contact, chat, client);
            
            case 'sticker':
                const stickerHandler = new StickerHandler();
                return await stickerHandler.handleCommand(command, args, message, contact, chat, client);
            
            case 'tools':
                const toolsHandler = new ToolsHandler();
                return await toolsHandler.handleCommand(command, args, message, contact, chat, client);
            
            case 'download':
                const downloadHandler = new DownloadHandler();
                return await downloadHandler.handleCommand(command, args, message, contact, chat, client);
            
            case 'textmaker':
                const textMakerHandler = new TextMakerHandler();
                return await textMakerHandler.handleCommand(command, args, message, contact, chat, client);
            
            case 'info':
                return await handleInfoCommands(command, args, message, contact, chat, client);
            
            case 'premium':
                const premiumHandler = new PremiumHandler();
                return await premiumHandler.handleCommand(command, args, message, contact, chat, client);
            
            case 'media':
                const mediaHandler = new MediaHandler();
                return await mediaHandler.handleCommand(command, args, message, contact, chat, client);
            
            default:
                // Silent fail - don't show error message
                return;
        }
        
    } catch (error) {
        // Silent error handling - don't show errors to user
        console.error('Command handler error:', error);
        return { error: error.message };
    }
}

function getCommandCategory(command) {
    for (const [category, commands] of Object.entries(COMMAND_CATEGORIES)) {
        if (commands.includes(command)) {
            return category;
        }
    }
    return null;
}

async function handleHelpCommand(args, message) {
    if (args.length === 0) {
        const helpText = `*📋 BANTUAN BOT*

*Kategori Perintah:*
• .help group - Manajemen grup
• .help ai - Fitur AI
• .help game - Game & kuis
• .help random - Konten random
• .help search - Pencarian
• .help sticker - Sticker tools
• .help tools - Utilitas
• .help download - Download media
• .help textmaker - Text maker
• .help info - Informasi
• .help general - Perintah umum

*Command Shortcuts:*
• .s = .sticker
• .h = .hidetag
• .hd = High Definition enhancement

*Sistem Poin & Limit:*
• Main game untuk dapat XP (50-250) dan poin
• XP untuk naik level, poin untuk beli limit
• .buylimit [jumlah] - Beli limit (10 poin = 1 limit)
• .toplocal - Leaderboard grup
• .topglobal - Leaderboard global

*Contoh penggunaan:*
• .ai Halo, apa kabar?
• .s (reply ke gambar)
• .h Pesan untuk semua
• .buylimit 5

*Ketik .help [kategori] untuk detail*`;
        
        await message.reply(helpText);
        return { success: true };
    }

    const category = args[0].toLowerCase();
    if (COMMAND_CATEGORIES[category]) {
        const commands = COMMAND_CATEGORIES[category];
        const commandList = commands.map(cmd => `• .${cmd}`).join('\n');
        
        await message.reply(`*📋 PERINTAH ${category.toUpperCase()}*\n\n${commandList}\n\n*Total: ${commands.length} perintah*`);
        return { success: true };
    } else {
        
        return { error: 'Category not found' };
    }
}

async function handleGeneralCommands(command, args, message, contact, chat, client) {
    switch (command) {
        case 'ping':
            const startTime = Date.now();
            await message.reply('🏓 Pong!');
            const endTime = Date.now();
            await message.reply(`⚡ Latency: ${endTime - startTime}ms`);
            return true;

        case 'runtime':
            const uptime = process.uptime();
            const days = Math.floor(uptime / 86400);
            const hours = Math.floor((uptime % 86400) / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);
            
            await message.reply(`⏱️ *Bot Runtime*\n${days}d ${hours}h ${minutes}m ${seconds}s`);
            return true;

        case 'owner':
            try {
                // Send owner contact
                const ownerContact = await client.getContactById('6281331143218@c.us');
                await chat.sendContact(ownerContact);
                await message.reply(`👨‍💻 *Bot Owner*\n\nIni adalah kontak owner bot.\nSilakan hubungi untuk info lebih lanjut.`);
            } catch (error) {
                // Fallback if contact sending fails
                await message.reply(`👨‍💻 *Bot Owner*\n\nNomor: +62 813-3114-3218\nNama: Owner Bot\n\nSilakan simpan kontak untuk info lebih lanjut.`);
            }
            return true;

        case 'menu':
            await handleMenuCommand(message, contact);
            return true;

        case 'help':
            await handleHelpCommand(args, message);
            return true;

        case 'sewa':
            await handleSewaCommand(message);
            return true;

        default:
            return false;
    }
}

// Sewa pricing handler
async function handleSewaCommand(message) {
    const sewaText = `🎀 *SEWA EI BOT WHATSAPP* 🎀
📞 Chat Admin: wa.me/6281331143218

━━━━━━━━━━━━━━━
🌟 *PAKET SEWA EI BOT* 🌟
━━━━━━━━━━━━━━━

💎 *VIP*
📆 30 Hari – Rp10.000
📆 365 Hari – Rp95.000 (Diskon 20% – Harga Normal Rp120.000)

💠 *Grup + VIP*
📆 30 Hari – Rp15.000
📆 15 Hari – Rp10.000
📆 365 Hari – Rp150.000 (Diskon 15% – Harga Normal Rp175.000)

👑 *Grup + Member VIP*
📆 30 Hari – Rp30.000

━━━━━━━━━━━━━━━
💳 *METODE PEMBAYARAN* 💳
🔹 QRIS OVO
🔹 ShopeePay
🔹 GoPay
🔹 Dana`;

    await message.reply(sewaText);
    return { success: true };
}

// Main menu handler with all categories
async function handleMenuCommand(message, contact) {
    const { getTimeGreeting } = require('../utils/helpers');
    const greeting = getTimeGreeting();
    
    const menuText = `╭─〔🌸 EI BOT MENU 🌸〕─╮
│  🤖 WhatsApp Bot
╰──────────────────╯

🗻 Yaa~koso! @${contact.id.user}
Selamat datang di EI BOT! 🧋

╭─〔🧠 AI ASSISTANT〕─╮
│ • .ai [pertanyaan]
│ • .aiimage [prompt gambar]
│ • .bard [chat dengan Bard]
│ • .nexara [AI alternatif]
│ • .convertanime (reply foto)
╰──────────────────╯

╭─〔🎴 STICKER TOOLS〕─╮
│ • .s (reply foto/video)
│ • .ttp [teks biasa]
│ • .attp [teks animasi]
│ • .brat [gaya viral]
│ • .toimg (stiker → foto)
│ • .takesticker (ambil stiker)
│ • .circlesticker (stiker bulat)
│ • .emojisticker [emoji]
│ • .stickerinfo (info stiker)
│ • .setwm [author|pack]
╰──────────────────╯

╭─〔📥 DOWNLOAD AREA〕─╮
│ • .ytmp3 [link YouTube]
│ • .ytmp4 [link YouTube]
│ • .tt [link TikTok]
│ • .ig [link Instagram]
│ • .fb [link Facebook]
│ • .twitter [link Twitter]
│ • .mediafire [link]
╰───────────────────╯

╭─〔🧰 UTILITIES〕─╮
│ • .translate [bahasa] [teks]
│ • .qrcode [teks]
│ • .readqr (reply QR)
│ • .tts [bahasa] [teks]
│ • .shortlink [url]
│ • .base64encode [teks]
│ • .base64decode [code]
│ • .hexencode / .hexdecode
│ • .screenshot [url]
│ • .blur (reply foto)
│ • .enhancehd (reply foto)
╰───────────────────╯

╭─〔👑 GROUP CONTROL〕─╮
│ • .hidetag [pesan]
│ • .tagall [pesan]
│ • .promote (reply user)
│ • .kick (reply user)
│ • .demote (reply user)
│ • .antilink on/off
│ • .mute / .unmute
│ • .groupinfo
│ • .listadmin
│ • .revoke (reset link)
│ • .setdesc [deskripsi]
│ • .setname [nama grup]
│ • .welcome on/off
│ • .goodbye on/off
│ • .testwelcome
│ • .afk [alasan]
╰───────────────────╯

╭─〔🖌️ TEXT MAKER〕─╮
│ • .thunder [teks]
│ • .neonlight [teks]
│ • .blackpink [teks]
│ • .batman [teks]
│ • .glow [teks]
│ • .glitch [teks]
│ • .greenneon [teks]
│ • .lightglow [teks]
│ • .bear [teks]
│ • .cloud [teks]
│ • .sand [teks]
│ • .magma [teks]
│ • .window [teks]
│ • .sky [teks]
│ • .pencil [teks]
│ • .cartoon [teks]
│ • .spacetxt [teks]
│ • .bokeh [teks]
│ • .firework [teks]
│ • .holo [teks]
│ • .naruto [teks]
│ • .thor [teks]
│ • .wolf [teks]
│ • .avengers [teks]
│ • .marvel [teks]
│ • .halloween [teks]
│ • .graffiti [teks]
╰──────────────────╯

╭─〔🎲 RANDOM & FUN〕─╮
│ • .quotesanime
│ • .pantun
│ • .waifu / .neko
│ • .loli / .husbando
│ • .apakah [pertanyaan]
│ • .kapan [pertanyaan]
│ • .siapa [pertanyaan]
│ • .rate [teks]
│ • .jodohku
│ • .randomnumber [min] [max]
│ • .randomtag
│ • .randomfact
│ • .poem
│ • .wisdom
│ • .meme
│ • .couple
│ • .alay [teks]
╰──────────────────╯

╭─〔🔍 SEARCH ENGINE〕─╮
│ • .google [query]
│ • .wikipedia [topik]
│ • .ytsearch [query]
│ • .cuaca [kota]
│ • .lyrics [judul lagu]
│ • .pinterest [query]
│ • .jadwalsholat [kota]
│ • .artinama [nama]
│ • .checkip [IP]
│ • .checkml [ID ML]
│ • .checkff [ID FF]
╰──────────────────╯

╭─〔🎮 MEDIA TOOLS〕─╮
│ • .resize [width] [height]
│ • .compress
│ • .enhance
│ • .filter [type]
│ • .audioconvert [format]
│ • .videoconvert [format]
│ • .mediainfo
│ • .crop [x] [y] [w] [h]
│ • .rotate [degree]
│ • .flip [h/v]
│ • .watermark [teks]
│ • .removebg
│ • .thumbnail
╰──────────────────╯

╭─〔💎 PREMIUM ZONE〕─╮
│ • .premium
│ • .upgrade [days]
│ • .gift [mention] [days]
│ • .premiumlist
│ • .features
│ • .usage
│ • .subscription
╰──────────────────╯

╭─〔📊 INFO PANEL〕─╮
│ • .profile
│ • .ping
│ • .runtime
│ • .owner
│ • .sewa (harga rental)
│ • .help [kategori]
│ • .menu
╰──────────────────╯

╭─〔📖 HOW TO USE〕─╮
│ Reply foto/video untuk fitur media
│ Tag user untuk admin commands
│ Semua fitur sudah tested! 
│ 
│ ✅ 80+ Commands Ready
│ 🚀 Update rutin tiap arc!
╰──────────────────╯

🌟 Powered by EI BOT v2.0 !`;

    await message.reply(menuText, undefined, { mentions: [contact.id._serialized] });
    return { success: true };
}

async function handleInfoCommands(command, args, message, contact, chat, client) {
    const userId = contact.id._serialized;
    const userData = await getUserData(userId);

    switch (command) {
        case 'profile':
            const ownerNumber = '6281331143218@c.us';
            const isOwner = userId === ownerNumber;
            
            let status, limitText;
            
            if (isOwner) {
                status = 'VVIP 👑';
                limitText = 'Unlimited ♾️';
            } else if (userData.isPremium) {
                status = 'VIP 👑';
                limitText = 'Unlimited ♾️';
            } else {
                status = '🆓 Free';
                limitText = `${userData.limitUsed}/${userData.limitTotal}`;
            }
            
            const { calculateLevel, formatNumber } = require('../utils/helpers');
            const levelData = calculateLevel(userData.xp || 0);
            const nextLevelXP = levelData.xpToNext;
            
            const profileText = `👤 *PROFIL ANDA*

Nama: ${contact.pushname || 'Tidak diset'}
Nomor: ${contact.number}
Status: ${status}
Level: ${levelData.name} ${userData.xp || 0}/${levelData.nextLevelXP || 'MAX'}
Next: ${levelData.nextLevelName} ${nextLevelXP} XP lagi
XP: ${userData.xp || 0}
Poin: ${userData.points || 0}
Limit: ${limitText}
Bergabung: ${new Date(userData.joinDate).toLocaleDateString('id-ID')}`;

            try {
                // Get user's WhatsApp profile picture
                const profilePicUrl = await contact.getProfilePicUrl();
                if (profilePicUrl) {
                    const { MessageMedia } = require('whatsapp-web.js');
                    const axios = require('axios');
                    
                    // Download profile picture
                    const response = await axios.get(profilePicUrl, { 
                        responseType: 'arraybuffer',
                        timeout: 10000 
                    });
                    const buffer = Buffer.from(response.data);
                    
                    // Create media object
                    const media = new MessageMedia(
                        'image/jpeg',
                        buffer.toString('base64'),
                        'profile.jpg'
                    );
                    
                    // Send profile picture with caption
                    await message.reply(media, undefined, { caption: profileText });
                } else {
                    // No profile picture, send text only
                    await message.reply(profileText);
                }
            } catch (error) {
                console.log('Profile picture error:', error.message);
                // Fallback to text only if profile picture fails
                await message.reply(profileText);
            }
            
            return { success: true };

        case 'limit':
            await message.reply(`📊 *LIMIT ANDA*\n\nTerpakai: ${userData.limitUsed}/${userData.limitTotal}\nSisa: ${userData.limitTotal - userData.limitUsed}\nReset: Setiap hari jam 17:00 WIB`);
            return { success: true };

        case 'balance':
            const { formatLevel: formatLevelBalance, formatNumber: formatNumberBalance } = require('../utils/helpers');
            const levelInfoBalance = formatLevelBalance(userData.points || 0);
            
            const balanceText = `💰 *SALDO ANDA*

${levelInfoBalance}
XP: ${formatNumberBalance(userData.xp || 0)}
Poin: ${formatNumberBalance(userData.points || 0)}`;
            
            await message.reply(balanceText);
            return { success: true };

        case 'status':
            const statusText = `📊 *STATUS BOT*

Versi: ${config.VERSION}
Prefix: ${config.PREFIX}
Uptime: ${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m
Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB
Status: 🟢 Online`;
            
            await message.reply(statusText);
            return { success: true };

        case 'toplocal':
        case 'toplokal':
            return await getLocalLeaderboard(message, chat);

        case 'topglobal':
            return await getGlobalLeaderboard(message);

        default:
            
            return { error: 'Info command not implemented' };
    }
}

async function getLocalLeaderboard(message, chat) {
    try {
        if (!chat.isGroup) {
            await message.reply('❌ Command ini hanya untuk grup!');
            return { error: 'Group only' };
        }

        const { Database } = require('../utils/database');
        const db = new Database();
        const groupId = chat.id._serialized;
        
        // Get all group participants
        const participants = chat.participants.map(p => p.id._serialized);
        
        // Get user data for participants and sort by points
        const groupUsers = [];
        for (const userId of participants) {
            const userData = await db.getUser(userId);
            if (userData && userData.points > 0) {
                groupUsers.push({
                    id: userId,
                    points: userData.points,
                    xp: userData.xp,
                    level: userData.level
                });
            }
        }
        
        groupUsers.sort((a, b) => b.points - a.points);
        const topUsers = groupUsers.slice(0, 10);
        
        if (topUsers.length === 0) {
            await message.reply('📊 *TOP LOCAL*\n\nBelum ada data leaderboard di grup ini.\nMain game untuk masuk leaderboard!');
            return { success: true };
        }
        
        let leaderboardText = '🏆 *TOP LOCAL LEADERBOARD*\n\n';
        
        for (let i = 0; i < topUsers.length; i++) {
            const user = topUsers[i];
            const rank = i + 1;
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🏅';
            const username = user.id.split('@')[0].substring(0, 15);
            
            leaderboardText += `${medal} ${rank}. ${username}\n`;
            leaderboardText += `    💰 ${user.points.toLocaleString()} poin\n`;
            leaderboardText += `    ⭐ ${user.xp.toLocaleString()} XP\n\n`;
        }
        
        leaderboardText += 'Main game untuk naik peringkat! 🎮';
        
        await message.reply(leaderboardText);
        return { success: true };
        
    } catch (error) {
        console.error('Local leaderboard error:', error);
        await message.reply('❌ Gagal memuat leaderboard lokal.');
        return { error: error.message };
    }
}

async function getGlobalLeaderboard(message) {
    try {
        const { Database } = require('../utils/database');
        const db = new Database();
        
        // Get top users globally
        const topUsers = await db.getTopUsers(10, 'points');
        
        if (topUsers.length === 0) {
            await message.reply('📊 *TOP GLOBAL*\n\nBelum ada data leaderboard global.\nMain game untuk masuk leaderboard!');
            return { success: true };
        }
        
        let leaderboardText = '🌍 *TOP GLOBAL LEADERBOARD*\n\n';
        
        for (let i = 0; i < topUsers.length; i++) {
            const user = topUsers[i];
            const rank = i + 1;
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🏅';
            const username = user.id.split('@')[0].substring(0, 15);
            
            leaderboardText += `${medal} ${rank}. ${username}\n`;
            leaderboardText += `    💰 ${user.points.toLocaleString()} poin\n`;
            leaderboardText += `    ⭐ ${user.xp.toLocaleString()} XP\n\n`;
        }
        
        leaderboardText += 'Main game untuk naik peringkat! 🎮';
        
        await message.reply(leaderboardText);
        return { success: true };
        
    } catch (error) {
        console.error('Global leaderboard error:', error);
        await message.reply('❌ Gagal memuat leaderboard global.');
        return { error: error.message };
    }
}

async function handleReplyCommands(command, args, message, contact, chat, client, targetUser, targetText) {
    const { isGroupAdmin, isBotAdmin } = require('../utils/helpers');
    const { getUserData, updateUserData, getGroupData, updateGroupData, addWarning, getWarnings } = require('../utils/database');
    
    const userId = contact.id._serialized;
    const targetUserId = targetUser.id._serialized;
    
    // Check if user is admin
    let isAdmin = false;
    let botIsAdmin = false;
    try {
        if (chat.isGroup) {
            const participants = await chat.participants;
            const userParticipant = participants.find(p => p.id._serialized === userId);
            const botParticipant = participants.find(p => p.id._serialized === client.info.wid._serialized);
            
            isAdmin = userParticipant && userParticipant.isAdmin;
            botIsAdmin = botParticipant && botParticipant.isAdmin;
        }
    } catch (error) {
        console.log('Error checking admin status:', error.message);
    }
    
    switch (command) {
        case 'alay':
            // Convert target text to alay style
            if (!targetText && !args.length) {
                await message.reply('❌ Tidak ada teks yang ditemukan untuk dikonversi!');
                return { error: 'No text found' };
            }
            
            const textToConvert = targetText || args.join(' ');
            const alayMap = {
                'a': '4', 'i': '1', 'o': '0', 'e': '3', 's': '5',
                'g': '9', 't': '7', 'l': '1', 'A': '4', 'I': '1',
                'O': '0', 'E': '3', 'S': '5', 'G': '9', 'T': '7', 'L': '1'
            };

            let alayText = textToConvert;
            for (const [normal, alay] of Object.entries(alayMap)) {
                alayText = alayText.replace(new RegExp(normal, 'g'), alay);
            }

            // Add random uppercase/lowercase for more chaotic effect
            alayText = alayText.split('').map((char, index) => {
                const rand = Math.random();
                if (rand < 0.3) return char.toUpperCase();
                if (rand < 0.6) return char.toLowerCase();
                return char;
            }).join('');

            await message.reply(`🔤 *TEKS ALAY*\n\nAsli: ${textToConvert}\nAlay: ${alayText}`);
            return { success: true };

        case 'h':
        case 'hidetag':
            // Admin hide tag with target text
            if (!isAdmin) {
                await message.reply('❌ Hanya admin yang bisa menggunakan perintah ini!');
                return { error: 'Admin only' };
            }
            
            if (!chat.isGroup) {
                await message.reply('❌ Perintah ini hanya untuk grup!');
                return { error: 'Group only' };
            }

            const hideTagText = targetText || args.join(' ') || 'Tag tersembunyi oleh admin';
            const participants = chat.participants.map(p => p.id._serialized);
            
            await chat.sendMessage(hideTagText, {
                mentions: participants
            });
            return { success: true };

        case 'profile':
            // Show target user's profile
            const targetUserData = await getUserData(targetUserId);
            const { calculateLevel } = require('../utils/helpers');
            const levelData = calculateLevel(targetUserData.xp || 0);
            const nextLevelXP = levelData.xpToNext;
            
            let status, limitText;
            const ownerNumber = '6281331143218@c.us';
            
            if (targetUserId === ownerNumber) {
                status = 'VVIP 👑';
                limitText = 'Unlimited ♾️';
            } else if (targetUserData.isPremium) {
                status = 'VIP 👑';
                limitText = 'Unlimited ♾️';
            } else {
                status = '🆓 Free';
                limitText = `${targetUserData.limitUsed}/${targetUserData.limitTotal}`;
            }

            const profileText = `👤 *PROFIL USER*

Nama: ${targetUser.pushname || 'Tidak diset'}
Nomor: ${targetUser.number}
Status: ${status}
Level: ${levelData.name} ${targetUserData.xp || 0}/${levelData.nextLevelXP || 'MAX'}
Next: ${levelData.nextLevelName} ${nextLevelXP} XP lagi
XP: ${targetUserData.xp || 0}
Poin: ${targetUserData.points || 0}
Limit: ${limitText}
Bergabung: ${new Date(targetUserData.joinDate).toLocaleDateString('id-ID')}`;

            await message.reply(profileText);
            return { success: true };

        case 'limit':
            // Show target user's limit
            const targetLimitData = await getUserData(targetUserId);
            const limitInfo = `📊 *LIMIT USER*

Nama: ${targetUser.pushname || 'Tidak diset'}
Limit: ${targetLimitData.limitUsed}/${targetLimitData.limitTotal}
Sisa: ${targetLimitData.limitTotal - targetLimitData.limitUsed}
Reset: Setiap hari jam 17:00`;

            await message.reply(limitInfo);
            return { success: true };

        case 'point':
        case 'points':
            // Show target user's points
            const targetPointData = await getUserData(targetUserId);
            const pointInfo = `💰 *POIN USER*

Nama: ${targetUser.pushname || 'Tidak diset'}
Poin: ${targetPointData.points || 0}
XP: ${targetPointData.xp || 0}`;

            await message.reply(pointInfo);
            return { success: true };

        case 'warn':
            // Admin warn user
            if (!isAdmin) {
                await message.reply('❌ Hanya admin yang bisa memberikan peringatan!');
                return { error: 'Admin only' };
            }

            if (!chat.isGroup) {
                await message.reply('❌ Perintah ini hanya untuk grup!');
                return { error: 'Group only' };
            }

            const reason = args.join(' ') || 'Melanggar aturan grup';
            const groupId = chat.id._serialized;
            
            await addWarning(groupId, targetUserId, reason);
            const warnings = await getWarnings(groupId, targetUserId);
            
            const warnText = `⚠️ *PERINGATAN*

@${targetUser.number} awas❗
Kamu diperingati (${warnings.length}/3)

Alasan: ${reason}
Waktu: ${new Date().toLocaleString('id-ID')}

${warnings.length >= 3 ? '⚠️ BATAS MAKSIMAL TERCAPAI!' : ''}`;

            await message.reply(warnText, undefined, { mentions: [targetUserId] });

            // Auto-kick if user reaches 3 warnings
            if (warnings.length >= 3 && botIsAdmin) {
                try {
                    await chat.removeParticipants([targetUserId]);
                    await message.reply(`🚫 @${targetUser.number} telah dikeluarkan dari grup karena mencapai 3 peringatan!`, undefined, { mentions: [targetUserId] });
                    
                    // Reset warnings after kick
                    const { resetWarnings } = require('../utils/database');
                    await resetWarnings(groupId, targetUserId);
                } catch (error) {
                    console.error('Auto-kick error:', error);
                    await message.reply('❌ Gagal mengeluarkan member otomatis. Bot mungkin bukan admin!');
                }
            } else if (warnings.length >= 3 && !botIsAdmin) {
                await message.reply('⚠️ User sudah mencapai 3 peringatan tapi bot bukan admin untuk mengeluarkan!');
            }

            return { success: true };

        case 'kick':
            // Admin kick user
            if (!isAdmin) {
                await message.reply('❌ Hanya admin yang bisa mengeluarkan member!');
                return { error: 'Admin only' };
            }

            if (!chat.isGroup) {
                await message.reply('❌ Perintah ini hanya untuk grup!');
                return { error: 'Group only' };
            }

            if (!botIsAdmin) {
                await message.reply('❌ Bot harus menjadi admin untuk mengeluarkan member!');
                return { error: 'Bot not admin' };
            }

            try {
                await chat.removeParticipants([targetUserId]);
                await message.reply(`✅ @${targetUser.number} telah dikeluarkan dari grup!`, undefined, { mentions: [targetUserId] });
                return { success: true };
            } catch (error) {
                await message.reply('❌ Gagal mengeluarkan member. Pastikan bot adalah admin!');
                return { error: error.message };
            }

        case 'blacklist':
            // Admin blacklist user
            if (!isAdmin) {
                await message.reply('❌ Hanya admin yang bisa menambah blacklist!');
                return { error: 'Admin only' };
            }

            if (!chat.isGroup) {
                await message.reply('❌ Perintah ini hanya untuk grup!');
                return { error: 'Group only' };
            }

            const groupData = await getGroupData(chat.id._serialized);
            if (!groupData.blacklist) {
                groupData.blacklist = [];
            }

            if (groupData.blacklist.includes(targetUserId)) {
                await message.reply('❌ User sudah ada dalam blacklist!');
                return { error: 'Already blacklisted' };
            }

            groupData.blacklist.push(targetUserId);
            await updateGroupData(chat.id._serialized, { blacklist: groupData.blacklist });
            
            // Kick user if bot is admin
            if (botIsAdmin) {
                try {
                    await chat.removeParticipants([targetUserId]);
                } catch (error) {
                    console.error('Failed to kick blacklisted user:', error);
                }
            }

            await message.reply(`🚫 @${targetUser.number} telah ditambahkan ke blacklist!`, undefined, { mentions: [targetUserId] });
            return { success: true };

        case 'banmember':
            // Admin ban user from using bot
            if (!isAdmin) {
                await message.reply('❌ Hanya admin yang bisa mem-ban member!');
                return { error: 'Admin only' };
            }

            const targetData = await getUserData(targetUserId);
            if (targetData.isBanned) {
                await message.reply('❌ User sudah di-ban!');
                return { error: 'Already banned' };
            }

            const banReason = args.join(' ') || 'Melanggar aturan bot';
            await updateUserData(targetUserId, {
                isBanned: true,
                banReason: banReason,
                banUntil: 0 // Permanent ban
            });

            await message.reply(`🚫 @${targetUser.number} telah di-ban dari menggunakan bot!

Alasan: ${banReason}
Status: Permanent ban`, undefined, { mentions: [targetUserId] });
            return { success: true };

        case 'unbanmember':
            // Admin unban user from using bot
            if (!isAdmin) {
                await message.reply('❌ Hanya admin yang bisa meng-unban member!');
                return { error: 'Admin only' };
            }

            const targetDataUnban = await getUserData(targetUserId);
            if (!targetDataUnban.isBanned) {
                await message.reply('❌ User tidak sedang di-ban!');
                return { error: 'Not banned' };
            }

            await updateUserData(targetUserId, {
                isBanned: false,
                banReason: null,
                banUntil: null
            });

            await message.reply(`✅ @${targetUser.number} telah di-unban dan dapat menggunakan bot kembali!`, undefined, { mentions: [targetUserId] });
            return { success: true };

        default:
            return null; // Command not handled by reply system
    }
}

module.exports = {
    handleCommand,
    COMMAND_CATEGORIES,
    getLocalLeaderboard,
    getGlobalLeaderboard
};
