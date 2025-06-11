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

                case 'setwelcomemsg':
                    if (!isAdmin) {
                        await message.reply(config.ERRORS.ADMIN_ONLY);
                        return { error: 'Admin only' };
                    }
                    return await this.setCustomWelcomeMessage(message, chat, groupId, args);

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

                case 'goodbye':
                    if (!isAdmin) {
                        await message.reply(config.ERRORS.ADMIN_ONLY);
                        return { error: 'Admin only' };
                    }
                    return await this.toggleGoodbye(message, chat, groupId);

                case 'setgoodbye':
                    if (!isAdmin) {
                        await message.reply(config.ERRORS.ADMIN_ONLY);
                        return { error: 'Admin only' };
                    }
                    return await this.setGoodbyeMessage(message, chat, groupId, args);

                case 'testgoodbye':
                    if (!isAdmin) {
                        await message.reply(config.ERRORS.ADMIN_ONLY);
                        return { error: 'Admin only' };
                    }
                    return await this.testGoodbye(message, chat, contact);

                case 'mutemember':
                    if (!isAdmin) {
                        await message.reply(config.ERRORS.ADMIN_ONLY);
                        return { error: 'Admin only' };
                    }
                    return await this.muteMember(message, chat, userId, args);

                case 'unmutemember':
                    if (!isAdmin) {
                        await message.reply(config.ERRORS.ADMIN_ONLY);
                        return { error: 'Admin only' };
                    }
                    return await this.unmuteMember(message, chat, userId, args);

                case 'mutelist':
                    if (!isAdmin) {
                        await message.reply(config.ERRORS.ADMIN_ONLY);
                        return { error: 'Admin only' };
                    }
                    return await this.showMutedMembers(message, chat, groupId);

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
• .setwelcometype custom <message> - Custom welcome message
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
                    
                case 'custom':
                    if (args.length < 2) {
                        await message.reply('❌ Format: .setwelcometype custom <pesan_welcome>\n\nContoh:\n.setwelcometype custom 🔥 Welcome to the squad! 🔥\nHi @user, siap tempur!');
                        return { error: 'Missing custom message' };
                    }
                    
                    const customMessage = args.slice(1).join(' ');
                    await db.updateGroup(groupId, { 
                        welcomeType: 3,
                        welcome: { 
                            enabled: true,
                            customMessage: customMessage
                        }
                    });
                    await message.reply(`✅ Welcome type set to: Custom\n\nCustom welcome message berhasil disimpan untuk grup ini.`);
                    break;
                    
                case 'off':
                    await db.updateGroup(groupId, { 
                        welcome: { enabled: false }
                    });
                    await message.reply('❌ Welcome message disabled\n\nTidak ada pesan sambutan untuk member baru.');
                    break;
                    
                default:
                    await message.reply('❌ Invalid welcome type. Use: 1, 2, custom, or off');
                    return { error: 'Invalid type' };
            }
            
            return { success: true };
        } catch (error) {
            console.error('Set welcome type error:', error);
            await message.reply('❌ Gagal mengubah welcome type.');
            return { error: error.message };
        }
    }

    async setCustomWelcomeMessage(message, chat, groupId, args) {
        try {
            if (args.length === 0) {
                const helpText = `*📝 CUSTOM WELCOME MESSAGE*

*Format:*
.setwelcomemsg <pesan_welcome>

*Placeholders:*
• @user - Akan diganti dengan mention member baru

*Contoh:*
.setwelcomemsg 🔥 Welcome @user! 🔥
Selamat datang di squad kami!

*Tips:*
• Gunakan emoji untuk memperindah pesan
• Pesan bisa multi-baris
• @user akan otomatis mention member baru`;
                
                await message.reply(helpText);
                return { success: true };
            }

            const customMessage = args.join(' ');
            
            // Update group data with custom message
            const { Database } = require('../utils/database');
            const db = new Database();
            
            await db.updateGroup(groupId, { 
                welcomeType: 3,
                welcome: { 
                    enabled: true,
                    customMessage: customMessage
                }
            });
            
            await message.reply(`✅ Custom welcome message berhasil disimpan!

*Preview:*
${customMessage.replace(/@user/g, '@preview_user')}

*Note:* Welcome type otomatis diubah ke custom.`);
            
            return { success: true };
        } catch (error) {
            console.error('Set custom welcome message error:', error);
            return { error: 'Failed to set custom welcome message' };
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
            let targetId;
            
            // Check if replying to a message
            if (message.hasQuotedMsg) {
                const quotedMsg = await message.getQuotedMessage();
                targetId = quotedMsg.author || quotedMsg.from;
            }
            // Check if mentioning someone
            else if (message.mentionedIds && message.mentionedIds.length > 0) {
                targetId = message.mentionedIds[0];
            }
            else {
                await message.reply('❌ Reply pesan member atau mention (@) member yang ingin dipromote menjadi admin\n\nContoh:\n• .promote (reply pesan member)\n• .promote @6281234567890');
                return { error: 'No target' };
            }

            // Check if target is valid
            if (!targetId) {
                await message.reply('❌ Target tidak valid. Pastikan reply pesan member atau mention dengan benar.');
                return { error: 'Invalid target' };
            }

            // Check if target is already admin
            const participants = await chat.participants;
            const targetParticipant = participants.find(p => p.id._serialized === targetId);
            
            if (!targetParticipant) {
                await message.reply('❌ Member tidak ditemukan dalam grup ini.');
                return { error: 'Member not found' };
            }

            if (targetParticipant.isAdmin) {
                await message.reply(`❌ @${targetId.replace('@c.us', '')} sudah menjadi admin grup ini.`, undefined, { mentions: [targetId] });
                return { error: 'Already admin' };
            }

            // Promote the member
            await chat.promoteParticipants([targetId]);
            
            const successMessage = `✅ *PROMOTE BERHASIL*\n\n🎉 @${targetId.replace('@c.us', '')} berhasil dipromote menjadi admin grup!\n\n👑 Selamat atas tanggung jawab baru sebagai admin grup.`;
            await message.reply(successMessage, undefined, { mentions: [targetId] });
            
            return { success: true };
        } catch (error) {
            console.error('Promote member error:', error);
            
            if (error.message.includes('insufficient permissions')) {
                await message.reply('❌ Bot tidak memiliki izin untuk promote member. Pastikan bot adalah admin grup.');
            } else if (error.message.includes('not found')) {
                await message.reply('❌ Member tidak ditemukan atau sudah keluar dari grup.');
            } else {
                await message.reply('❌ Gagal promote member. Pastikan member masih ada di grup dan bot memiliki izin admin.');
            }
            
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

    // Goodbye Message Methods
    async toggleGoodbye(message, chat, groupId) {
        try {
            const { Database } = require('../utils/database');
            const db = new Database();
            
            const groupData = await db.getGroup(groupId);
            groupData.goodbye.enabled = !groupData.goodbye.enabled;
            
            await db.updateGroup(groupId, groupData);
            
            const status = groupData.goodbye.enabled ? 'DIAKTIFKAN' : 'DINONAKTIFKAN';
            const emoji = groupData.goodbye.enabled ? '✅' : '❌';
            
            await message.reply(`${emoji} *GOODBYE MESSAGE ${status}*\n\nGoodbye message untuk member yang keluar dari grup telah ${status.toLowerCase()}.`);
            return { success: true };
        } catch (error) {
            console.error('Toggle goodbye error:', error);
            return { error: error.message };
        }
    }

    async setGoodbyeMessage(message, chat, groupId, args) {
        try {
            const { Database } = require('../utils/database');
            const db = new Database();
            
            if (args.length === 0) {
                const helpText = `*👋 GOODBYE MESSAGE SETTINGS*

*Available commands:*
• .setgoodbye <pesan> - Set custom goodbye message
• .goodbye - Toggle goodbye on/off
• .testgoodbye - Test goodbye message

*Variables you can use:*
• @user - Mention user yang keluar
• @group - Nama grup
• @count - Jumlah member tersisa

*Example:*
.setgoodbye Selamat tinggal @user! Semoga sukses selalu 👋`;
                
                await message.reply(helpText);
                return { success: true };
            }

            const customMessage = args.join(' ');
            const groupData = await db.getGroup(groupId);
            
            groupData.goodbye.message = customMessage;
            groupData.goodbye.type = 'text';
            
            await db.updateGroup(groupId, groupData);
            
            await message.reply(`✅ *GOODBYE MESSAGE UPDATED*\n\nPesan goodbye berhasil diatur:\n"${customMessage}"\n\nKetik .testgoodbye untuk mencoba pesan goodbye.`);
            return { success: true };
        } catch (error) {
            console.error('Set goodbye message error:', error);
            return { error: error.message };
        }
    }

    async testGoodbye(message, chat, contact) {
        try {
            const { Database } = require('../utils/database');
            const db = new Database();
            
            const groupId = chat.id._serialized;
            const groupData = await db.getGroup(groupId);
            
            if (!groupData.goodbye.enabled) {
                await message.reply('❌ Goodbye message belum diaktifkan. Ketik .goodbye untuk mengaktifkan.');
                return { error: 'Goodbye disabled' };
            }

            // Send test goodbye message
            await this.sendGoodbyeMessage(chat, contact, groupData, true);
            return { success: true };
        } catch (error) {
            console.error('Test goodbye error:', error);
            return { error: error.message };
        }
    }

    async sendGoodbyeMessage(chat, contact, groupData, isTest = false) {
        try {
            console.log('sendGoodbyeMessage called with:', {
                chatId: chat.id._serialized,
                contactId: contact.id._serialized,
                goodbyeEnabled: groupData.goodbye?.enabled,
                isTest
            });

            if (!groupData.goodbye.enabled && !isTest) {
                console.log('Goodbye disabled and not test mode, returning');
                return;
            }

            const userName = contact.pushname || contact.name || contact.number;
            const groupName = chat.name || 'Group';
            const memberCount = chat.participants ? chat.participants.length : 0;

            let goodbyeText = groupData.goodbye.message || 'Selamat tinggal @user! 👋';
            
            // Replace variables
            goodbyeText = goodbyeText
                .replace(/@user/g, `@${contact.id.user}`)
                .replace(/@group/g, groupName)
                .replace(/@count/g, memberCount.toString());

            if (isTest) {
                goodbyeText = `*[TEST GOODBYE MESSAGE]*\n\n${goodbyeText}`;
            }

            console.log('Sending goodbye message:', goodbyeText);
            const mentions = [contact.id._serialized];
            await chat.sendMessage(goodbyeText, { mentions });
            console.log('Goodbye message sent successfully');

            return { success: true };
        } catch (error) {
            console.error('Send goodbye message error:', error);
            return { error: error.message };
        }
    }

    // Member Mute Management Methods
    async muteMember(message, chat, adminId, args) {
        try {
            let targetId;
            let reason = 'No reason provided';
            
            // Check if replying to a message
            if (message.hasQuotedMsg) {
                const quotedMsg = await message.getQuotedMessage();
                targetId = quotedMsg.author || quotedMsg.from;
                reason = args.join(' ') || reason;
            }
            // Check if mentioning someone
            else if (message.mentionedIds && message.mentionedIds.length > 0) {
                targetId = message.mentionedIds[0];
                reason = args.slice(1).join(' ') || reason;
            }
            else if (args.length > 0) {
                // Try to parse user ID from arguments
                let userId = args[0];
                if (!userId.includes('@c.us')) {
                    userId = `${userId}@c.us`;
                }
                targetId = userId;
                reason = args.slice(1).join(' ') || reason;
            }
            else {
                await message.reply('❌ Reply pesan member, mention (@) member, atau masukkan nomor yang ingin dimute\n\nContoh:\n• .mutemember (reply pesan)\n• .mutemember @user spam\n• .mutemember 628123456789 toxic');
                return { error: 'No target' };
            }

            // Check if target is valid
            if (!targetId) {
                await message.reply('❌ Target tidak valid. Pastikan reply pesan member atau mention dengan benar.');
                return { error: 'Invalid target' };
            }

            // Check if target is admin
            const { isGroupAdmin } = require('../utils/helpers');
            const isTargetAdmin = await isGroupAdmin(message, targetId);
            
            if (isTargetAdmin) {
                await message.reply('❌ Tidak bisa mute admin grup.');
                return { error: 'Cannot mute admin' };
            }

            // Check if target is bot
            if (targetId.includes('6288228836758')) {
                await message.reply('❌ Tidak bisa mute bot.');
                return { error: 'Cannot mute bot' };
            }

            const { Database } = require('../utils/database');
            const db = new Database();
            
            // Add to muted members
            const groupData = await db.getGroup(chat.id._serialized);
            if (!groupData.mutedMembers) groupData.mutedMembers = {};
            
            groupData.mutedMembers[targetId] = {
                mutedBy: adminId,
                reason: reason,
                timestamp: Date.now(),
                mutedByName: message.author || adminId
            };
            
            await db.updateGroup(chat.id._serialized, groupData);
            
            const successMessage = `🔇 *MEMBER MUTED*\n\n` +
                `👤 *User:* @${targetId.replace('@c.us', '')}\n` +
                `👮 *Muted by:* @${adminId.replace('@c.us', '')}\n` +
                `📝 *Reason:* ${reason}\n` +
                `⏰ *Time:* ${new Date().toLocaleString('id-ID')}\n\n` +
                `Member tidak bisa menggunakan bot commands.`;
            
            const mentions = [targetId, adminId];
            await message.reply(successMessage, undefined, { mentions });
            
            return { success: true };
        } catch (error) {
            console.error('Mute member error:', error);
            return { error: error.message };
        }
    }

    async unmuteMember(message, chat, adminId, args) {
        try {
            let targetId;
            
            // Check if replying to a message
            if (message.hasQuotedMsg) {
                const quotedMsg = await message.getQuotedMessage();
                targetId = quotedMsg.author || quotedMsg.from;
            }
            // Check if mentioning someone
            else if (message.mentionedIds && message.mentionedIds.length > 0) {
                targetId = message.mentionedIds[0];
            }
            else if (args.length > 0) {
                // Try to parse user ID from arguments
                let userId = args[0];
                if (!userId.includes('@c.us')) {
                    userId = `${userId}@c.us`;
                }
                targetId = userId;
            }
            else {
                await message.reply('❌ Reply pesan member, mention (@) member, atau masukkan nomor yang ingin di-unmute\n\nContoh:\n• .unmutemember (reply pesan)\n• .unmutemember @user\n• .unmutemember 628123456789');
                return { error: 'No target' };
            }

            const { Database } = require('../utils/database');
            const db = new Database();
            
            const groupData = await db.getGroup(chat.id._serialized);
            if (!groupData.mutedMembers || !groupData.mutedMembers[targetId]) {
                await message.reply('❌ Member tersebut tidak sedang dimute.');
                return { error: 'Member not muted' };
            }
            
            // Remove from muted members
            delete groupData.mutedMembers[targetId];
            await db.updateGroup(chat.id._serialized, groupData);
            
            const successMessage = `🔊 *MEMBER UNMUTED*\n\n` +
                `👤 *User:* @${targetId.replace('@c.us', '')}\n` +
                `👮 *Unmuted by:* @${adminId.replace('@c.us', '')}\n` +
                `⏰ *Time:* ${new Date().toLocaleString('id-ID')}\n\n` +
                `Member sekarang bisa menggunakan bot commands lagi.`;
            
            const mentions = [targetId, adminId];
            await message.reply(successMessage, undefined, { mentions });
            
            return { success: true };
        } catch (error) {
            console.error('Unmute member error:', error);
            return { error: error.message };
        }
    }

    async showMutedMembers(message, chat, groupId) {
        try {
            const { Database } = require('../utils/database');
            const db = new Database();
            
            const groupData = await db.getGroup(groupId);
            const mutedMembers = groupData.mutedMembers || {};
            
            if (Object.keys(mutedMembers).length === 0) {
                await message.reply('📊 Tidak ada member yang sedang dimute di grup ini.');
                return { success: true };
            }
            
            let muteList = `🔇 *MUTED MEMBERS LIST*\n\n`;
            muteList += `📊 *Total:* ${Object.keys(mutedMembers).length} members\n\n`;
            
            let count = 1;
            for (const [userId, muteData] of Object.entries(mutedMembers)) {
                const muteDate = new Date(muteData.timestamp).toLocaleDateString('id-ID');
                const muteTime = new Date(muteData.timestamp).toLocaleTimeString('id-ID');
                
                muteList += `${count}. @${userId.replace('@c.us', '')}\n`;
                muteList += `   📝 Reason: ${muteData.reason}\n`;
                muteList += `   👮 By: @${muteData.mutedBy.replace('@c.us', '')}\n`;
                muteList += `   📅 Date: ${muteDate} ${muteTime}\n\n`;
                count++;
            }
            
            muteList += `💡 Use .unmutemember to unmute members`;
            
            // Create mentions array
            const mentions = Object.keys(mutedMembers).concat(
                Object.values(mutedMembers).map(m => m.mutedBy)
            );
            
            await message.reply(muteList, undefined, { mentions });
            return { success: true };
        } catch (error) {
            console.error('Show muted members error:', error);
            return { error: error.message };
        }
    }

    // Check if member is muted
    async isUserMuted(groupId, userId) {
        try {
            const { Database } = require('../utils/database');
            const db = new Database();
            
            const groupData = await db.getGroup(groupId);
            const mutedMembers = groupData.mutedMembers || {};
            
            return mutedMembers.hasOwnProperty(userId);
        } catch (error) {
            console.error('Check mute status error:', error);
            return false;
        }
    }
}

module.exports = GroupHandler;