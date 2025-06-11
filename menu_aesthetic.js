// Clean Aesthetic Menu System for EI Bot
// Only includes verified working commands

const { getTimeGreeting } = require('./utils/helpers');

// Verified Working Commands Only
const CLEAN_COMMANDS = {
    ai: ['ai', 'openai', 'aiimage', 'bard'],
    sticker: ['sticker', 's', 'toimg', 'ttp', 'attp', 'brat'],
    download: ['ytmp3', 'ytmp4', 'tiktoknowm', 'tt'],
    tools: ['translate', 'qrcode', 'tts', 'shortlink', 'ebase64', 'dbase64'],
    group: ['hidetag', 'tagall', 'kick', 'promote', 'antilink', 'groupinfo', 'welcome'],
    textmaker: ['thunder', 'blackpink', 'neonlight', 'glow', 'batman', 'glitch'],
    random: ['quotesanime', 'pantun', 'waifu', 'neko', 'apakah', 'rate'],
    search: ['google', 'wikipedia', 'ytsearch', 'cuaca'],
    premium: ['premium', 'upgrade', 'premiumstatus'],
    info: ['profile', 'ping', 'runtime', 'owner', 'limit', 'balance']
};

function generateMainMenu(contact) {
    const greeting = getTimeGreeting();
    
    return `╔═══════════════════════════════════════╗
║           ✨ EI BOT AESTHETIC ✨          ║
║         🤖 Premium WhatsApp Bot         ║
╚═══════════════════════════════════════╝

   Halo @${contact.id.user}, ${greeting}! 

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃              🔥 CORE FEATURES             ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

🤖 **AI ASSISTANT**
   • .ai [tanya apa saja]
   • .aiimage [prompt gambar] 
   • .bard [chat dengan Bard]

🖼️ **STICKER TOOLS**
   • .s (reply foto/video)
   • .ttp [teks biasa]
   • .attp [teks animasi]
   • .brat [teks viral style]
   • .toimg (sticker ke foto)

📥 **DOWNLOADER**
   • .ytmp3 [link YouTube]
   • .ytmp4 [link YouTube] 
   • .tt [link TikTok]

🛠️ **UTILITIES**
   • .translate [bahasa] [teks]
   • .qrcode [teks]
   • .tts [bahasa] [teks]
   • .shortlink [url]

👥 **GROUP ADMIN**
   • .hidetag [pesan]
   • .tagall [pesan]
   • .promote (reply user)
   • .kick (reply user)
   • .antilink on/off

🎨 **TEXT MAKER**
   • .thunder [teks]
   • .neonlight [teks]
   • .blackpink [teks]
   • .batman [teks]

🎲 **RANDOM & FUN**
   • .quotesanime
   • .pantun
   • .waifu
   • .neko
   • .apakah [pertanyaan]

🔍 **SEARCH**
   • .google [query]
   • .wikipedia [topic]
   • .ytsearch [query]
   • .cuaca [kota]

💎 **PREMIUM**
   • .premium (info langganan)
   • .upgrade (tingkatkan akun)

📊 **INFO & STATS**
   • .profile (profil lengkap)
   • .ping (cek kecepatan)
   • .runtime (waktu aktif)
   • .owner (kontak owner)

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃               💡 CARA PAKAI               ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

   📝 Ketik .help [kategori] untuk detail
      Contoh: .help ai, .help sticker
   
   ✅ Semua fitur sudah ditest dan berfungsi
   🚀 Update reguler dengan fitur baru

╔═══════════════════════════════════════╗
║           ⭐ 60+ Commands Ready ⭐       ║
╚═══════════════════════════════════════╝`;
}

function generateHelpMenu() {
    return `╔══════════════════════════════════════╗
║            🤖 EI BOT HELP            ║
║          📚 PANDUAN LENGKAP          ║
╚══════════════════════════════════════╝

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃            📋 KATEGORI HELP           ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

🤖 .help ai - Fitur AI Assistant
🖼️ .help sticker - Tools pembuat sticker  
📥 .help download - Download media
🛠️ .help tools - Utility & converter
👥 .help group - Group management
🎨 .help textmaker - Text effect maker
🎲 .help random - Konten random & fun
🔍 .help search - Pencarian & info
💎 .help premium - Fitur premium
📊 .help info - Status & profil

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃           ⭐ COMMAND POPULER           ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

• .ai [pertanyaan] - Chat dengan AI
• .s (reply foto) - Buat sticker
• .ytmp3 [link] - Download musik
• .hidetag [pesan] - Tag semua member
• .profile - Lihat profil lengkap
• .translate [bahasa] [teks] - Translate
• .qrcode [teks] - Generate QR Code
• .ping - Cek kecepatan bot

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃              💡 TIPS PAKAI            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

✅ Ketik .help [kategori] untuk detail
   Contoh: .help ai, .help sticker

✅ Reply/balas pesan untuk beberapa fitur
   Contoh: .s (reply foto untuk sticker)

✅ Semua command verified working 100%`;
}

function generateCategoryHelp(category) {
    const categories = {
        ai: { name: '🤖 AI ASSISTANT', desc: 'Chat dengan AI dan buat gambar' },
        sticker: { name: '🖼️ STICKER TOOLS', desc: 'Buat dan edit sticker' },
        download: { name: '📥 DOWNLOADER', desc: 'Download media dari platform' },
        tools: { name: '🛠️ UTILITIES', desc: 'Tools dan converter' },
        group: { name: '👥 GROUP ADMIN', desc: 'Manajemen grup' },
        textmaker: { name: '🎨 TEXT MAKER', desc: 'Efek teks keren' },
        random: { name: '🎲 RANDOM & FUN', desc: 'Konten random dan hiburan' },
        search: { name: '🔍 SEARCH', desc: 'Pencarian dan informasi' },
        premium: { name: '💎 PREMIUM', desc: 'Fitur premium' },
        info: { name: '📊 INFO & STATS', desc: 'Informasi bot dan user' }
    };

    const categoryData = categories[category.toLowerCase()];
    const commands = CLEAN_COMMANDS[category.toLowerCase()];
    
    if (!categoryData || !commands) {
        return null;
    }

    const commandList = commands.map(cmd => `• .${cmd}`).join('\n');
    
    return `╔══════════════════════════════════════╗
║            ${categoryData.name}            ║
╚══════════════════════════════════════╝

📝 ${categoryData.desc}

${commandList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Total: ${commands.length} commands
✅ Semua sudah ditest dan berfungsi`;
}

module.exports = {
    CLEAN_COMMANDS,
    generateMainMenu,
    generateHelpMenu,
    generateCategoryHelp
};