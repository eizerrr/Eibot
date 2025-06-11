const config = require('../config/config');
const { isGroupAdmin, isBotAdmin, formatNumber } = require('../utils/helpers');
const { getUserData, updateUserData, getGroupData, updateGroupData, setAfkUser, getAfkUser, removeAfkUser, getAllAfkUsers, setMuteStatus, getMuteStatus, addWarning, getWarnings, removeWarning, resetWarnings } = require('../utils/database');

class GroupHandler {
    constructor() {
        this.activeVotes = new Map();
        this.activeAbsence = new Map();
        this.groupSettings = new Map();
    }

    async handleCommand(command, args, message, contact, chat, client) {
        try {
            // Check if command is for group only
            if (!chat.isGroup) {
                return { error: 'Group only command' };
            }

            const userId = contact.id._serialized;
            const groupId = chat.id._serialized;
            const isAdmin = await isGroupAdmin(message, contact.id._serialized);
            const isBotGroupAdmin = await isBotAdmin(chat);

            switch (command) {
                case 'groupinfo':
                    return await this.getGroupInfo(message, chat);

                case 'groupadmin':
                    return await this.listGroupAdmins(message, chat);

                case 'tagall':
                    if (!isAdmin) {
                        await message.reply(config.ERRORS.ADMIN_ONLY);
                        return { error: 'Admin only' };
                    }
                    return await this.tagAllMembers(message, chat, args.join(' '));

                case 'hidetag':
                    if (!isAdmin) {
                        await message.reply(config.ERRORS.ADMIN_ONLY);
                        return { error: 'Admin only' };
                    }
                    return await this.hideTagMembers(message, chat, args.join(' '));

                case 'kick':
                    if (!isAdmin) {
                        await message.reply(config.ERRORS.ADMIN_ONLY);
                        return { error: 'Admin only' };
                    }
                    if (!isBotGroupAdmin) {
                        await message.reply('❌ Bot bukan admin grup');
                        return { error: 'Bot not admin' };
                    }
                    return await this.kickMember(message, chat, client);

                case 'promote':
                    if (!isAdmin) {
                        await message.reply(config.ERRORS.ADMIN_ONLY);
                        return { error: 'Admin only' };
                    }
                    if (!isBotGroupAdmin) {
                        await message.reply('❌ Bot bukan admin grup');
                        return { error: 'Bot not admin' };
                    }
                    return await this.promoteMember(message, chat, client);

                case 'demote':
                    if (!isAdmin) {
                        await message.reply(config.ERRORS.ADMIN_ONLY);
                        return { error: 'Admin only' };
                    }
                    if (!isBotGroupAdmin) {
                        await message.reply('❌ Bot bukan admin grup');
                        return { error: 'Bot not admin' };
                    }
                    return await this.demoteMember(message, chat, client);

                case 'grouplink':
                    if (!isAdmin) {
                        await message.reply(config.ERRORS.ADMIN_ONLY);
                        return { error: 'Admin only' };
                    }
                    return await this.getGroupLink(message, chat);

                case 'revoke':
                    if (!isAdmin) {
                        await message.reply(config.ERRORS.ADMIN_ONLY);
                        return { error: 'Admin only' };
                    }
                    if (!isBotGroupAdmin) {
                        await message.reply('❌ Bot bukan admin grup');
                        return { error: 'Bot not admin' };
                    }
                    return await this.revokeGroupLink(message, chat);

                case 'setdesc':
                    if (!isAdmin) {
                        await message.reply(config.ERRORS.ADMIN_ONLY);
                        return { error: 'Admin only' };
                    }
                    if (!isBotGroupAdmin) {
                        await message.reply('❌ Bot bukan admin grup');
                        return { error: 'Bot not admin' };
                    }
                    return await this.setGroupDescription(message, chat, args.join(' '));

                case 'setname':
                    if (!isAdmin) {
                        await message.reply(config.ERRORS.ADMIN_ONLY);
                        return { error: 'Admin only' };
                    }
                    if (!isBotGroupAdmin) {
                        await message.reply('❌ Bot bukan admin grup');
                        return { error: 'Bot not admin' };
                    }
                    return await this.setGroupName(message, chat, args.join(' '));

                case 'vote':
                    return await this.createVote(message, chat, args, userId);

                case 'absensi':
                    if (!isAdmin) {
                        await message.reply(config.ERRORS.ADMIN_ONLY);
                        return { error: 'Admin only' };
                    }
                    return await this.startAbsence(message, chat, args.join(' '));

                case 'absen':
                    return await this.recordAbsence(message, chat, userId, contact.pushname || contact.name || 'User');

                case 'cekabsen':
                    return await this.checkAbsence(message, chat);

                case 'warn':
                    if (!isAdmin) {
                        await message.reply(config.ERRORS.ADMIN_ONLY);
                        return { error: 'Admin only' };
                    }
                    return await this.warnMember(message, chat, args.join(' '));

                case 'resetwarn':
                    if (!isAdmin) {
                        await message.reply(config.ERRORS.ADMIN_ONLY);
                        return { error: 'Admin only' };
                    }
                    return await this.resetWarns(message, chat);

                case 'antilink':
                    if (!isAdmin) {
                        await message.reply(config.ERRORS.ADMIN_ONLY);
                        return { error: 'Admin only' };
                    }
                    return await this.toggleAntilink(message, chat, groupId, args);

                case 'welcome':
                    if (!isAdmin) {
                        await message.reply(config.ERRORS.ADMIN_ONLY);
                        return { error: 'Admin only' };
                    }
                    return await this.toggleWelcome(message, chat, groupId);

                case 'setwelcometype':
                    if (!isAdmin) {
                        await message.reply(config.ERRORS.ADMIN_ONLY);
                        return { error: 'Admin only' };
                    }
                    return await this.setWelcomeType(message, chat, groupId, args);

                case 'testwelcome':
                    if (!isAdmin) {
                        await message.reply(config.ERRORS.ADMIN_ONLY);
                        return { error: 'Admin only' };
                    }
                    return await this.testWelcome(message, chat, contact);

                case 'afk':
                    return await this.setAfk(message, contact, args.join(' '));

                case 'mute':
                    if (!isAdmin) {
                        await message.reply(config.ERRORS.ADMIN_ONLY);
                        return { error: 'Admin only' };
                    }
                    return await this.handleMute(message, chat, args[0], groupId);

                default:
                    return { error: 'Unknown command' };
            }
        } catch (error) {
            console.error('Group handler error:', error);
            return { error: error.message };
        }
    }

    async setWelcomeType(message, chat, groupId, args) {
        try {
            const { Database } = require('../utils/database');
            const db = new Database();
            
            if (args.length === 0) {
                const groupData = await db.getGroup(groupId);
                const currentType = groupData.welcomeType || 1;
                
                const helpText = `*🎉 WELCOME TYPE SETTINGS*

*Available types:*
• .setwelcometype 1 - Simple welcome
• .setwelcometype 2 - Mobile Legends style welcome
• .setwelcometype off - Disable welcome

*Current setting:* Type ${currentType}`;
                
                await message.reply(helpText);
                return { success: true };
            }

            const type = args[0].toLowerCase();
            
            switch (type) {
                case '1':
                    await db.updateGroup(groupId, { 
                        welcomeType: 1,
                        welcome: { enabled: true }
                    });
                    await message.reply('✅ Welcome type set to: Simple welcome\n\nNew members akan mendapat sapaan sederhana.');
                    break;
                    
                case '2':
                    await db.updateGroup(groupId, { 
                        welcomeType: 2,
                        welcome: { enabled: true }
                    });
                    await message.reply('✅ Welcome type set to: Mobile Legends style\n\nNew members akan mendapat welcome dengan bio form dan profile picture.');
                    break;
                    
                case 'off':
                    await db.updateGroup(groupId, { 
                        welcome: { enabled: false }
                    });
                    await message.reply('❌ Welcome message disabled\n\nTidak ada pesan sambutan untuk member baru.');
                    break;
                    
                default:
                    await message.reply('❌ Invalid welcome type. Use: 1, 2, or off');
                    return { error: 'Invalid type' };
            }
            
            return { success: true };
        } catch (error) {
            console.error('Set welcome type error:', error);
            await message.reply('❌ Gagal mengubah welcome type.');
            return { error: error.message };
        }
    }

    async testWelcome(message, chat, contact) {
        try {
            const { Database } = require('../utils/database');
            const db = new Database();
            
            const groupData = await db.getGroup(chat.id._serialized);
            
            // Get the bot instance reference
            const clientInfo = message.client || message._data?.from?.client;
            if (clientInfo && clientInfo.sendWelcomeMessage) {
                await clientInfo.sendWelcomeMessage(chat, contact, groupData);
            } else {
                await message.reply('🧪 Testing welcome system...\n\nThis would trigger the welcome message for new members.');
            }
            
            return { success: true };
        } catch (error) {
            console.error('Test welcome error:', error);
            await message.reply('❌ Gagal menguji welcome message.');
            return { error: error.message };
        }
    }

    async toggleWelcome(message, chat, groupId) {
        try {
            const { Database } = require('../utils/database');
            const db = new Database();
            
            const groupData = await db.getGroup(groupId);
            const currentStatus = groupData.welcome?.enabled !== false;
            const newStatus = !currentStatus;
            
            await db.updateGroup(groupId, {
                welcome: {
                    ...groupData.welcome,
                    enabled: newStatus
                }
            });
            
            console.log(`Welcome toggled for group ${groupId}: ${newStatus}`);
            await message.reply(`✅ Welcome message telah ${newStatus ? 'diaktifkan' : 'dinonaktifkan'} untuk grup ini`);
            
            return { success: true };
        } catch (error) {
            console.error('Toggle welcome error:', error);
            await message.reply('❌ Terjadi kesalahan saat mengubah pengaturan welcome');
            return { error: error.message };
        }
    }

    // Add other missing methods with basic implementations
    async getGroupInfo(message, chat) {
        try {
            const groupInfo = `*📋 GROUP INFO*\n\nName: ${chat.name}\nDescription: ${chat.description || 'No description'}\nParticipants: ${chat.participants.length}\nCreated: ${new Date(chat.createdAt * 1000).toLocaleDateString()}`;
            await message.reply(groupInfo);
            return { success: true };
        } catch (error) {
            console.error('Get group info error:', error);
            return { error: error.message };
        }
    }

    async listGroupAdmins(message, chat) {
        try {
            const admins = chat.participants.filter(p => p.isAdmin);
            let adminList = '*👑 GROUP ADMINS*\n\n';
            admins.forEach((admin, index) => {
                adminList += `${index + 1}. @${admin.id.user}\n`;
            });
            
            const mentions = admins.map(admin => admin.id._serialized);
            await message.reply(adminList, undefined, { mentions });
            return { success: true };
        } catch (error) {
            console.error('List group admins error:', error);
            return { error: error.message };
        }
    }

    async tagAllMembers(message, chat, text) {
        try {
            const mentions = chat.participants.map(p => p.id._serialized);
            const tagText = text || 'Tag all members';
            await chat.sendMessage(`${tagText}\n\n${chat.participants.map(p => `@${p.id.user}`).join(' ')}`, { mentions });
            return { success: true };
        } catch (error) {
            console.error('Tag all members error:', error);
            return { error: error.message };
        }
    }

    async hideTagMembers(message, chat, text) {
        try {
            const mentions = chat.participants.map(p => p.id._serialized);
            const tagText = text || 'Hidden tag to all members';
            await chat.sendMessage(tagText, { mentions });
            return { success: true };
        } catch (error) {
            console.error('Hide tag members error:', error);
            return { error: error.message };
        }
    }

    async kickMember(message, chat, client) {
        try {
            if (!message.hasQuotedMsg && (!message.mentionedIds || message.mentionedIds.length === 0)) {
                await message.reply('❌ Reply pesan member atau mention member yang ingin dikick');
                return { error: 'No target' };
            }

            let targetId;
            if (message.hasQuotedMsg) {
                const quotedMsg = await message.getQuotedMessage();
                targetId = quotedMsg.author || quotedMsg.from;
            } else {
                targetId = message.mentionedIds[0];
            }

            await chat.removeParticipants([targetId]);
            await message.reply(`✅ Member berhasil dikick dari grup`);
            return { success: true };
        } catch (error) {
            console.error('Kick member error:', error);
            await message.reply('❌ Gagal kick member. Pastikan bot adalah admin dan target bukan admin lain.');
            return { error: error.message };
        }
    }

    async promoteMember(message, chat, client) {
        try {
            if (!message.mentionedIds || message.mentionedIds.length === 0) {
                await message.reply('❌ Mention member yang ingin dipromote menjadi admin');
                return { error: 'No target' };
            }

            const targetId = message.mentionedIds[0];
            await chat.promoteParticipants([targetId]);
            await message.reply(`✅ @${targetId.replace('@c.us', '')} berhasil dipromote menjadi admin`, undefined, { mentions: [targetId] });
            return { success: true };
        } catch (error) {
            console.error('Promote member error:', error);
            await message.reply('❌ Gagal promote member.');
            return { error: error.message };
        }
    }

    async demoteMember(message, chat, client) {
        try {
            if (!message.mentionedIds || message.mentionedIds.length === 0) {
                await message.reply('❌ Mention admin yang ingin didemote');
                return { error: 'No target' };
            }

            const targetId = message.mentionedIds[0];
            await chat.demoteParticipants([targetId]);
            await message.reply(`✅ @${targetId.replace('@c.us', '')} berhasil didemote dari admin`, undefined, { mentions: [targetId] });
            return { success: true };
        } catch (error) {
            console.error('Demote member error:', error);
            await message.reply('❌ Gagal demote member.');
            return { error: error.message };
        }
    }

    async getGroupLink(message, chat) {
        try {
            const inviteCode = await chat.getInviteCode();
            await message.reply(`🔗 *GROUP LINK*\n\nhttps://chat.whatsapp.com/${inviteCode}`);
            return { success: true };
        } catch (error) {
            console.error('Get group link error:', error);
            await message.reply('❌ Gagal mendapatkan link grup.');
            return { error: error.message };
        }
    }

    async revokeGroupLink(message, chat) {
        try {
            await chat.revokeInvite();
            await message.reply('✅ Link grup berhasil direset. Link lama tidak berlaku lagi.');
            return { success: true };
        } catch (error) {
            console.error('Revoke group link error:', error);
            await message.reply('❌ Gagal reset link grup.');
            return { error: error.message };
        }
    }

    async setGroupDescription(message, chat, description) {
        try {
            if (!description) {
                await message.reply('❌ Masukkan deskripsi grup baru');
                return { error: 'No description' };
            }

            await chat.setDescription(description);
            await message.reply('✅ Deskripsi grup berhasil diubah');
            return { success: true };
        } catch (error) {
            console.error('Set group description error:', error);
            await message.reply('❌ Gagal mengubah deskripsi grup.');
            return { error: error.message };
        }
    }

    async setGroupName(message, chat, name) {
        try {
            if (!name) {
                await message.reply('❌ Masukkan nama grup baru');
                return { error: 'No name' };
            }

            await chat.setSubject(name);
            await message.reply('✅ Nama grup berhasil diubah');
            return { success: true };
        } catch (error) {
            console.error('Set group name error:', error);
            await message.reply('❌ Gagal mengubah nama grup.');
            return { error: error.message };
        }
    }

    async createVote(message, chat, args, userId) {
        try {
            if (args.length === 0) {
                await message.reply('❌ Format: .vote <pertanyaan>|<pilihan1>|<pilihan2>|...');
                return { error: 'Invalid format' };
            }

            const voteData = args.join(' ').split('|');
            const question = voteData[0];
            const options = voteData.slice(1);

            if (options.length < 2) {
                await message.reply('❌ Minimal 2 pilihan untuk voting');
                return { error: 'Not enough options' };
            }

            const voteId = `vote_${chat.id._serialized}_${Date.now()}`;
            const voteInfo = {
                question,
                options,
                votes: {},
                creator: userId,
                createdAt: Date.now()
            };

            this.activeVotes.set(voteId, voteInfo);

            let voteText = `🗳️ *VOTING*\n\n*Pertanyaan:* ${question}\n\n*Pilihan:*\n`;
            options.forEach((option, index) => {
                voteText += `${index + 1}. ${option}\n`;
            });
            voteText += `\nKetik angka (1-${options.length}) untuk memilih`;

            await message.reply(voteText);
            return { success: true };
        } catch (error) {
            console.error('Create vote error:', error);
            return { error: error.message };
        }
    }

    async startAbsence(message, chat, topic) {
        try {
            const absenceId = `absence_${chat.id._serialized}`;
            const absenceInfo = {
                topic: topic || 'Absensi',
                participants: [],
                startTime: Date.now()
            };

            this.activeAbsence.set(absenceId, absenceInfo);

            const absenceText = `📝 *ABSENSI DIMULAI*\n\nTopik: ${absenceInfo.topic}\nWaktu: ${new Date().toLocaleString('id-ID')}\n\nKetik .absen untuk hadir`;

            await message.reply(absenceText);
            return { success: true };
        } catch (error) {
            console.error('Start absence error:', error);
            return { error: error.message };
        }
    }

    async recordAbsence(message, chat, userId, userName) {
        try {
            const absenceId = `absence_${chat.id._serialized}`;
            const absenceInfo = this.activeAbsence.get(absenceId);

            if (!absenceInfo) {
                await message.reply('❌ Tidak ada absensi yang sedang berlangsung');
                return { error: 'No active absence' };
            }

            if (absenceInfo.participants.some(p => p.id === userId)) {
                await message.reply('❌ Anda sudah absen');
                return { error: 'Already recorded' };
            }

            absenceInfo.participants.push({
                id: userId,
                name: userName,
                time: Date.now()
            });

            await message.reply(`✅ ${userName} telah tercatat hadir`);
            return { success: true };
        } catch (error) {
            console.error('Record absence error:', error);
            return { error: error.message };
        }
    }

    async checkAbsence(message, chat) {
        try {
            const absenceId = `absence_${chat.id._serialized}`;
            const absenceInfo = this.activeAbsence.get(absenceId);

            if (!absenceInfo) {
                await message.reply('❌ Tidak ada absensi yang sedang berlangsung');
                return { error: 'No active absence' };
            }

            let absenceText = `📋 *HASIL ABSENSI*\n\nTopik: ${absenceInfo.topic}\nTotal Hadir: ${absenceInfo.participants.length}\n\n*Daftar Hadir:*\n`;

            absenceInfo.participants.forEach((participant, index) => {
                const time = new Date(participant.time).toLocaleTimeString('id-ID');
                absenceText += `${index + 1}. ${participant.name} (${time})\n`;
            });

            await message.reply(absenceText);
            return { success: true };
        } catch (error) {
            console.error('Check absence error:', error);
            return { error: error.message };
        }
    }

    async warnMember(message, chat, reason) {
        try {
            if (!message.mentionedIds || message.mentionedIds.length === 0) {
                await message.reply('❌ Mention member yang ingin diwarn');
                return { error: 'No target' };
            }

            const targetId = message.mentionedIds[0];
            const warnReason = reason || 'No reason provided';

            await addWarning(chat.id._serialized, targetId, warnReason);
            await message.reply(`⚠️ @${targetId.replace('@c.us', '')} telah diberi peringatan\n\nAlasan: ${warnReason}`, undefined, { mentions: [targetId] });
            
            return { success: true };
        } catch (error) {
            console.error('Warn member error:', error);
            return { error: error.message };
        }
    }

    async resetWarns(message, chat) {
        try {
            if (!message.mentionedIds || message.mentionedIds.length === 0) {
                await message.reply('❌ Mention member yang ingin direset warnnya');
                return { error: 'No target' };
            }

            const targetId = message.mentionedIds[0];
            await resetWarnings(chat.id._serialized, targetId);
            await message.reply(`✅ Warning @${targetId.replace('@c.us', '')} telah direset`, undefined, { mentions: [targetId] });
            
            return { success: true };
        } catch (error) {
            console.error('Reset warns error:', error);
            return { error: error.message };
        }
    }

    async toggleAntilink(message, chat, groupId, args) {
        try {
            const { Database } = require('../utils/database');
            const db = new Database();
            
            const action = args[0]?.toLowerCase();
            let isEnabled;
            
            if (action === 'on') {
                isEnabled = true;
            } else if (action === 'off') {
                isEnabled = false;
            } else {
                await message.reply('❌ *ANTILINK COMMAND*\n\n📝 *Usage:*\n.antilink on - Aktifkan antilink\n.antilink off - Nonaktifkan antilink');
                return { error: 'Invalid action' };
            }
            
            // Update group antilink setting
            await db.updateGroup(groupId, { 
                antilink: { enabled: isEnabled },
                antilinkEnabled: isEnabled 
            });
            
            const statusText = isEnabled ? 'diaktifkan' : 'dinonaktifkan';
            const statusEmoji = isEnabled ? '🛡️' : '🔓';
            
            await message.reply(`${statusEmoji} *ANTILINK ${statusText.toUpperCase()}*\n\nAntilink telah ${statusText} di grup ini.\n\n${isEnabled ? '⚠️ Pesan dengan link grup/bot akan dihapus otomatis' : '✅ Link grup/bot diizinkan'}`);
            
            return { success: true };
        } catch (error) {
            console.error('Antilink toggle error:', error);
            await message.reply('❌ Gagal mengubah pengaturan antilink.');
            return { error: error.message };
        }
    }

    async setAfk(message, contact, reason) {
        try {
            const userId = contact.id._serialized;
            const userName = contact.pushname || contact.name || 'User';
            const afkReason = reason || '';
            
            // Save to persistent database
            await setAfkUser(userId, afkReason, userName);

            const reasonText = afkReason || '';
            await message.reply(`*Yahh sayang, @${contact.id.user} afk*\n\n*Reason:* ${reasonText}`, undefined, { mentions: [userId] });
            
            return { success: true };
        } catch (error) {
            console.error('Set AFK error:', error);
            return { error: error.message };
        }
    }

    async checkAfkReturn(message, contact) {
        try {
            const userId = contact.id._serialized;
            const userName = contact.pushname || contact.name || 'User';
            
            // Check from persistent database
            const afkData = await getAfkUser(userId);
            if (afkData) {
                const afkDuration = Date.now() - afkData.time;
                
                // Calculate time duration
                const seconds = Math.floor(afkDuration / 1000);
                const minutes = Math.floor(seconds / 60);
                const hours = Math.floor(minutes / 60);
                
                let timeString = '';
                if (hours > 0) {
                    timeString += `${hours} Hour${hours > 1 ? 's' : ''} `;
                }
                if (minutes % 60 > 0) {
                    timeString += `${minutes % 60} Minute${minutes % 60 > 1 ? 's' : ''} `;
                }
                if (seconds % 60 > 0) {
                    timeString += `${seconds % 60} Second${seconds % 60 > 1 ? 's' : ''}`;
                }
                
                const reasonText = afkData.reason || '';
                await message.reply(`*😻Yey,* @${contact.id.user}\n*kembali dari afk*\n\n*Reason :* ${reasonText}\n*Sejak :* ${timeString.trim()}`, undefined, { mentions: [userId] });
                
                // Remove from AFK list
                await removeAfkUser(userId);
                
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Check AFK return error:', error);
            return false;
        }
    }

    async checkAfkMention(message) {
        try {
            // Check if message has mentions
            if (message.mentionedIds && message.mentionedIds.length > 0) {
                for (const mentionedId of message.mentionedIds) {
                    const afkData = await getAfkUser(mentionedId);
                    if (afkData) {
                        const afkDuration = Date.now() - afkData.time;
                        
                        // Calculate time duration
                        const seconds = Math.floor(afkDuration / 1000);
                        const minutes = Math.floor(seconds / 60);
                        const hours = Math.floor(minutes / 60);
                        
                        let timeString = '';
                        if (hours > 0) {
                            timeString += `${hours} Hour${hours > 1 ? 's' : ''} `;
                        }
                        if (minutes % 60 > 0) {
                            timeString += `${minutes % 60} Minute${minutes % 60 > 1 ? 's' : ''} `;
                        }
                        if (seconds % 60 > 0) {
                            timeString += `${seconds % 60} Second${seconds % 60 > 1 ? 's' : ''}`;
                        }
                        
                        const reasonText = afkData.reason || '';
                        await message.reply(`*😡 @${mentionedId.replace('@c.us', '')} is afk*\n*Reason :* ${reasonText}\n*Since :* ${timeString.trim()}`, undefined, { mentions: [mentionedId] });
                        return true;
                    }
                }
            }
            
            return false;
        } catch (error) {
            console.error('Check AFK mention error:', error);
            return false;
        }
    }

    async handleMute(message, chat, action, groupId) {
        try {
            const validActions = ['on', 'off'];
            
            if (!action || !validActions.includes(action.toLowerCase())) {
                await message.reply('❌ *MUTE COMMAND*\n\n📝 *Usage:*\n.mute on - Matikan bot di grup ini\n.mute off - Hidupkan bot di grup ini');
                return { error: 'Invalid action' };
            }

            const isMuted = action.toLowerCase() === 'on';
            await setMuteStatus(groupId, isMuted);

            const statusText = isMuted ? 'dimatikan' : 'dihidupkan';
            const statusEmoji = isMuted ? '🔇' : '🔊';
            
            await message.reply(`${statusEmoji} *BOT ${statusText.toUpperCase()}*\n\nBot telah ${statusText} di grup ini.`);
            
            return { success: true };
        } catch (error) {
            console.error('Handle mute error:', error);
            return { error: error.message };
        }
    }
}

module.exports = GroupHandler;