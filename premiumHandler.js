const { Database } = require('../utils/database');
const loadingIndicator = require('../utils/loadingIndicator');

class PremiumHandler {
    constructor() {
        this.database = new Database();
    }

    async handleCommand(command, args, message, contact, chat, client) {
        try {
            const userId = contact.id._serialized;
            
            switch (command) {
                case 'premium':
                    return await this.showPremiumInfo(message, userId);
                case 'upgrade':
                    return await this.upgradePremium(message, userId, args);
                case 'downgrade':
                    return await this.downgradePremium(message, userId);
                case 'premiumstatus':
                case 'status':
                    return await this.showUserStatus(message, userId, contact);
                case 'premiumusers':
                    return await this.listPremiumUsers(message);
                case 'giftpremium':
                    return await this.giftPremium(message, userId, args, contact);
                case 'premiumfeatures':
                    return await this.showPremiumFeatures(message, userId);
                case 'usage':
                    return await this.showUsageStats(message, userId);
                case 'subscription':
                    return await this.showSubscriptionInfo(message, userId);
                default:
                    return { error: 'Unknown premium command' };
            }
        } catch (error) {
            console.error('Premium handler error:', error);
            return { error: error.message };
        }
    }

    async showPremiumInfo(message, userId) {
        try {
            const user = await this.database.getUser(userId);
            const isOwner = userId === '6281331143218@c.us';
            
            let premiumText = `💎 *PREMIUM MEMBERSHIP INFO*\n\n`;
            
            if (user.isPremium) {
                premiumText += `✅ *Status:* Premium Active\n`;
                premiumText += `🏆 *Plan:* ${user.premiumType.toUpperCase()}\n`;
                
                if (user.premiumExpiry && user.premiumType !== 'owner') {
                    const expiryDate = new Date(user.premiumExpiry);
                    const daysLeft = Math.ceil((user.premiumExpiry - Date.now()) / (1000 * 60 * 60 * 24));
                    premiumText += `⏰ *Expires:* ${expiryDate.toLocaleDateString()}\n`;
                    premiumText += `📅 *Days Left:* ${daysLeft} days\n\n`;
                } else {
                    premiumText += `⏰ *Expires:* Never (Lifetime)\n\n`;
                }
                
                premiumText += `🎯 *Your Benefits:*\n`;
                premiumText += `• Daily Commands: ${user.premiumFeatures.dailyLimit}\n`;
                premiumText += `• AI Requests: ${user.premiumFeatures.aiRequests}\n`;
                premiumText += `• Downloads: ${user.premiumFeatures.downloadLimit}\n`;
                premiumText += `• File Size Limit: ${user.premiumFeatures.fileSize}\n`;
                
                if (user.premiumFeatures.customCommands) premiumText += `• ✅ Custom Commands\n`;
                if (user.premiumFeatures.prioritySupport) premiumText += `• ✅ Priority Support\n`;
                if (user.premiumFeatures.advancedGames) premiumText += `• ✅ Advanced Games\n`;
                if (user.premiumFeatures.bulkDownload) premiumText += `• ✅ Bulk Downloads\n`;
                if (user.premiumFeatures.higherQuality) premiumText += `• ✅ Higher Quality\n`;
                
            } else {
                premiumText += `❌ *Status:* Free User\n\n`;
                
                premiumText += `🆙 *UPGRADE BENEFITS:*\n\n`;
                
                premiumText += `💰 *BASIC PLAN - Rp 50.000/month*\n`;
                premiumText += `• 100 daily commands\n`;
                premiumText += `• 25 AI requests\n`;
                premiumText += `• 50 downloads\n`;
                premiumText += `• 100MB file limit\n`;
                premiumText += `• Custom commands\n`;
                premiumText += `• Advanced games\n\n`;
                
                premiumText += `⭐ *PREMIUM PLAN - Rp 100.000/month*\n`;
                premiumText += `• 500 daily commands\n`;
                premiumText += `• 100 AI requests\n`;
                premiumText += `• 200 downloads\n`;
                premiumText += `• 500MB file limit\n`;
                premiumText += `• Priority support\n`;
                premiumText += `• Bulk downloads\n`;
                premiumText += `• Higher quality\n\n`;
                
                premiumText += `💎 *VIP PLAN - Rp 200.000/month*\n`;
                premiumText += `• 2000 daily commands\n`;
                premiumText += `• 500 AI requests\n`;
                premiumText += `• 1000 downloads\n`;
                premiumText += `• 1GB file limit\n`;
                premiumText += `• All premium features\n`;
                premiumText += `• VIP support\n\n`;
                
                if (!isOwner) {
                    premiumText += `📱 *Commands:*\n`;
                    premiumText += `• .upgrade basic/premium/vip\n`;
                    premiumText += `• .premiumstatus - Check status\n`;
                    premiumText += `• .usage - View usage stats\n`;
                }
            }
            
            await message.reply(premiumText);
            return { success: true };
        } catch (error) {
            console.error('Show premium info error:', error);
            return { error: error.message };
        }
    }

    async upgradePremium(message, userId, args) {
        try {
            const isOwner = userId === '6281331143218@c.us';
            
            if (!isOwner) {
                await message.reply('❌ Premium upgrade saat ini hanya bisa dilakukan oleh owner. Hubungi @6281331143218 untuk upgrade premium.');
                return { error: 'Not authorized' };
            }
            
            if (args.length < 2) {
                await message.reply('❌ Format: .upgrade <user_id> <plan>\n\nPlan: basic, premium, vip\nContoh: .upgrade 628123456789 premium');
                return { error: 'Invalid format' };
            }
            
            let targetUserId = args[0];
            const plan = args[1].toLowerCase();
            
            // Add @c.us if not present
            if (!targetUserId.includes('@c.us')) {
                targetUserId = `${targetUserId}@c.us`;
            }
            
            const validPlans = ['basic', 'premium', 'vip'];
            if (!validPlans.includes(plan)) {
                await message.reply('❌ Plan tidak valid. Pilihan: basic, premium, vip');
                return { error: 'Invalid plan' };
            }
            
            // Default duration: 30 days
            const duration = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
            
            await this.database.upgradeToPremium(targetUserId, plan, duration);
            
            const upgradeText = `✅ *UPGRADE BERHASIL*\n\n` +
                `👤 *User:* ${targetUserId.replace('@c.us', '')}\n` +
                `💎 *Plan:* ${plan.toUpperCase()}\n` +
                `⏰ *Duration:* 30 days\n` +
                `💰 *Price:* Rp ${this.database.getPremiumPrice(plan).toLocaleString()}\n\n` +
                `User telah diupgrade ke premium ${plan}!`;
            
            await message.reply(upgradeText);
            return { success: true };
        } catch (error) {
            console.error('Upgrade premium error:', error);
            return { error: error.message };
        }
    }

    async downgradePremium(message, userId) {
        try {
            const isOwner = userId === '6281331143218@c.us';
            
            if (!isOwner) {
                await message.reply('❌ Hanya owner yang bisa melakukan downgrade.');
                return { error: 'Not authorized' };
            }
            
            // Implementation for downgrading users
            await message.reply('⚠️ Fitur downgrade akan segera tersedia. Gunakan database management untuk saat ini.');
            return { success: true };
        } catch (error) {
            console.error('Downgrade premium error:', error);
            return { error: error.message };
        }
    }

    async showUserStatus(message, userId, contact) {
        try {
            let loadingId = await loadingIndicator.startTextGeneration(message, 'analysis');
            
            const user = await this.database.checkPremiumExpiry(userId);
            const userName = contact.pushname || contact.name || 'User';
            
            let statusText = `👤 *USER STATUS*\n\n`;
            statusText += `📱 *Name:* ${userName}\n`;
            statusText += `🆔 *ID:* ${userId.replace('@c.us', '')}\n`;
            statusText += `💎 *Plan:* ${user.premiumType.toUpperCase()}\n`;
            statusText += `⭐ *Level:* ${user.level}\n`;
            statusText += `✨ *XP:* ${user.xp.toLocaleString()}\n`;
            statusText += `💰 *Points:* ${user.points.toLocaleString()}\n\n`;
            
            if (user.isPremium && user.premiumExpiry) {
                const expiryDate = new Date(user.premiumExpiry);
                const daysLeft = Math.ceil((user.premiumExpiry - Date.now()) / (1000 * 60 * 60 * 24));
                statusText += `⏰ *Premium Until:* ${expiryDate.toLocaleDateString()}\n`;
                statusText += `📅 *Days Remaining:* ${daysLeft} days\n\n`;
            } else if (user.isPremium) {
                statusText += `⏰ *Premium:* Lifetime\n\n`;
            }
            
            statusText += `📊 *DAILY USAGE:*\n`;
            statusText += `• Commands: ${user.usage.dailyCommands}/${user.premiumFeatures.dailyLimit}\n`;
            statusText += `• AI Requests: ${user.usage.aiRequests}/${user.premiumFeatures.aiRequests}\n`;
            statusText += `• Downloads: ${user.usage.downloadRequests}/${user.premiumFeatures.downloadLimit}\n\n`;
            
            statusText += `🏆 *STATISTICS:*\n`;
            statusText += `• Total Commands: ${user.stats.commandsCount.toLocaleString()}\n`;
            statusText += `• Games Won: ${user.stats.gamesWon}\n`;
            statusText += `• Games Played: ${user.stats.gamesPlayed}\n`;
            statusText += `• Total Downloads: ${user.stats.totalDownloads}\n`;
            statusText += `• AI Queries: ${user.stats.totalAiQueries}\n`;
            
            if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Status loaded', true);
            await message.reply(statusText);
            return { success: true };
        } catch (error) {
            console.error('Show user status error:', error);
            return { error: error.message };
        }
    }

    async listPremiumUsers(message) {
        try {
            const premiumUsers = await this.database.getPremiumUsers();
            
            if (premiumUsers.length === 0) {
                await message.reply('📊 Belum ada user premium saat ini.');
                return { success: true };
            }
            
            let premiumText = `💎 *PREMIUM USERS LIST*\n\n`;
            
            const usersByType = {
                owner: premiumUsers.filter(u => u.premiumType === 'owner'),
                vip: premiumUsers.filter(u => u.premiumType === 'vip'),
                premium: premiumUsers.filter(u => u.premiumType === 'premium'),
                basic: premiumUsers.filter(u => u.premiumType === 'basic')
            };
            
            Object.entries(usersByType).forEach(([type, users]) => {
                if (users.length > 0) {
                    premiumText += `👑 *${type.toUpperCase()} (${users.length}):*\n`;
                    users.forEach((user, index) => {
                        const userId = user.id.replace('@c.us', '');
                        const expiry = user.premiumExpiry ? 
                            new Date(user.premiumExpiry).toLocaleDateString() : 'Lifetime';
                        premiumText += `${index + 1}. ${userId} (${expiry})\n`;
                    });
                    premiumText += '\n';
                }
            });
            
            premiumText += `📊 *Total Premium Users:* ${premiumUsers.length}`;
            
            await message.reply(premiumText);
            return { success: true };
        } catch (error) {
            console.error('List premium users error:', error);
            return { error: error.message };
        }
    }

    async giftPremium(message, userId, args, contact) {
        try {
            const isOwner = userId === '6281331143218@c.us';
            
            if (!isOwner) {
                await message.reply('❌ Hanya owner yang bisa memberikan gift premium.');
                return { error: 'Not authorized' };
            }
            
            // Implementation for gifting premium
            await message.reply('🎁 Fitur gift premium akan segera tersedia!');
            return { success: true };
        } catch (error) {
            console.error('Gift premium error:', error);
            return { error: error.message };
        }
    }

    async showPremiumFeatures(message, userId) {
        try {
            const user = await this.database.getUser(userId);
            
            let featuresText = `💎 *PREMIUM FEATURES COMPARISON*\n\n`;
            
            featuresText += `🆓 *FREE PLAN:*\n`;
            featuresText += `• 20 daily commands\n`;
            featuresText += `• 5 AI requests\n`;
            featuresText += `• 10 downloads\n`;
            featuresText += `• 50MB file limit\n`;
            featuresText += `• Basic games\n\n`;
            
            featuresText += `💰 *BASIC PLAN (Rp 50K):*\n`;
            featuresText += `• 100 daily commands\n`;
            featuresText += `• 25 AI requests\n`;
            featuresText += `• 50 downloads\n`;
            featuresText += `• 100MB file limit\n`;
            featuresText += `• Custom commands\n`;
            featuresText += `• Advanced games\n`;
            featuresText += `• Custom stickers\n\n`;
            
            featuresText += `⭐ *PREMIUM PLAN (Rp 100K):*\n`;
            featuresText += `• 500 daily commands\n`;
            featuresText += `• 100 AI requests\n`;
            featuresText += `• 200 downloads\n`;
            featuresText += `• 500MB file limit\n`;
            featuresText += `• Priority support\n`;
            featuresText += `• Bulk downloads\n`;
            featuresText += `• Higher quality\n`;
            featuresText += `• All basic features\n\n`;
            
            featuresText += `💎 *VIP PLAN (Rp 200K):*\n`;
            featuresText += `• 2000 daily commands\n`;
            featuresText += `• 500 AI requests\n`;
            featuresText += `• 1000 downloads\n`;
            featuresText += `• 1GB file limit\n`;
            featuresText += `• VIP support\n`;
            featuresText += `• All premium features\n\n`;
            
            featuresText += `🎯 *Your Current Plan:* ${user.premiumType.toUpperCase()}\n`;
            featuresText += `📱 Type .premium for upgrade info!`;
            
            await message.reply(featuresText);
            return { success: true };
        } catch (error) {
            console.error('Show premium features error:', error);
            return { error: error.message };
        }
    }

    async showUsageStats(message, userId) {
        try {
            const user = await this.database.checkPremiumExpiry(userId);
            
            let usageText = `📊 *USAGE STATISTICS*\n\n`;
            
            usageText += `🎯 *DAILY USAGE:*\n`;
            usageText += `• Commands: ${user.usage.dailyCommands}/${user.premiumFeatures.dailyLimit}\n`;
            usageText += `• AI Requests: ${user.usage.aiRequests}/${user.premiumFeatures.aiRequests}\n`;
            usageText += `• Downloads: ${user.usage.downloadRequests}/${user.premiumFeatures.downloadLimit}\n\n`;
            
            usageText += `📈 *TOTAL STATISTICS:*\n`;
            usageText += `• Total Commands: ${user.stats.commandsUsed.toLocaleString()}\n`;
            usageText += `• Total Downloads: ${user.stats.totalDownloads.toLocaleString()}\n`;
            usageText += `• Total AI Queries: ${user.stats.totalAiQueries.toLocaleString()}\n`;
            usageText += `• Games Played: ${user.stats.gamesPlayed}\n`;
            usageText += `• Games Won: ${user.stats.gamesWon}\n\n`;
            
            const usagePercentage = {
                commands: Math.round((user.usage.dailyCommands / user.premiumFeatures.dailyLimit) * 100),
                ai: Math.round((user.usage.aiRequests / user.premiumFeatures.aiRequests) * 100),
                downloads: Math.round((user.usage.downloadRequests / user.premiumFeatures.downloadLimit) * 100)
            };
            
            usageText += `📊 *USAGE PERCENTAGE:*\n`;
            usageText += `• Commands: ${usagePercentage.commands}%\n`;
            usageText += `• AI: ${usagePercentage.ai}%\n`;
            usageText += `• Downloads: ${usagePercentage.downloads}%\n\n`;
            
            if (!user.isPremium) {
                usageText += `💎 Upgrade to premium for higher limits!\nType .premium for details.`;
            }
            
            await message.reply(usageText);
            return { success: true };
        } catch (error) {
            console.error('Show usage stats error:', error);
            return { error: error.message };
        }
    }

    async showSubscriptionInfo(message, userId) {
        try {
            const user = await this.database.checkPremiumExpiry(userId);
            
            let subText = `📋 *SUBSCRIPTION INFO*\n\n`;
            
            subText += `💎 *Current Plan:* ${user.subscription.plan.toUpperCase()}\n`;
            subText += `📅 *Start Date:* ${new Date(user.subscription.startDate).toLocaleDateString()}\n`;
            
            if (user.subscription.endDate) {
                subText += `⏰ *End Date:* ${new Date(user.subscription.endDate).toLocaleDateString()}\n`;
                const daysLeft = Math.ceil((user.subscription.endDate - Date.now()) / (1000 * 60 * 60 * 24));
                subText += `📊 *Days Left:* ${daysLeft} days\n`;
            } else {
                subText += `⏰ *End Date:* Never (Lifetime)\n`;
            }
            
            subText += `🔄 *Auto Renew:* ${user.subscription.autoRenew ? 'Yes' : 'No'}\n\n`;
            
            if (user.subscription.paymentHistory.length > 0) {
                subText += `💳 *PAYMENT HISTORY:*\n`;
                user.subscription.paymentHistory.slice(-3).forEach((payment, index) => {
                    const date = new Date(payment.date).toLocaleDateString();
                    subText += `${index + 1}. ${payment.plan.toUpperCase()} - ${date} - Rp ${payment.amount.toLocaleString()}\n`;
                });
            }
            
            await message.reply(subText);
            return { success: true };
        } catch (error) {
            console.error('Show subscription info error:', error);
            return { error: error.message };
        }
    }
}

module.exports = PremiumHandler;