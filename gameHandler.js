const config = require('../config/config');
const { getUserData, updateUserPoints, updateUserXP } = require('../utils/database');
const { getRandomFromArray, formatNumber } = require('../utils/helpers');
const gamesData = require('../data/games');
const GameScoring = require('../utils/gameScoring');
const loadingIndicator = require('../utils/loadingIndicator');

class GameHandler {
    constructor() {
        this.gameTimeouts = new Map();
        this.gameMessages = new Map(); // Store message context for timeouts
        this.database = require('../utils/database');
        this.gameScoring = new GameScoring();
        this.activeGames = new Map(); // Track active games with start times
    }

    async handleCommand(command, args, message, contact, chat, client) {
        try {
            const userId = contact.id._serialized;
            const chatId = chat.id._serialized;

            switch (command) {
                case 'tebakkata':
                    return await this.startGuessWordGame(message, chatId, userId);

                case 'tebakgambar':
                    return await this.startGuessImageGame(message, chatId, userId);

                case 'math':
                case 'matematika':
                    return await this.startMathGame(message, chatId, userId, args[0] || 'easy');

                case 'family100':
                    return await this.startFamily100Game(message, chatId, userId);

                case 'asahotak':
                    return await this.startBrainTeaserGame(message, chatId, userId);

                case 'caklontong':
                    return await this.startCakLontongGame(message, chatId, userId);

                case 'tebakbendera':
                    return await this.startFlagGame(message, chatId, userId);

                case 'tebaklagu':
                    return await this.startSongGuessGame(message, chatId, userId);

                case 'tebakchara':
                case 'tebakkarakter':
                    return await this.startCharacterGuessGame(message, chatId, userId);

                case 'susunkata':
                    return await this.startWordArrangeGame(message, chatId, userId);

                case 'sambungkata':
                    return await this.startWordChainGame(message, chatId, userId, args);

                case 'siapakahaku':
                    return await this.startWhoAmIGame(message, chatId, userId);

                case 'truth':
                    return await this.getTruthQuestion(message, userId);

                case 'dare':
                    return await this.getDareChallenge(message, userId);

                case 'hint':
                    return await this.giveHint(message, chatId, userId);

                case 'nyerah':
                case 'surrender':
                    return await this.surrenderGame(message, chatId, userId);

                case 'buylimit':
                    return await this.buyLimit(message, userId, args);

                case 'tfbalance':
                case 'transferbalance':
                    return await this.transferBalance(message, userId, args);

                case 'redeem':
                    return await this.redeemCode(message, userId, args);

                case 'leaderboard':
                case 'lb':
                    return await this.showLeaderboard(message, args, chat);

                case 'gameprofile':
                case 'gp':
                    return await this.showGameProfile(message, userId, contact);

                case 'achievements':
                case 'achv':
                    return await this.showAchievements(message, userId);

                case 'gamestats':
                case 'gs':
                    return await this.showGameStats(message, userId);

                case 'topgames':
                    return await this.showTopGames(message);

                case 'dailybonus':
                    return await this.claimDailyBonus(message, userId);

                case 'gamehelp':
                    return await this.showGameHelp(message);

                default:
                    // Check if it's an answer to an active game
                    return await this.checkGameAnswer(command, message, chatId, userId);
            }
        } catch (error) {
            console.error('Game handler error:', error);
            // Silent error - don't show error message to user
            return { error: error.message };
        }
    }

    async startGuessWordGame(message, chatId, userId) {
        const existingGame = await this.database.getGameSession(chatId);
        if (existingGame) {
            await message.reply('❌ *GAME SEDANG BERLANGSUNG*\n\nTunggu game selesai atau ketik `.nyerah` untuk menyerah.');
            return { error: 'Game already active' };
        }

        const wordData = getRandomFromArray(gamesData.guessWords);
        const gameData = {
            type: 'tebakkata',
            answer: wordData.word.toLowerCase(),
            hint: wordData.hint,
            category: wordData.category,
            difficulty: wordData.difficulty,
            points: config.GAMES.POINT_REWARDS[wordData.difficulty.toUpperCase()] || 10,
            xp: config.GAMES.XP_REWARDS[wordData.difficulty.toUpperCase()] || 5,
            startTime: Date.now(),
            hints: 0,
            maxHints: config.GAMES.MAX_HINTS,
            creator: userId
        };

        await this.database.saveGameSession(chatId, gameData);
        this.gameMessages.set(chatId, message);

        // Set timeout based on difficulty - ensure it's 30 seconds for EASY games
        const timeoutSeconds = config.GAMES.TIMEOUT_SECONDS[gameData.difficulty.toUpperCase()] || 30;
        console.log(`DEBUG: Game timeout - Difficulty: ${gameData.difficulty}, Timeout: ${timeoutSeconds} seconds, Milliseconds: ${timeoutSeconds * 1000}`);
        console.log(`DEBUG: Game start time: ${gameData.startTime}, Current time: ${Date.now()}`);
        
        // Clear any existing timeout for this chat
        const existingTimeout = this.gameTimeouts.get(chatId);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
            console.log(`DEBUG: Cleared existing timeout for chat ${chatId}`);
        }
        
        // Store the timeout with proper duration
        const timeoutDuration = timeoutSeconds * 1000;
        console.log(`DEBUG: Creating timeout with duration: ${timeoutDuration}ms (${timeoutSeconds} seconds)`);
        
        const timeout = setTimeout(async () => {
            const actualElapsed = Math.floor((Date.now() - gameData.startTime) / 1000);
            console.log(`DEBUG: Timeout triggered for chat ${chatId} after ${actualElapsed} seconds (expected: ${timeoutSeconds})`);
            
            // Double-check the game still exists before timing out
            const currentGame = await this.database.getGameSession(chatId);
            if (!currentGame) {
                console.log(`DEBUG: Game already ended for chat ${chatId}, skipping timeout`);
                return;
            }
            
            console.log(`DEBUG: Processing timeout for chat ${chatId}`);
            const storedMessage = this.gameMessages.get(chatId);
            await this.timeoutGame(chatId, storedMessage);
            this.gameMessages.delete(chatId);
        }, timeoutDuration);
        
        this.gameTimeouts.set(chatId, timeout);
        console.log(`DEBUG: Timeout set for chat ${chatId} - will trigger in ${timeoutSeconds} seconds`);

        const gameText = `🎯 *TEBAK KATA*

Kategori: ${gameData.category}
Tingkat: ${gameData.difficulty}
Poin: ${gameData.points}

*Petunjuk:* ${gameData.hint}

Waktu: ${timeoutSeconds} detik
Ketik .hint untuk petunjuk tambahan`;

        await message.reply(gameText);
        return { success: true };
    }

    async startGuessImageGame(message, chatId, userId) {
        if (this.activeGames.has(chatId)) {
            
            return { error: 'Game already active' };
        }

        const imageData = getRandomFromArray(gamesData.guessImages || [
            { name: 'kucing', hint: 'Hewan peliharaan yang suka mengeong', category: 'Hewan' },
            { name: 'mobil', hint: 'Kendaraan beroda empat', category: 'Kendaraan' },
            { name: 'rumah', hint: 'Tempat tinggal manusia', category: 'Bangunan' },
            { name: 'pohon', hint: 'Tumbuhan besar dengan batang kayu', category: 'Tumbuhan' },
            { name: 'bunga', hint: 'Bagian tumbuhan yang berwarna warni', category: 'Tumbuhan' }
        ]);
        
        const gameData = {
            type: 'tebakgambar',
            answer: imageData.name.toLowerCase(),
            hint: imageData.hint,
            category: imageData.category,
            points: 25,
            startTime: Date.now(),
            hints: 0,
            maxHints: 2,
            creator: userId
        };

        await this.database.saveGameSession(chatId, gameData);
        this.gameMessages.set(chatId, message);

        const timeoutSeconds = 30; // Fixed 30 seconds for tebakgambar
        console.log(`DEBUG: Tebakgambar timeout set for ${timeoutSeconds} seconds`);
        
        const timeout = setTimeout(async () => {
            const actualElapsed = Math.floor((Date.now() - gameData.startTime) / 1000);
            console.log(`DEBUG: Tebakgambar timeout triggered after ${actualElapsed} seconds`);
            
            const currentGame = await this.database.getGameSession(chatId);
            if (!currentGame) {
                console.log(`DEBUG: Tebakgambar game already ended, skipping timeout`);
                return;
            }
            
            const storedMessage = this.gameMessages.get(chatId);
            await this.timeoutGame(chatId, storedMessage);
            this.gameMessages.delete(chatId);
        }, timeoutSeconds * 1000);
        this.gameTimeouts.set(chatId, timeout);

        const gameText = `🖼️ *TEBAK GAMBAR*

Kategori: ${gameData.category}
Hint: ${gameData.hint}

Hadiah: ${gameData.points} poin
⏰ Waktu: ${timeoutSeconds} detik

Ketik jawabanmu!`;

        await message.reply(gameText);
        return { success: true };
    }

    async startMathGame(message, chatId, userId, difficulty = 'easy') {
        const existingGame = await this.database.getGameSession(chatId);
        if (existingGame) {
            await message.reply('❌ *GAME SEDANG BERLANGSUNG*\n\nTunggu game selesai atau ketik `.nyerah` untuk menyerah.');
            return { error: 'Game already active' };
        }

        // Validate difficulty
        const validDifficulties = ['easy', 'hard', 'extreme'];
        if (!validDifficulties.includes(difficulty)) {
            difficulty = 'easy';
        }

        const mathData = this.generateMathProblem(difficulty);
        const pointRewards = {
            easy: 30,
            hard: 60,
            extreme: 100
        };
        
        const xpRewards = {
            easy: 10,
            hard: 20,
            extreme: 35
        };

        const gameData = {
            type: 'math',
            answer: mathData.answer.toString(),
            problem: mathData.problem,
            difficulty: difficulty,
            points: pointRewards[difficulty],
            xp: xpRewards[difficulty],
            startTime: Date.now(),
            creator: userId
        };

        await this.database.saveGameSession(chatId, gameData);
        this.gameMessages.set(chatId, message); // Store message context for timeout

        // Set timeout based on difficulty - ensure proper duration
        const timeoutSeconds = config.GAMES.TIMEOUT_SECONDS[gameData.difficulty.toUpperCase()] || 30;
        console.log(`DEBUG: Math game timeout - Difficulty: ${gameData.difficulty}, Timeout: ${timeoutSeconds} seconds`);
        console.log(`DEBUG: Math game start time: ${gameData.startTime}, Current time: ${Date.now()}`);
        
        // Clear any existing timeout for this chat
        const existingTimeout = this.gameTimeouts.get(chatId);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
            console.log(`DEBUG: Cleared existing math timeout for chat ${chatId}`);
        }
        
        // Store the timeout with proper duration
        const timeoutDuration = timeoutSeconds * 1000;
        console.log(`DEBUG: Creating math timeout with duration: ${timeoutDuration}ms (${timeoutSeconds} seconds)`);
        
        const timeout = setTimeout(async () => {
            const actualElapsed = Math.floor((Date.now() - gameData.startTime) / 1000);
            console.log(`DEBUG: Math timeout triggered for chat ${chatId} after ${actualElapsed} seconds (expected: ${timeoutSeconds})`);
            
            // Double-check the game still exists before timing out
            const currentGame = await this.database.getGameSession(chatId);
            if (!currentGame) {
                console.log(`DEBUG: Math game already ended for chat ${chatId}, skipping timeout`);
                return;
            }
            
            console.log(`DEBUG: Processing math timeout for chat ${chatId}`);
            const storedMessage = this.gameMessages.get(chatId);
            await this.timeoutGame(chatId, storedMessage);
            this.gameMessages.delete(chatId);
        }, timeoutDuration);
        
        this.gameTimeouts.set(chatId, timeout);
        console.log(`DEBUG: Math timeout set for chat ${chatId} - will trigger in ${timeoutSeconds} seconds`);

        const gameText = `🧮 *MATEMATIKA*

${gameData.problem} = ?

Tingkat: ${gameData.difficulty.toUpperCase()}
Poin: ${gameData.points}
XP: ${gameData.xp}
Waktu: ${timeoutSeconds} detik

Gunakan: .math easy | .math hard | .math extreme`;

        await message.reply(gameText);
        return { success: true };
    }

    async startFamily100Game(message, chatId, userId) {
        const existingGame = await this.database.getGameSession(chatId);
        if (existingGame) {
            await message.reply('❌ *GAME SEDANG BERLANGSUNG*\n\nTunggu game selesai atau ketik `.nyerah` untuk menyerah.');
            return { error: 'Game already active' };
        }

        const family100Data = getRandomFromArray(gamesData.family100);
        const gameData = {
            type: 'family100',
            question: family100Data.question,
            answers: family100Data.answers.map(a => a.toLowerCase()),
            foundAnswers: [],
            points: 50,
            startTime: Date.now(),
            creator: userId
        };

        await this.database.saveGameSession(chatId, gameData);

        const timeoutSeconds = config.GAMES.FAMILY100_TIMEOUT_SECONDS || 120;
        console.log(`DEBUG: Family100 timeout set for ${timeoutSeconds} seconds`);
        
        const timeout = setTimeout(async () => {
            const actualElapsed = Math.floor((Date.now() - gameData.startTime) / 1000);
            console.log(`DEBUG: Family100 timeout triggered after ${actualElapsed} seconds`);
            
            const currentGame = await this.database.getGameSession(chatId);
            if (!currentGame) {
                console.log(`DEBUG: Family100 game already ended, skipping timeout`);
                return;
            }
            
            const storedMessage = this.gameMessages.get(chatId);
            await this.timeoutGame(chatId, storedMessage);
            this.gameMessages.delete(chatId);
        }, timeoutSeconds * 1000);

        this.gameTimeouts.set(chatId, timeout);
        this.gameMessages.set(chatId, message); // Store message context

        const gameText = `👨‍👩‍👧‍👦 *FAMILY 100*

*Pertanyaan:* ${gameData.question}

Sebutkan sebanyak-banyaknya jawaban!
Poin: ${gameData.points}
Waktu: ${timeoutSeconds} detik`;

        await message.reply(gameText);
        return { success: true };
    }

    async startBrainTeaserGame(message, chatId, userId) {
        const existingGame = await this.database.getGameSession(chatId);
        if (existingGame) {
            await message.reply('❌ *GAME SEDANG BERLANGSUNG*\n\nTunggu game selesai atau ketik `.nyerah` untuk menyerah.');
            return { error: 'Game already active' };
        }

        const { getRandomFromArray } = require('../utils/helpers');
        const brainTeaserData = getRandomFromArray(gamesData.brainTeasers);
        
        // Determine points and XP based on difficulty
        const rewards = {
            easy: { points: 20, xp: 10 },
            medium: { points: 35, xp: 15 },
            hard: { points: 50, xp: 25 }
        };
        
        const reward = rewards[brainTeaserData.difficulty] || rewards.medium;

        const gameData = {
            type: 'asahotak',
            question: brainTeaserData.question,
            answer: brainTeaserData.answer.toLowerCase(),
            hint: brainTeaserData.hint,
            difficulty: brainTeaserData.difficulty,
            points: reward.points,
            xp: reward.xp,
            startTime: Date.now(),
            creator: userId
        };

        await this.database.saveGameSession(chatId, gameData);

        const timeoutSeconds = config.GAMES.TIMEOUT_SECONDS[gameData.difficulty.toUpperCase()] || 30;
        console.log(`DEBUG: BrainTeaser timeout set for ${timeoutSeconds} seconds`);
        
        const timeout = setTimeout(async () => {
            const actualElapsed = Math.floor((Date.now() - gameData.startTime) / 1000);
            console.log(`DEBUG: BrainTeaser timeout triggered after ${actualElapsed} seconds`);
            
            const currentGame = await this.database.getGameSession(chatId);
            if (!currentGame) {
                console.log(`DEBUG: BrainTeaser game already ended, skipping timeout`);
                return;
            }
            
            const storedMessage = this.gameMessages.get(chatId);
            await this.timeoutGame(chatId, storedMessage);
            this.gameMessages.delete(chatId);
        }, timeoutSeconds * 1000);

        this.gameTimeouts.set(chatId, timeout);
        this.gameMessages.set(chatId, message);

        const gameText = `*[Asah Otak]*

Jawablah pertanyaan di bawah ini
${gameData.question}

Waktu: ${timeoutSeconds} detik
Hadiah:
- ${gameData.points} point
- ${gameData.xp} XP`;

        await message.reply(gameText);
        return { success: true };
    }

    async checkGameAnswer(answer, message, chatId, userId) {
        console.log(`DEBUG: checkGameAnswer called with answer: "${answer}", chatId: ${chatId}, userId: ${userId}`);
        const gameData = await this.database.getGameSession(chatId);
        if (!gameData) {
            console.log(`DEBUG: No active game found for chatId: ${chatId}`);
            return { success: false };
        }
        console.log(`DEBUG: Active game found - type: ${gameData.type}, expected answer: ${gameData.answer}`);

        const userAnswer = answer.toLowerCase().trim();
        let isCorrect = false;
        let points = 0;

        switch (gameData.type) {
            case 'tebakkata':
            case 'tebakbendera':
            case 'tebaklagu':
            case 'tebakchara':
            case 'susunkata':
            case 'siapakahaku':
            case 'asahotak':
            case 'caklontong':
                isCorrect = userAnswer === gameData.answer.toLowerCase();
                points = gameData.points;
                break;
                
            case 'math':
                // Handle numeric answers for math games
                const numericAnswer = parseFloat(userAnswer);
                const correctAnswer = parseFloat(gameData.answer);
                console.log(`Math game debug - User: "${userAnswer}" (${numericAnswer}) vs Correct: "${gameData.answer}" (${correctAnswer})`);
                isCorrect = !isNaN(numericAnswer) && numericAnswer === correctAnswer;
                points = gameData.points;
                break;

            case 'family100':
                console.log(`DEBUG: Family100 - User answer: "${userAnswer}"`);
                console.log(`DEBUG: Family100 - Available answers:`, gameData.answers);
                console.log(`DEBUG: Family100 - Found answers:`, gameData.foundAnswers);
                
                const foundIndex = gameData.answers.findIndex(ans => {
                    const answerLower = ans.toLowerCase();
                    const userLower = userAnswer.toLowerCase();
                    
                    // Exact match
                    if (answerLower === userLower) return true;
                    
                    // Contains match (both directions)
                    if (answerLower.includes(userLower) || userLower.includes(answerLower)) return true;
                    
                    // Word-based matching for compound answers
                    const answerWords = answerLower.split(/\s+/);
                    const userWords = userLower.split(/\s+/);
                    
                    // Check if any user word matches any answer word
                    return userWords.some(userWord => 
                        answerWords.some(answerWord => 
                            answerWord === userWord || 
                            answerWord.includes(userWord) || 
                            userWord.includes(answerWord)
                        )
                    );
                });
                
                console.log(`DEBUG: Family100 - Found index: ${foundIndex}`);
                
                if (foundIndex !== -1 && !gameData.foundAnswers.includes(foundIndex)) {
                    // Track who found which answer
                    if (!gameData.playerAnswers) gameData.playerAnswers = {};
                    if (!gameData.playerAnswers[userId]) gameData.playerAnswers[userId] = [];
                    
                    gameData.foundAnswers.push(foundIndex);
                    gameData.playerAnswers[userId].push({
                        answer: gameData.answers[foundIndex],
                        points: 10,
                        xp: 5,
                        timestamp: Date.now()
                    });
                    
                    await this.database.saveGameSession(chatId, gameData);
                    
                    const pointsEarned = 10;
                    const xpEarned = 5;
                    
                    // Update user stats
                    await this.database.updateUserPoints(userId, pointsEarned);
                    await this.database.updateUserXP(userId, xpEarned);
                    
                    const timeTaken = Math.floor((Date.now() - gameData.startTime) / 1000);
                    
                    // Random emoji array
                    const emojis = ['😦', '😻', '🙈', '🧐', '🥵', '🥶', '😍', '🤩', '😎', '🥳', '🤗', '😊', '🔥', '⭐', '🌟', '💫', '✨'];
                    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                    
                    const responseText = `${randomEmoji} Benar! "${gameData.answers[foundIndex]}"
*Point:* +${pointsEarned}
*XP:* +${xpEarned}
*Waktu:* ${timeTaken}s

Sudah ditemukan: ${gameData.foundAnswers.length}/${gameData.answers.length}`;
                    
                    await message.reply(responseText);
                    
                    if (gameData.foundAnswers.length === gameData.answers.length) {
                        await this.endGame(chatId, userId, true, gameData.points, message);
                    }
                    return { success: true };
                }
                return { success: false };

            case 'sambungkata':
                const lastWord = gameData.lastWord;
                const lastChar = lastWord.slice(-1).toLowerCase();
                const firstChar = userAnswer.charAt(0).toLowerCase();
                
                if (firstChar === lastChar && userAnswer.length > 2) {
                    gameData.lastWord = userAnswer;
                    gameData.words.push(userAnswer);
                    points = 5;
                    
                    await message.reply(`✅ Benar! Sekarang sambung kata dari: "${userAnswer.slice(-1).toUpperCase()}"`);
                    return { success: true };
                }
                return { success: false };
        }

        if (isCorrect) {
            // Calculate time taken
            const timeTaken = (Date.now() - gameData.startTime) / 1000;
            const timeString = timeTaken < 60 ? `${timeTaken.toFixed(1)} detik` : `${Math.floor(timeTaken / 60)} menit ${(timeTaken % 60).toFixed(1)} detik`;

            // Award points and XP
            await this.database.updateUserPoints(userId, points);
            if (gameData.xp) {
                await this.database.updateUserXP(userId, gameData.xp);
            }

            const winText = `😦 *JAWABAN BENAR!*\n\n✅ Jawaban: *${gameData.answer}*\n💰 Poin: +${points}\n⭐ XP: +${gameData.xp || 0}\n⏱️ Waktu: ${timeString}\n\nSelamat! 🎊`;

            await message.reply(winText);
            await this.endGame(chatId, userId, true, points, message);
            return { success: true };
        }

        return { success: false };
    }

    async endGame(chatId, userId, isWin, points, message = null) {
        const gameData = await this.database.getGameSession(chatId);
        if (!gameData) return;

        // Clear timeout
        const timeout = this.gameTimeouts.get(chatId);
        if (timeout) {
            clearTimeout(timeout);
            this.gameTimeouts.delete(chatId);
        }

        // Points and XP are already awarded in checkGameAnswer function
        // Win message is already sent in checkGameAnswer function
        // No need to send duplicate message here

        // Remove game and clean up
        await this.database.deleteGameSession(chatId);
        this.gameMessages.delete(chatId);
    }

    async timeoutGame(chatId, message = null) {
        const gameData = await this.database.getGameSession(chatId);
        if (!gameData) {
            console.log(`DEBUG: No game data found for timeout in chat ${chatId}`);
            return;
        }

        const gameStartTime = gameData.startTime;
        const currentTime = Date.now();
        const actualElapsed = Math.floor((currentTime - gameStartTime) / 1000);
        
        console.log(`DEBUG: Game timeout triggered - Chat: ${chatId}, Type: ${gameData.type}, Elapsed: ${actualElapsed}s`);

        await this.database.deleteGameSession(chatId);
        this.gameTimeouts.delete(chatId);
        this.gameMessages.delete(chatId);

        console.log(`Game timeout in chat ${chatId}`);
        
        // Send timeout message with correct answer if message context available
        if (message) {
            let timeoutText = '';
            
            if (gameData.type === 'family100') {
                timeoutText = `⏰ *WAKTU HABIS!*\n\n`;
                
                if (gameData.playerAnswers && Object.keys(gameData.playerAnswers).length > 0) {
                    timeoutText += `Jawaban yang benar:\n`;
                    
                    let playerRank = 1;
                    for (const [userId, playerData] of Object.entries(gameData.playerAnswers)) {
                        const answers = playerData.map(a => a.answer).join(', ');
                        const totalPoints = playerData.reduce((sum, a) => sum + a.points, 0);
                        const totalXP = playerData.reduce((sum, a) => sum + a.xp, 0);
                        
                        timeoutText += `${playerRank}. ${answers}\n`;
                        timeoutText += `    @${userId.split('@')[0]}\n`;
                        timeoutText += `    *Total point:* ${totalPoints}\n`;
                        timeoutText += `    *Total xp:* ${totalXP}\n\n`;
                        playerRank++;
                    }
                } else {
                    timeoutText += `Jawaban yang benar: ${gameData.answers.join(', ')}\n\n`;
                }
                
                timeoutText += `Ketik command game lagi untuk bermain!`;
            } else {
                timeoutText = `⏰ *WAKTU HABIS!*\n\nJawaban yang benar: *${gameData.answer}*\n\nKetik command game lagi untuk bermain!`;
            }
            
            try {
                await message.reply(timeoutText);
            } catch (error) {
                console.error('Error sending timeout message:', error);
            }
        }
    }

    async giveHint(message, chatId, userId) {
        const gameData = await this.database.getGameSession(chatId);
        if (!gameData) {
            await message.reply('❌ Tidak ada game yang sedang berlangsung!');
            return { error: 'No active game' };
        }

        // Initialize hints if not set
        if (!gameData.hints) gameData.hints = 0;
        if (!gameData.maxHints) gameData.maxHints = 2;

        if (gameData.hints >= gameData.maxHints) {
            await message.reply('❌ Hint sudah habis! Maksimal 2 hint per game.');
            return { error: 'No more hints' };
        }

        gameData.hints++;
        await this.database.saveGameSession(chatId, gameData);
        let hintText = '';

        switch (gameData.type) {
            case 'tebakkata':
                const word = gameData.answer;
                const revealCount = Math.min(gameData.hints, Math.floor(word.length / 2));
                let maskedWord = '';
                
                for (let i = 0; i < word.length; i++) {
                    if (i < revealCount) {
                        maskedWord += word[i];
                    } else {
                        maskedWord += '_';
                    }
                }
                
                hintText = `💡 *HINT ${gameData.hints}/${gameData.maxHints}*\n\nHuruf: ${maskedWord}\nPanjang kata: ${word.length} huruf`;
                break;

            case 'math':
                hintText = `💡 *HINT ${gameData.hints}/${gameData.maxHints}*\n\nJawaban antara ${Math.floor(parseInt(gameData.answer) * 0.8)} - ${Math.ceil(parseInt(gameData.answer) * 1.2)}`;
                break;

            default:
                hintText = `💡 Hint tidak tersedia untuk game ini.`;
        }

        await message.reply(hintText);
        return { success: true };
    }

    async surrenderGame(message, chatId, userId) {
        const gameData = await this.database.getGameSession(chatId);
        if (!gameData) {
            await message.reply('❌ Tidak ada game yang sedang berlangsung!');
            return { error: 'No active game' };
        }

        const timeout = this.gameTimeouts.get(chatId);
        if (timeout) {
            clearTimeout(timeout);
            this.gameTimeouts.delete(chatId);
        }

        await this.database.deleteGameSession(chatId);

        const surrenderText = `🏳️ *GAME BERAKHIR*

Jawaban: ${gameData.answer || 'Game dihentikan'}
${gameData.problem ? `Soal: ${gameData.problem}` : ''}

Tidak apa-apa, coba lagi lain kali! 💪`;

        await message.reply(surrenderText);
        return { success: true };
    }

    generateMathProblem(difficulty = 'easy') {
        let num1, num2, operator, answer, problem;

        switch (difficulty) {
            case 'easy':
                num1 = Math.floor(Math.random() * 20) + 1;
                num2 = Math.floor(Math.random() * 20) + 1;
                operator = getRandomFromArray(['+', '-']);
                break;
            case 'hard':
                num1 = Math.floor(Math.random() * 100) + 20;
                num2 = Math.floor(Math.random() * 50) + 5;
                operator = getRandomFromArray(['+', '-', '×']);
                break;
            case 'extreme':
                num1 = Math.floor(Math.random() * 500) + 50;
                num2 = Math.floor(Math.random() * 100) + 10;
                operator = getRandomFromArray(['+', '-', '×', '÷']);
                break;
        }

        switch (operator) {
            case '+':
                answer = num1 + num2;
                break;
            case '-':
                answer = num1 - num2;
                break;
            case '×':
                answer = num1 * num2;
                break;
            case '÷':
                answer = Math.floor(num1 / num2);
                num1 = answer * num2; // Ensure clean division
                break;
        }

        problem = `${num1} ${operator} ${num2}`;

        return { problem, answer, difficulty };
    }

    async getTruthQuestion(message, userId) {
        const truthQuestions = gamesData.truthQuestions;
        const question = getRandomFromArray(truthQuestions);
        
        await message.reply(`🔍 *TRUTH*\n\n${question}\n\nJawab dengan jujur! 😊`);
        return { success: true };
    }

    async getDareChallenge(message, userId) {
        const dareChallenges = gamesData.dareChallenges;
        const challenge = getRandomFromArray(dareChallenges);
        
        await message.reply(`🔥 *DARE*\n\n${challenge}\n\nBerani terima tantangan? 😈`);
        return { success: true };
    }

    async buyLimit(message, userId, args) {
        if (!args[0] || isNaN(args[0]) || parseInt(args[0]) < 1) {
            await message.reply(`❌ *BELI LIMIT*\n\nFormat: .buylimit [jumlah]\nContoh: .buylimit 5\n\nHarga: ${config.USER_LIMITS.LIMIT_PURCHASE_COST} poin per limit`);
            return { error: 'Invalid format' };
        }

        const amount = parseInt(args[0]);
        const cost = amount * config.USER_LIMITS.LIMIT_PURCHASE_COST;

        if (amount > config.USER_LIMITS.MAX_PURCHASABLE_LIMITS) {
            await message.reply(`❌ Maksimal pembelian ${config.USER_LIMITS.MAX_PURCHASABLE_LIMITS} limit per hari!`);
            return { error: 'Exceeds maximum' };
        }

        const userData = await getUserData(userId);
        if (userData.points < cost) {
            await message.reply(`❌ *POIN TIDAK CUKUP*\n\nPoin Anda: ${userData.points}\nDibutuhkan: ${cost}\nKurang: ${cost - userData.points}\n\nMain game untuk dapat poin!`);
            return { error: 'Insufficient points' };
        }

        // Update user data
        await this.database.updateUserPoints(userId, -cost);
        const updatedUserData = await getUserData(userId);
        updatedUserData.limitTotal += amount;
        await this.database.updateUser(userId, updatedUserData);

        await message.reply(`✅ *PEMBELIAN BERHASIL*\n\nDibeli: ${amount} limit\nBiaya: ${cost} poin\nPoin tersisa: ${updatedUserData.points}\nLimit baru: ${updatedUserData.limitUsed}/${updatedUserData.limitTotal}`);
        return { success: true };
    }

    async transferBalance(message, userId, args) {
        const quotedMessage = await message.getQuotedMessage();
        let targetId;

        if (quotedMessage) {
            targetId = quotedMessage.author || quotedMessage.from;
        } else if (message.mentionedIds.length > 0) {
            targetId = message.mentionedIds[0];
        } else {
            
            return { error: 'No target specified' };
        }

        if (!args[0] || isNaN(args[0])) {
            
            return { error: 'Invalid amount' };
        }

        const amount = parseInt(args[0]);
        if (amount <= 0) {
            
            return { error: 'Invalid amount' };
        }

        const senderData = await getUserData(userId);
        if (senderData.points < amount) {
            
            return { error: 'Insufficient points' };
        }

        // Transfer points
        await updateUserPoints(userId, -amount);
        await updateUserPoints(targetId, amount);

        await message.reply(`✅ Berhasil transfer ${amount} poin!\nPoin tersisa: ${senderData.points - amount}`);
        return { success: true };
    }

    // Enhanced Game System Methods
    async showLeaderboard(message, args, chat) {
        try {
            let loadingId = await loadingIndicator.startTextGeneration(message, 'search');
            
            const type = args[0] || 'score';
            const validTypes = ['score', 'wins', 'streak', 'winrate', 'level'];
            
            if (!validTypes.includes(type)) {
                if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Invalid leaderboard type', false);
                await message.reply(`❌ Tipe leaderboard tidak valid!\n\nTipe yang tersedia: ${validTypes.join(', ')}\n\nContoh: .leaderboard wins`);
                return { error: 'Invalid type' };
            }

            const leaderboard = await this.gameScoring.getLeaderboard(type, 10, chat.id._serialized);
            
            if (leaderboard.length === 0) {
                if (loadingId) await loadingIndicator.stopLoading(loadingId, 'No players found', false);
                await message.reply('📊 Belum ada data pemain untuk leaderboard ini.');
                return { success: true };
            }

            const typeNames = {
                'score': 'TOTAL POINTS',
                'wins': 'TOTAL WINS', 
                'streak': 'BEST STREAK',
                'winrate': 'WIN RATE',
                'level': 'LEVEL'
            };

            let leaderboardText = `🏆 *LEADERBOARD ${typeNames[type]}*\n\n`;
            
            leaderboard.forEach((player, index) => {
                const rank = index + 1;
                const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
                
                let value;
                switch (type) {
                    case 'score':
                        value = `${player.points.toLocaleString()} pts`;
                        break;
                    case 'wins':
                        value = `${player.totalWins} wins`;
                        break;
                    case 'streak':
                        value = `${player.bestStreak} streak`;
                        break;
                    case 'winrate':
                        value = `${player.winRate}%`;
                        break;
                    case 'level':
                        value = `Level ${player.level}`;
                        break;
                }
                
                leaderboardText += `${medal} ${player.username}\n`;
                leaderboardText += `    ${value}\n\n`;
            });
            
            leaderboardText += `📈 Ketik .gameprofile untuk melihat profil game kamu!`;

            if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Leaderboard loaded', true);
            await message.reply(leaderboardText);
            return { success: true };
        } catch (error) {
            console.error('Show leaderboard error:', error);
            return { error: error.message };
        }
    }

    async showGameProfile(message, userId, contact) {
        try {
            let loadingId = await loadingIndicator.startTextGeneration(message, 'search');
            
            const profile = await this.gameScoring.getUserGameProfile(userId);
            
            if (!profile) {
                if (loadingId) await loadingIndicator.stopLoading(loadingId, 'No profile found', false);
                await message.reply('📊 Belum ada data game untuk profil kamu. Mainkan game untuk mulai mengumpulkan statistik!');
                return { success: true };
            }

            const userName = contact.pushname || contact.name || 'Player';
            
            let profileText = `👤 *GAME PROFILE*\n\n`;
            profileText += `🎮 *Player:* ${userName}\n`;
            profileText += `⭐ *Level:* ${profile.level}\n`;
            profileText += `💰 *Points:* ${profile.points.toLocaleString()}\n`;
            profileText += `✨ *Total XP:* ${profile.totalXP.toLocaleString()}\n\n`;
            
            profileText += `📊 *STATISTIK GAME*\n`;
            profileText += `🎯 *Total Games:* ${profile.totalGames}\n`;
            profileText += `🏆 *Total Wins:* ${profile.totalWins}\n`;
            profileText += `📈 *Win Rate:* ${profile.winRate}%\n`;
            profileText += `🔥 *Current Streak:* ${profile.currentStreak}\n`;
            profileText += `⚡ *Best Streak:* ${profile.bestStreak}\n\n`;
            
            if (profile.averageTime) {
                profileText += `⏱️ *Average Time:* ${profile.averageTime}s\n`;
            }
            if (profile.fastestWin) {
                profileText += `🏃 *Fastest Win:* ${profile.fastestWin}s\n`;
            }
            
            profileText += `\n🏅 *Achievements:* ${profile.achievements.length}\n`;
            profileText += `\n📱 Ketik .achievements untuk melihat achievement kamu!`;

            if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Profile loaded', true);
            await message.reply(profileText);
            return { success: true };
        } catch (error) {
            console.error('Show game profile error:', error);
            return { error: error.message };
        }
    }

    async showAchievements(message, userId) {
        try {
            let loadingId = await loadingIndicator.startTextGeneration(message, 'search');
            
            const profile = await this.gameScoring.getUserGameProfile(userId);
            
            if (!profile) {
                if (loadingId) await loadingIndicator.stopLoading(loadingId, 'No achievements found', false);
                await message.reply('🏅 Belum ada achievement. Mainkan game untuk unlock achievement!');
                return { success: true };
            }

            const userAchievements = profile.achievements;
            const allAchievements = this.gameScoring.achievements;
            
            let achievementText = `🏅 *ACHIEVEMENTS*\n\n`;
            achievementText += `📊 *Progress:* ${userAchievements.length}/${Object.keys(allAchievements).length}\n\n`;
            
            // Show unlocked achievements
            if (userAchievements.length > 0) {
                achievementText += `✅ *UNLOCKED ACHIEVEMENTS:*\n\n`;
                userAchievements.forEach(achievementId => {
                    const achievement = allAchievements[achievementId];
                    if (achievement) {
                        achievementText += `🏆 *${achievement.name}*\n`;
                        achievementText += `    ${achievement.description}\n`;
                        achievementText += `    Reward: ${achievement.reward} points\n\n`;
                    }
                });
            }
            
            // Show next achievements to unlock
            const lockedAchievements = Object.entries(allAchievements)
                .filter(([id]) => !userAchievements.includes(id))
                .slice(0, 3);
            
            if (lockedAchievements.length > 0) {
                achievementText += `🔒 *UPCOMING ACHIEVEMENTS:*\n\n`;
                lockedAchievements.forEach(([id, achievement]) => {
                    achievementText += `⭐ *${achievement.name}*\n`;
                    achievementText += `    ${achievement.description}\n`;
                    achievementText += `    Reward: ${achievement.reward} points\n\n`;
                });
            }
            
            achievementText += `🎮 Keep playing to unlock more achievements!`;

            if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Achievements loaded', true);
            await message.reply(achievementText);
            return { success: true };
        } catch (error) {
            console.error('Show achievements error:', error);
            return { error: error.message };
        }
    }

    async showGameStats(message, userId) {
        try {
            let loadingId = await loadingIndicator.startTextGeneration(message, 'search');
            
            const profile = await this.gameScoring.getUserGameProfile(userId);
            
            if (!profile) {
                if (loadingId) await loadingIndicator.stopLoading(loadingId, 'No stats found', false);
                await message.reply('📊 Belum ada statistik game.');
                return { success: true };
            }

            let statsText = `📊 *DETAILED GAME STATISTICS*\n\n`;
            
            // Game type statistics
            if (Object.keys(profile.gamesWonByType).length > 0) {
                statsText += `🎯 *WINS BY GAME TYPE:*\n`;
                Object.entries(profile.gamesWonByType)
                    .sort(([,a], [,b]) => b - a)
                    .forEach(([gameType, wins]) => {
                        statsText += `${gameType}: ${wins} wins\n`;
                    });
                statsText += '\n';
            }
            
            // Category statistics
            if (Object.keys(profile.gamesWonByCategory).length > 0) {
                statsText += `📚 *WINS BY CATEGORY:*\n`;
                Object.entries(profile.gamesWonByCategory)
                    .sort(([,a], [,b]) => b - a)
                    .forEach(([category, wins]) => {
                        const categoryEmoji = {
                            'word': '📝',
                            'logic': '🧠',
                            'visual': '👁️',
                            'trivia': '📚',
                            'geography': '🌍',
                            'music': '🎵'
                        };
                        statsText += `${categoryEmoji[category] || '🎮'} ${category}: ${wins} wins\n`;
                    });
                statsText += '\n';
            }
            
            statsText += `🎯 *PERFORMANCE METRICS:*\n`;
            statsText += `Average Score: ${profile.averageScore} points\n`;
            if (profile.averageTime) {
                statsText += `Average Time: ${profile.averageTime}s\n`;
            }
            if (profile.fastestWin) {
                statsText += `Fastest Win: ${profile.fastestWin}s\n`;
            }

            if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Stats loaded', true);
            await message.reply(statsText);
            return { success: true };
        } catch (error) {
            console.error('Show game stats error:', error);
            return { error: error.message };
        }
    }

    async showTopGames(message) {
        try {
            const topGamesText = `🎮 *TOP GAMES AVAILABLE*\n\n` +
                `🔤 *.tebakkata* - Guess the word (100 pts)\n` +
                `🖼️ *.tebakgambar* - Guess the image (150 pts)\n` +
                `🔢 *.math* - Math problems (80 pts)\n` +
                `👨‍👩‍👧‍👦 *.family100* - Family 100 (200 pts)\n` +
                `🧠 *.asahotak* - Brain teasers (120 pts)\n` +
                `🎪 *.caklontong* - Riddles (90 pts)\n` +
                `🏴 *.tebakbendera* - Guess the flag (110 pts)\n` +
                `🎵 *.tebaklagu* - Guess the song (130 pts)\n` +
                `👤 *.tebakchara* - Guess character (140 pts)\n` +
                `🔤 *.susunkata* - Word arrange (95 pts)\n\n` +
                `💡 *GAME FEATURES:*\n` +
                `🏆 Competitive scoring system\n` +
                `📊 Personal leaderboards\n` +
                `🏅 Achievement system\n` +
                `⚡ XP and level progression\n` +
                `🔥 Win streak tracking\n\n` +
                `📱 Type .gamehelp for more info!`;
            
            await message.reply(topGamesText);
            return { success: true };
        } catch (error) {
            console.error('Show top games error:', error);
            return { error: error.message };
        }
    }

    async claimDailyBonus(message, userId) {
        try {
            const userData = await this.database.getUser(userId);
            const lastClaim = userData.lastDailyBonus ? new Date(userData.lastDailyBonus) : null;
            const today = new Date();
            
            // Check if user already claimed today
            if (lastClaim && lastClaim.toDateString() === today.toDateString()) {
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(0, 0, 0, 0);
                
                const hoursLeft = Math.ceil((tomorrow - today) / (1000 * 60 * 60));
                await message.reply(`⏰ Daily bonus sudah diklaim hari ini!\n\nCoba lagi dalam ${hoursLeft} jam.`);
                return { error: 'Already claimed today' };
            }
            
            // Calculate bonus based on consecutive days
            let consecutiveDays = 1;
            if (lastClaim) {
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                
                if (lastClaim.toDateString() === yesterday.toDateString()) {
                    consecutiveDays = (userData.consecutiveDailyBonus || 0) + 1;
                }
            }
            
            // Calculate bonus amount
            const baseBonus = 100;
            const streakBonus = Math.min(consecutiveDays * 25, 500); // Max 500 bonus
            const totalBonus = baseBonus + streakBonus;
            
            // Award bonus
            await this.database.updateUserPoints(userId, totalBonus);
            await this.database.updateUser(userId, {
                lastDailyBonus: today.toISOString(),
                consecutiveDailyBonus: consecutiveDays
            });
            
            const bonusText = `🎁 *DAILY BONUS CLAIMED!*\n\n` +
                `💰 Base Bonus: ${baseBonus} points\n` +
                `🔥 Streak Bonus: ${streakBonus} points\n` +
                `📅 Consecutive Days: ${consecutiveDays}\n\n` +
                `✨ *Total Bonus: ${totalBonus} points*\n\n` +
                `Come back tomorrow for more bonus!`;
            
            await message.reply(bonusText);
            return { success: true };
        } catch (error) {
            console.error('Claim daily bonus error:', error);
            return { error: error.message };
        }
    }

    async showGameHelp(message) {
        try {
            const helpText = `🎮 *COMPREHENSIVE GAME SYSTEM*\n\n` +
                `🎯 *BASIC COMMANDS:*\n` +
                `• .math [easy/medium/hard] - Math quiz\n` +
                `• .tebakkata - Word guessing\n` +
                `• .family100 - Family 100 game\n` +
                `• .hint - Get hint during game\n` +
                `• .nyerah - Surrender current game\n\n` +
                
                `📊 *STATS & LEADERBOARDS:*\n` +
                `• .leaderboard [type] - View leaderboards\n` +
                `• .gameprofile - Your game profile\n` +
                `• .gamestats - Detailed statistics\n` +
                `• .achievements - View achievements\n\n` +
                
                `🏆 *SCORING SYSTEM:*\n` +
                `• Base points vary by game type\n` +
                `• Time bonus for fast answers\n` +
                `• Streak multipliers\n` +
                `• Difficulty modifiers\n` +
                `• Achievement rewards\n\n` +
                
                `💰 *ECONOMY:*\n` +
                `• .dailybonus - Claim daily bonus\n` +
                `• .buylimit - Buy more game attempts\n` +
                `• .tfbalance - Transfer points\n\n` +
                
                `📈 *PROGRESSION:*\n` +
                `• XP system with levels\n` +
                `• Win streak tracking\n` +
                `• Category expertise\n` +
                `• Achievement unlocks\n\n` +
                
                `🎮 Happy gaming!`;
            
            await message.reply(helpText);
            return { success: true };
        } catch (error) {
            console.error('Show game help error:', error);
            return { error: error.message };
        }
    }
}

module.exports = GameHandler;
