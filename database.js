const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config');

class Database {
    constructor() {
        this.dbPath = config.DATABASE_PATH || './data/database.json';
        this.dataDir = path.dirname(this.dbPath);
        this.data = {
            users: {},
            groups: {},
            settings: {},
            games: {},
            afkUsers: {},
            muteSettings: {},
            stats: {
                commandsUsed: 0,
                messagesProcessed: 0,
                usersCount: 0,
                groupsCount: 0
            }
        };
        this.isInitialized = false;
    }

    async init() {
        try {
            // Ensure data directory exists
            await fs.mkdir(this.dataDir, { recursive: true });
            
            // Load existing data
            await this.loadData();
            this.isInitialized = true;
            
            console.log('✅ Database initialized successfully');
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw error;
        }
    }

    async loadData() {
        try {
            const data = await fs.readFile(this.dbPath, 'utf8');
            this.data = { ...this.data, ...JSON.parse(data) };
        } catch (error) {
            if (error.code === 'ENOENT') {
                // File doesn't exist, create with default data
                await this.saveData();
            } else {
                console.error('Error loading database:', error);
                throw error;
            }
        }
    }

    async saveData() {
        try {
            await fs.writeFile(this.dbPath, JSON.stringify(this.data, null, 2), 'utf8');
        } catch (error) {
            console.error('Error saving database:', error);
            throw error;
        }
    }

    // User Management
    async getUser(userId) {
        if (!this.data.users[userId]) {
            this.data.users[userId] = this.createDefaultUser(userId);
            await this.saveData();
        }
        return this.data.users[userId];
    }

    createDefaultUser(userId) {
        // Check if user is owner for unlimited limits
        const ownerNumber = '6281331143218@c.us';
        const isOwner = userId === ownerNumber;
        
        return {
            id: userId,
            isPremium: isOwner,
            premiumType: isOwner ? 'owner' : 'free', // free, basic, premium, vip, owner
            premiumExpiry: isOwner ? null : 0,
            premiumFeatures: this.getPremiumFeatures(isOwner ? 'owner' : 'free'),
            level: 1,
            xp: 0,
            points: 0,
            limitUsed: 0,
            limitTotal: isOwner ? 999999 : config.USER_LIMITS.FREE_DAILY_LIMIT,
            joinDate: Date.now(),
            lastActive: Date.now(),
            lastLimitReset: Date.now(),
            commandsUsed: 0,
            warns: 0,
            isBanned: false,
            banReason: '',
            banUntil: 0,
            subscription: {
                plan: isOwner ? 'owner' : 'free',
                startDate: Date.now(),
                endDate: isOwner ? null : 0,
                autoRenew: false,
                paymentHistory: []
            },
            preferences: {
                language: 'id',
                notifications: true,
                autoLevelUp: true,
                aiPersonality: 'friendly',
                downloadQuality: 'medium'
            },
            usage: {
                dailyCommands: 0,
                weeklyCommands: 0,
                monthlyCommands: 0,
                aiRequests: 0,
                downloadRequests: 0,
                lastUsageReset: Date.now()
            },
            stats: {
                messagesCount: 0,
                commandsCount: 0,
                gamesWon: 0,
                gamesPlayed: 0,
                totalDownloads: 0,
                totalAiQueries: 0
            }
        };
    }

    getPremiumFeatures(type) {
        const features = {
            free: {
                dailyLimit: 20,
                aiRequests: 5,
                downloadLimit: 10,
                fileSize: '50MB',
                customCommands: false,
                prioritySupport: false,
                advancedGames: false,
                customStickers: false,
                bulkDownload: false,
                higherQuality: false
            },
            basic: {
                dailyLimit: 100,
                aiRequests: 25,
                downloadLimit: 50,
                fileSize: '100MB',
                customCommands: true,
                prioritySupport: false,
                advancedGames: true,
                customStickers: true,
                bulkDownload: false,
                higherQuality: false
            },
            premium: {
                dailyLimit: 500,
                aiRequests: 100,
                downloadLimit: 200,
                fileSize: '500MB',
                customCommands: true,
                prioritySupport: true,
                advancedGames: true,
                customStickers: true,
                bulkDownload: true,
                higherQuality: true
            },
            vip: {
                dailyLimit: 2000,
                aiRequests: 500,
                downloadLimit: 1000,
                fileSize: '1GB',
                customCommands: true,
                prioritySupport: true,
                advancedGames: true,
                customStickers: true,
                bulkDownload: true,
                higherQuality: true
            },
            owner: {
                dailyLimit: 999999,
                aiRequests: 999999,
                downloadLimit: 999999,
                fileSize: 'unlimited',
                customCommands: true,
                prioritySupport: true,
                advancedGames: true,
                customStickers: true,
                bulkDownload: true,
                higherQuality: true
            }
        };
        
        return features[type] || features.free;
    }

    async updateUser(userId, updateData) {
        const user = await this.getUser(userId);
        Object.assign(user, updateData);
        user.lastActive = Date.now();
        await this.saveData();
        return user;
    }

    async updateUserLimit(userId) {
        const user = await this.getUser(userId);
        
        // Check if limit should be reset (daily reset)
        const now = new Date();
        const lastReset = new Date(user.lastLimitReset);
        
        if (now.getDate() !== lastReset.getDate() || 
            now.getMonth() !== lastReset.getMonth() || 
            now.getFullYear() !== lastReset.getFullYear()) {
            user.limitUsed = 0;
            user.lastLimitReset = Date.now();
        }
        
        if (user.limitUsed < user.limitTotal) {
            user.limitUsed++;
        }
        
        await this.saveData();
        return user;
    }

    async updateUserPoints(userId, points) {
        const user = await this.getUser(userId);
        user.points = (user.points || 0) + points;
        
        // Ensure points don't go negative
        if (user.points < 0) user.points = 0;
        
        await this.saveData();
        return user;
    }

    async updateUserXP(userId, xp) {
        const user = await this.getUser(userId);
        user.xp = (user.xp || 0) + xp;
        
        // Check for level up
        const newLevel = Math.floor(user.xp / 100) + 1;
        if (newLevel > user.level) {
            user.level = newLevel;
            // Award points for level up
            user.points = (user.points || 0) + (newLevel * 10);
        }
        
        await this.saveData();
        return user;
    }

    async getUserStats() {
        const users = Object.values(this.data.users);
        return {
            totalUsers: users.length,
            premiumUsers: users.filter(u => u.isPremium).length,
            activeUsers: users.filter(u => Date.now() - u.lastActive < 86400000).length, // Active in last 24h
            bannedUsers: users.filter(u => u.isBanned).length
        };
    }

    // Group Management
    async getGroup(groupId) {
        if (!this.data.groups[groupId]) {
            this.data.groups[groupId] = this.createDefaultGroup(groupId);
            await this.saveData();
        }
        return this.data.groups[groupId];
    }

    createDefaultGroup(groupId) {
        return {
            id: groupId,
            isActive: true,
            welcome: {
                enabled: config.GROUP.WELCOME_ENABLED,
                message: 'Selamat datang @user di grup @group! 👋',
                type: 'text'
            },
            welcomeType: 2,
            goodbye: {
                enabled: false,
                message: 'Selamat tinggal @user! 👋',
                type: 'text'
            },
            rules: [],
            antilink: {
                enabled: config.GROUP.ANTILINK_ENABLED,
                action: 'warn', // warn, kick, delete
                whitelist: []
            },
            antibot: {
                enabled: config.GROUP.ANTIBOT_ENABLED,
                action: 'kick'
            },
            antispam: {
                enabled: false,
                maxMessages: 5,
                timeWindow: 10000 // 10 seconds
            },
            warnings: {},
            mutedUsers: {},
            bannedUsers: {},
            gameMode: true,
            autoModeration: true,
            stats: {
                messagesCount: 0,
                commandsCount: 0,
                membersJoined: 0,
                membersLeft: 0
            },
            settings: {
                language: 'id',
                timezone: 'Asia/Jakarta',
                autoDelete: false
            }
        };
    }

    async updateGroup(groupId, updateData) {
        const group = await this.getGroup(groupId);
        Object.assign(group, updateData);
        await this.saveData();
        return group;
    }

    async addWarning(groupId, userId, reason = 'No reason provided') {
        const group = await this.getGroup(groupId);
        
        if (!group.warnings[userId]) {
            group.warnings[userId] = [];
        }
        
        group.warnings[userId].push({
            reason,
            date: Date.now(),
            id: Date.now().toString()
        });
        
        await this.saveData();
        return group.warnings[userId].length;
    }

    async removeWarning(groupId, userId, warningId) {
        const group = await this.getGroup(groupId);
        
        if (group.warnings[userId]) {
            group.warnings[userId] = group.warnings[userId].filter(w => w.id !== warningId);
            if (group.warnings[userId].length === 0) {
                delete group.warnings[userId];
            }
        }
        
        await this.saveData();
        return group.warnings[userId]?.length || 0;
    }

    async getWarnings(groupId, userId) {
        const group = await this.getGroup(groupId);
        return group.warnings[userId] || [];
    }

    async resetWarnings(groupId, userId) {
        const group = await this.getGroup(groupId);
        
        if (group.warnings[userId]) {
            delete group.warnings[userId];
            await this.saveData();
        }
        
        return true;
    }

    // Game Management
    async saveGameSession(chatId, gameData) {
        this.data.games[chatId] = {
            ...gameData,
            savedAt: Date.now()
        };
        await this.saveData();
    }

    async getGameSession(chatId) {
        return this.data.games[chatId] || null;
    }

    async deleteGameSession(chatId) {
        delete this.data.games[chatId];
        await this.saveData();
    }

    async updateGameStats(userId, gameType, won = false) {
        const user = await this.getUser(userId);
        user.stats.gamesPlayed = (user.stats.gamesPlayed || 0) + 1;
        
        if (won) {
            user.stats.gamesWon = (user.stats.gamesWon || 0) + 1;
        }
        
        await this.saveData();
        return user.stats;
    }

    // Settings Management
    async getSetting(key, defaultValue = null) {
        return this.data.settings[key] || defaultValue;
    }

    async setSetting(key, value) {
        this.data.settings[key] = value;
        await this.saveData();
    }

    // Statistics
    async updateStats(type, increment = 1) {
        if (this.data.stats[type] !== undefined) {
            this.data.stats[type] += increment;
            await this.saveData();
        }
    }

    async getStats() {
        return {
            ...this.data.stats,
            userStats: await this.getUserStats(),
            dbSize: JSON.stringify(this.data).length,
            lastUpdate: Date.now()
        };
    }

    // Utility methods
    async backup() {
        const backupPath = `${this.dbPath}.backup.${Date.now()}`;
        try {
            await fs.writeFile(backupPath, JSON.stringify(this.data, null, 2), 'utf8');
            console.log(`Database backed up to: ${backupPath}`);
            return backupPath;
        } catch (error) {
            console.error('Backup failed:', error);
            throw error;
        }
    }

    async cleanup() {
        // Remove old game sessions (older than 1 hour)
        const oneHourAgo = Date.now() - 3600000;
        
        Object.keys(this.data.games).forEach(chatId => {
            if (this.data.games[chatId].savedAt < oneHourAgo) {
                delete this.data.games[chatId];
            }
        });
        
        await this.saveData();
    }

    async searchUsers(query) {
        const users = Object.values(this.data.users);
        return users.filter(user => 
            user.id.includes(query) || 
            (user.name && user.name.toLowerCase().includes(query.toLowerCase()))
        );
    }

    async getTopUsers(limit = 10, sortBy = 'points') {
        const users = Object.values(this.data.users);
        return users
            .sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0))
            .slice(0, limit);
    }

    // AFK management methods
    async setAfkUser(userId, reason, username) {
        this.data.afkUsers[userId] = {
            reason: reason || '',
            time: Date.now(),
            username: username
        };
        await this.saveData();
    }

    async getAfkUser(userId) {
        return this.data.afkUsers[userId] || null;
    }

    async removeAfkUser(userId) {
        if (this.data.afkUsers[userId]) {
            delete this.data.afkUsers[userId];
            await this.saveData();
            return true;
        }
        return false;
    }

    async getAllAfkUsers() {
        return this.data.afkUsers;
    }

    // Mute settings methods
    async setMuteStatus(groupId, isMuted) {
        this.data.muteSettings[groupId] = {
            muted: isMuted,
            timestamp: Date.now()
        };
        await this.saveData();
    }

    async getMuteStatus(groupId) {
        const muteData = this.data.muteSettings[groupId];
        return muteData ? muteData.muted : false;
    }

    // Premium User Management
    async upgradeToPremium(userId, type, duration) {
        const user = await this.getUser(userId);
        const now = Date.now();
        
        user.isPremium = true;
        user.premiumType = type;
        user.premiumFeatures = this.getPremiumFeatures(type);
        user.premiumExpiry = duration ? now + duration : null;
        
        user.subscription.plan = type;
        user.subscription.startDate = now;
        user.subscription.endDate = duration ? now + duration : null;
        user.subscription.paymentHistory.push({
            date: now,
            plan: type,
            duration: duration,
            amount: this.getPremiumPrice(type),
            method: 'manual'
        });
        
        user.limitTotal = user.premiumFeatures.dailyLimit;
        await this.saveData();
        return user;
    }

    async downgradeToFree(userId) {
        const user = await this.getUser(userId);
        if (user.premiumType === 'owner') return user;
        
        user.isPremium = false;
        user.premiumType = 'free';
        user.premiumFeatures = this.getPremiumFeatures('free');
        user.premiumExpiry = 0;
        user.subscription.plan = 'free';
        user.subscription.endDate = Date.now();
        user.limitTotal = user.premiumFeatures.dailyLimit;
        
        await this.saveData();
        return user;
    }

    async checkPremiumExpiry(userId) {
        const user = await this.getUser(userId);
        if (!user.isPremium || !user.premiumExpiry) return user;
        
        if (Date.now() > user.premiumExpiry) {
            await this.downgradeToFree(userId);
        }
        return user;
    }

    getPremiumPrice(type) {
        const prices = {
            basic: 50000,
            premium: 100000,
            vip: 200000
        };
        return prices[type] || 0;
    }

    async updateUsageStats(userId, type) {
        const user = await this.getUser(userId);
        const now = new Date();
        const lastReset = new Date(user.usage.lastUsageReset);
        
        if (now.getDate() !== lastReset.getDate()) {
            user.usage.dailyCommands = 0;
            user.usage.aiRequests = 0;
            user.usage.downloadRequests = 0;
            user.usage.lastUsageReset = Date.now();
        }
        
        switch (type) {
            case 'command':
                user.usage.dailyCommands++;
                user.usage.weeklyCommands++;
                user.usage.monthlyCommands++;
                user.stats.commandsCount++;
                break;
            case 'ai':
                user.usage.aiRequests++;
                user.stats.totalAiQueries++;
                break;
            case 'download':
                user.usage.downloadRequests++;
                user.stats.totalDownloads++;
                break;
        }
        
        await this.saveData();
        return user;
    }

    async canUseFeature(userId, feature) {
        const user = await this.checkPremiumExpiry(userId);
        const features = user.premiumFeatures;
        
        switch (feature) {
            case 'ai':
                return user.usage.aiRequests < features.aiRequests;
            case 'download':
                return user.usage.downloadRequests < features.downloadLimit;
            case 'command':
                return user.usage.dailyCommands < features.dailyLimit;
            case 'customCommands':
                return features.customCommands;
            case 'advancedGames':
                return features.advancedGames;
            case 'bulkDownload':
                return features.bulkDownload;
            case 'higherQuality':
                return features.higherQuality;
            default:
                return true;
        }
    }

    async getPremiumUsers() {
        const users = Object.values(this.data.users);
        return users.filter(user => user.isPremium);
    }

    async getUsersByPremiumType(type) {
        const users = Object.values(this.data.users);
        return users.filter(user => user.premiumType === type);
    }
}

// Create singleton instance
const database = new Database();

// Export functions for compatibility
module.exports = {
    initDatabase: () => database.init(),
    getUserData: (userId) => database.getUser(userId),
    updateUserData: (userId, data) => database.updateUser(userId, data),
    updateUserLimit: (userId) => database.updateUserLimit(userId),
    updateUserPoints: (userId, points) => database.updateUserPoints(userId, points),
    updateUserXP: (userId, xp) => database.updateUserXP(userId, xp),
    getGroupData: (groupId) => database.getGroup(groupId),
    updateGroupData: (groupId, data) => database.updateGroup(groupId, data),
    addWarning: (groupId, userId, reason) => database.addWarning(groupId, userId, reason),
    removeWarning: (groupId, userId, warningId) => database.removeWarning(groupId, userId, warningId),
    getWarnings: (groupId, userId) => database.getWarnings(groupId, userId),
    saveGameSession: (chatId, gameData) => database.saveGameSession(chatId, gameData),
    getGameSession: (chatId) => database.getGameSession(chatId),
    deleteGameSession: (chatId) => database.deleteGameSession(chatId),
    updateGameStats: (userId, gameType, won) => database.updateGameStats(userId, gameType, won),
    getSetting: (key, defaultValue) => database.getSetting(key, defaultValue),
    setSetting: (key, value) => database.setSetting(key, value),
    updateStats: (type, increment) => database.updateStats(type, increment),
    getStats: () => database.getStats(),
    backupDatabase: () => database.backup(),
    setAfkUser: (userId, reason, username) => database.setAfkUser(userId, reason, username),
    getAfkUser: (userId) => database.getAfkUser(userId),
    removeAfkUser: (userId) => database.removeAfkUser(userId),
    getAllAfkUsers: () => database.getAllAfkUsers(),
    setMuteStatus: (groupId, isMuted) => database.setMuteStatus(groupId, isMuted),
    getMuteStatus: (groupId) => database.getMuteStatus(groupId),
    addWarning: (groupId, userId, reason) => database.addWarning(groupId, userId, reason),
    getWarnings: (groupId, userId) => database.getWarnings(groupId, userId),
    removeWarning: (groupId, userId, warningId) => database.removeWarning(groupId, userId, warningId),
    resetWarnings: (groupId, userId) => database.resetWarnings(groupId, userId),
    cleanupDatabase: () => database.cleanup(),
    searchUsers: (query) => database.searchUsers(query),
    getTopUsers: (limit, sortBy) => database.getTopUsers(limit, sortBy),
    
    // Premium functions
    upgradeToPremium: (userId, type, duration) => database.upgradeToPremium(userId, type, duration),
    downgradeToFree: (userId) => database.downgradeToFree(userId),
    checkPremiumExpiry: (userId) => database.checkPremiumExpiry(userId),
    updateUsageStats: (userId, type) => database.updateUsageStats(userId, type),
    canUseFeature: (userId, feature) => database.canUseFeature(userId, feature),
    getPremiumUsers: () => database.getPremiumUsers(),
    getUsersByPremiumType: (type) => database.getUsersByPremiumType(type),
    
    // Direct access to database instance
    database,
    Database
};
