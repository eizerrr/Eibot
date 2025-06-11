module.exports = {
    // Bot Configuration
    PREFIX: '.',
    BOT_NAME: 'EI Bot',
    VERSION: '1.0.0',
    
    // API Keys - Retrieved from environment variables
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || '',
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || '',
    WEATHER_API_KEY: process.env.WEATHER_API_KEY || '',
    
    // Rate Limiting
    RATE_LIMIT: {
        COMMANDS_PER_MINUTE: 10,
        AI_COMMANDS_PER_HOUR: 20,
        DOWNLOAD_COMMANDS_PER_HOUR: 15
    },
    
    // User Limits
    USER_LIMITS: {
        FREE_DAILY_LIMIT: 30,
        PREMIUM_DAILY_LIMIT: 1000,
        RESET_HOUR: 17, // Reset at 5 PM (17:00)
        LIMIT_PURCHASE_COST: 10, // Points needed to buy 1 limit
        MAX_PURCHASABLE_LIMITS: 50, // Maximum limits that can be purchased per day
        
        // Commands that don't consume limits (informational commands)
        FREE_COMMANDS: [
            'limit', 'profile', 'point', 'points', 'toplocal', 'topglobal', 
            'hidetag', 'h', 'ping', 'runtime', 'help', 'menu', 'owner',
            'groupinfo', 'admins', 'link', 'setdesc', 'setname', 'tagall',
            'absence', 'checkabsence', 'afk', 'vote', 'buylimit', 'transfer',
            'alay', 'warn', 'kick', 'blacklist', 'banmember', 'antilink'
        ]
    },
    
    // File Settings
    MAX_FILE_SIZE: 64 * 1024 * 1024, // 64MB
    TEMP_DIR: './temp',
    
    // Database
    DATABASE_PATH: './data/database.json',
    
    // External APIs
    APIs: {
        OPENAI_MODEL: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        TTS_VOICE: 'id-ID-ArdiNeural',
        TRANSLATE_API: 'https://api.mymemory.translated.net/get',
        WEATHER_API: 'https://api.openweathermap.org/data/2.5/weather',
        YOUTUBE_SEARCH: 'https://www.googleapis.com/youtube/v3/search',
        SCREENSHOT_API: 'https://api.screenshotmachine.com',
        QR_API: 'https://api.qrserver.com/v1/create-qr-code/',
        SHORTLINK_API: 'https://tinyurl.com/api-create.php'
    },
    
    // Game Settings
    GAMES: {
        TIMEOUT_SECONDS: {
            EASY: 30,
            HARD: 60,
            EXTREME: 90,
            IMPOSSIBLE: 120
        },
        MAX_HINTS: 3,
        POINT_REWARDS: {
            EASY: 10,
            MEDIUM: 25,
            HARD: 50
        },
        XP_REWARDS: {
            EASY: 50,
            MEDIUM: 150,
            HARD: 250
        },
        TIMEOUT_MINUTES: 3, // Default timeout for family100 games
        FAMILY100_TIMEOUT_SECONDS: 120 // Family100 timeout in seconds (2 minutes)
    },
    
    // Level System (based on XP, not points)
    LEVELS: {
        WARRIOR: { xp: 0, name: 'Warrior' },
        ELITE: { xp: 100, name: 'Elite' },
        MASTER: { xp: 300, name: 'Master' },
        GRAND_MASTER: { xp: 700, name: 'Grand Master' },
        EPIC: { xp: 1400, name: 'Epic' },
        LEGEND: { xp: 3000, name: 'Legend' },
        MYTHIC: { xp: 6000, name: 'Mythic' },
        MYTHIC_HONOR: { xp: 12000, name: 'Mythic Honor' },
        MYTHIC_GLORY: { xp: 24000, name: 'Mythic Glory' },
        MYTHIC_IMMORTAL: { xp: 50000, name: 'Mythic Immortal' }
    },
    
    // User Settings
    USER: {
        DEFAULT_POINTS: 0,
        DEFAULT_XP: 0,
        DEFAULT_LEVEL: 'WARRIOR'
    },
    
    // Group Settings
    GROUP: {
        WELCOME_ENABLED: true,
        ANTILINK_ENABLED: false,
        ANTIBOT_ENABLED: false,
        MAX_WARN_COUNT: 3
    },
    
    // Text Maker APIs
    TEXT_MAKER: {
        LOGO_MAKER: 'https://api.textpro.me',
        CANVAS_API: 'https://some-canvas-api.com'
    },
    
    // AI APIs
    APIs: {
        OPENAI_MODEL: 'gpt-4o'
    },
    
    // Sticker Settings
    STICKER: {
        AUTHOR: 'EI Bot',
        PACK: 'WhatsApp Bot Stickers',
        QUALITY: 50
    },
    
    // Error Messages
    ERRORS: {
        NO_PERMISSION: '❌ Anda tidak memiliki izin untuk menggunakan perintah ini.',
        GROUP_ONLY: '❌ Perintah ini hanya dapat digunakan di grup.',
        ADMIN_ONLY: '❌ Perintah ini hanya dapat digunakan oleh admin grup.',
        LIMIT_EXCEEDED: '❌ Limit harian Anda sudah habis.',
        INVALID_FORMAT: '❌ Format perintah tidak valid.',
        API_ERROR: '❌ Terjadi kesalahan pada layanan eksternal.',
        PROCESSING_ERROR: '❌ Terjadi kesalahan saat memproses permintaan.'
    },
    
    // Success Messages
    SUCCESS: {
        COMMAND_EXECUTED: '✅ Perintah berhasil dijalankan.',
        SETTINGS_UPDATED: '✅ Pengaturan berhasil diperbarui.',
        USER_PROMOTED: '✅ User berhasil dipromosikan.',
        USER_DEMOTED: '✅ User berhasil diturunkan.',
        MESSAGE_SENT: '✅ Pesan berhasil dikirim.'
    }
};
