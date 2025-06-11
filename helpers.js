const fs = require('fs').promises;
const path = require('path');

// Time-based greeting function
function getTimeGreeting() {
    const now = new Date();
    // Convert to Indonesia timezone (WIB/UTC+7)
    const jakartaTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const hour = jakartaTime.getHours();
    
    if (hour >= 5 && hour < 12) {
        return 'pagi';
    } else if (hour >= 12 && hour < 15) {
        return 'siang';
    } else if (hour >= 15 && hour < 18) {
        return 'sore';
    } else {
        return 'malam';
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format duration in seconds to readable format
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Clean temporary files older than specified age
async function cleanupTempFiles(tempDir, maxAgeHours = 24) {
    try {
        const files = await fs.readdir(tempDir);
        const now = Date.now();
        const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds
        
        let cleanedCount = 0;
        
        for (const file of files) {
            const filePath = path.join(tempDir, file);
            const stats = await fs.stat(filePath);
            
            if (now - stats.mtime.getTime() > maxAge) {
                await fs.unlink(filePath);
                cleanedCount++;
            }
        }
        
        console.log(`Cleaned up ${cleanedCount} temporary files older than ${maxAgeHours} hours`);
        return cleanedCount;
    } catch (error) {
        console.error('Error cleaning temp files:', error);
        return 0;
    }
}

// Validate URL format
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Extract mentions from message text
function extractMentions(text) {
    const mentionRegex = /@(\d+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
        mentions.push(`${match[1]}@c.us`);
    }
    
    return mentions;
}

// Sanitize filename for safe file operations
function sanitizeFilename(filename) {
    return filename
        .replace(/[^\w\s.-]/g, '') // Remove special characters except dots, spaces, and hyphens
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .substring(0, 100); // Limit length
}

// Generate random string for temporary file names
function generateRandomId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Escape markdown characters for WhatsApp
function escapeMarkdown(text) {
    return text
        .replace(/\*/g, '\\*')
        .replace(/_/g, '\\_')
        .replace(/~/g, '\\~')
        .replace(/`/g, '\\`');
}

// Check if user is group admin
async function isGroupAdmin(message, userId) {
    try {
        const chat = await message.getChat();
        if (!chat.isGroup) return false;
        
        const participants = chat.participants;
        const participant = participants.find(p => p.id._serialized === userId);
        
        return participant ? participant.isAdmin : false;
    } catch (error) {
        console.error('Error checking group admin:', error);
        return false;
    }
}

// Check if bot is group admin
async function isBotAdmin(chat) {
    try {
        if (!chat.isGroup) return false;
        
        const participants = chat.participants;
        const botParticipant = participants.find(p => p.id._serialized.includes('6288228836758'));
        
        return botParticipant ? botParticipant.isAdmin : false;
    } catch (error) {
        console.error('Error checking bot admin:', error);
        return false;
    }
}

// Calculate user level based on XP
function calculateLevel(xp) {
    const levels = [
        { level: 1, name: '🌱 Newbie', xpRequired: 0, nextLevelXP: 100 },
        { level: 2, name: '🌿 Beginner', xpRequired: 100, nextLevelXP: 250 },
        { level: 3, name: '🍃 Amateur', xpRequired: 250, nextLevelXP: 500 },
        { level: 4, name: '🌳 Intermediate', xpRequired: 500, nextLevelXP: 1000 },
        { level: 5, name: '🏆 Advanced', xpRequired: 1000, nextLevelXP: 2000 },
        { level: 6, name: '⭐ Expert', xpRequired: 2000, nextLevelXP: 4000 },
        { level: 7, name: '💎 Master', xpRequired: 4000, nextLevelXP: 8000 },
        { level: 8, name: '👑 Legend', xpRequired: 8000, nextLevelXP: 15000 },
        { level: 9, name: '🔥 Mythic', xpRequired: 15000, nextLevelXP: 25000 },
        { level: 10, name: '✨ Divine', xpRequired: 25000, nextLevelXP: null }
    ];
    
    let currentLevel = levels[0];
    
    for (let i = levels.length - 1; i >= 0; i--) {
        if (xp >= levels[i].xpRequired) {
            currentLevel = levels[i];
            break;
        }
    }
    
    const nextLevel = levels.find(l => l.level === currentLevel.level + 1);
    const xpToNext = nextLevel ? nextLevel.xpRequired - xp : 0;
    
    return {
        level: currentLevel.level,
        name: currentLevel.name,
        xpRequired: currentLevel.xpRequired,
        nextLevelXP: currentLevel.nextLevelXP,
        nextLevelName: nextLevel ? nextLevel.name : 'MAX',
        xpToNext: xpToNext
    };
}

// Format number with thousand separators
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

module.exports = {
    getTimeGreeting,
    formatFileSize,
    formatDuration,
    cleanupTempFiles,
    isValidUrl,
    extractMentions,
    sanitizeFilename,
    generateRandomId,
    escapeMarkdown,
    isGroupAdmin,
    isBotAdmin,
    calculateLevel,
    formatNumber
};