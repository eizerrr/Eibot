const { Database } = require('./database');

class GameScoring {
    constructor() {
        this.db = new Database();
        this.scoreMultipliers = {
            'easy': 1.0,
            'medium': 1.5,
            'hard': 2.0,
            'expert': 3.0
        };
        
        this.gameTypes = {
            'tebakkata': { baseScore: 100, timeBonus: 5, category: 'word' },
            'tebakgambar': { baseScore: 150, timeBonus: 7, category: 'visual' },
            'math': { baseScore: 80, timeBonus: 10, category: 'logic' },
            'family100': { baseScore: 200, timeBonus: 3, category: 'trivia' },
            'asahotak': { baseScore: 120, timeBonus: 8, category: 'logic' },
            'caklontong': { baseScore: 90, timeBonus: 6, category: 'trivia' },
            'tebakbendera': { baseScore: 110, timeBonus: 5, category: 'geography' },
            'tebaklagu': { baseScore: 130, timeBonus: 4, category: 'music' },
            'tebakchara': { baseScore: 140, timeBonus: 6, category: 'pop culture' },
            'susunkata': { baseScore: 95, timeBonus: 7, category: 'word' }
        };

        this.achievements = {
            'first_win': { name: 'First Victory', description: 'Win your first game', reward: 500 },
            'speed_demon': { name: 'Speed Demon', description: 'Answer correctly in under 10 seconds', reward: 200 },
            'perfectionist': { name: 'Perfectionist', description: 'Get 10 answers correct in a row', reward: 1000 },
            'game_master': { name: 'Game Master', description: 'Win 100 games', reward: 5000 },
            'category_expert_word': { name: 'Word Expert', description: 'Win 25 word games', reward: 800 },
            'category_expert_logic': { name: 'Logic Master', description: 'Win 25 logic games', reward: 800 },
            'category_expert_visual': { name: 'Visual Genius', description: 'Win 25 visual games', reward: 800 },
            'category_expert_trivia': { name: 'Trivia Champion', description: 'Win 25 trivia games', reward: 800 },
            'category_expert_geography': { name: 'Geography Expert', description: 'Win 25 geography games', reward: 800 },
            'category_expert_music': { name: 'Music Maestro', description: 'Win 25 music games', reward: 800 },
            'daily_player': { name: 'Daily Player', description: 'Play games for 7 consecutive days', reward: 1500 },
            'high_scorer': { name: 'High Scorer', description: 'Score over 10,000 points in total', reward: 2000 },
            'streak_master': { name: 'Streak Master', description: 'Maintain a 20-game win streak', reward: 3000 }
        };
    }

    // Calculate score based on game type, difficulty, time taken, and streak
    calculateScore(gameType, difficulty = 'easy', timeTaken = 30, isCorrect = true, winStreak = 0) {
        if (!isCorrect) return 0;

        const gameConfig = this.gameTypes[gameType] || this.gameTypes['tebakkata'];
        const multiplier = this.scoreMultipliers[difficulty] || 1.0;
        
        // Base score with difficulty multiplier
        let score = Math.floor(gameConfig.baseScore * multiplier);
        
        // Time bonus (faster = more points)
        const maxTime = 60; // Maximum time in seconds
        const timeBonus = Math.max(0, (maxTime - timeTaken) * gameConfig.timeBonus);
        score += Math.floor(timeBonus);
        
        // Win streak bonus
        const streakBonus = Math.min(winStreak * 10, 500); // Max 500 bonus points
        score += streakBonus;
        
        // Minimum score guarantee
        return Math.max(score, 10);
    }

    // Award XP based on game performance
    calculateXP(score, isWin = true) {
        let xp = Math.floor(score / 5); // Base XP is 1/5 of score
        
        if (isWin) {
            xp += 25; // Win bonus
        } else {
            xp = Math.floor(xp * 0.3); // Participation XP for wrong answers
        }
        
        return Math.max(xp, 1);
    }

    // Update user game statistics
    async updateGameStats(userId, gameType, isWin, score, timeTaken, difficulty = 'easy') {
        try {
            const userData = await this.db.getUser(userId);
            
            // Initialize game stats if not exists
            if (!userData.gameStats) {
                userData.gameStats = {
                    totalGames: 0,
                    totalWins: 0,
                    totalScore: 0,
                    winStreak: 0,
                    bestStreak: 0,
                    gamesWonByType: {},
                    gamesWonByCategory: {},
                    averageTime: 0,
                    fastestWin: 999,
                    achievements: [],
                    lastPlayDate: null,
                    consecutiveDays: 0
                };
            }

            const stats = userData.gameStats;
            const gameConfig = this.gameTypes[gameType] || this.gameTypes['tebakkata'];
            
            // Update basic stats
            stats.totalGames++;
            stats.totalScore += score;
            
            if (isWin) {
                stats.totalWins++;
                stats.winStreak++;
                stats.bestStreak = Math.max(stats.bestStreak, stats.winStreak);
                
                // Update game type stats
                stats.gamesWonByType[gameType] = (stats.gamesWonByType[gameType] || 0) + 1;
                stats.gamesWonByCategory[gameConfig.category] = (stats.gamesWonByCategory[gameConfig.category] || 0) + 1;
                
                // Update timing stats
                if (timeTaken < stats.fastestWin) {
                    stats.fastestWin = timeTaken;
                }
                
                stats.averageTime = ((stats.averageTime * (stats.totalWins - 1)) + timeTaken) / stats.totalWins;
            } else {
                stats.winStreak = 0; // Reset streak on loss
            }

            // Update daily play tracking
            const today = new Date().toDateString();
            const lastPlay = stats.lastPlayDate ? new Date(stats.lastPlayDate).toDateString() : null;
            
            if (lastPlay !== today) {
                if (lastPlay) {
                    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
                    if (lastPlay === yesterday) {
                        stats.consecutiveDays++;
                    } else {
                        stats.consecutiveDays = 1;
                    }
                } else {
                    stats.consecutiveDays = 1;
                }
                stats.lastPlayDate = new Date().toISOString();
            }

            // Check for achievements
            const newAchievements = await this.checkAchievements(userId, stats, gameType, isWin, timeTaken);
            
            // Update user data
            await this.db.updateUser(userId, { gameStats: stats });
            
            return {
                score,
                xp: this.calculateXP(score, isWin),
                newAchievements,
                currentStreak: stats.winStreak,
                totalWins: stats.totalWins
            };
            
        } catch (error) {
            console.error('Error updating game stats:', error);
            return { score: 0, xp: 0, newAchievements: [], currentStreak: 0, totalWins: 0 };
        }
    }

    // Check and award achievements
    async checkAchievements(userId, stats, gameType, isWin, timeTaken) {
        const newAchievements = [];
        const userAchievements = stats.achievements || [];
        
        // Check each achievement
        for (const [achievementId, achievement] of Object.entries(this.achievements)) {
            if (userAchievements.includes(achievementId)) continue;
            
            let earned = false;
            
            switch (achievementId) {
                case 'first_win':
                    earned = isWin && stats.totalWins === 1;
                    break;
                case 'speed_demon':
                    earned = isWin && timeTaken <= 10;
                    break;
                case 'perfectionist':
                    earned = stats.winStreak >= 10;
                    break;
                case 'game_master':
                    earned = stats.totalWins >= 100;
                    break;
                case 'daily_player':
                    earned = stats.consecutiveDays >= 7;
                    break;
                case 'high_scorer':
                    earned = stats.totalScore >= 10000;
                    break;
                case 'streak_master':
                    earned = stats.bestStreak >= 20;
                    break;
                default:
                    // Category expert achievements
                    if (achievementId.startsWith('category_expert_')) {
                        const category = achievementId.replace('category_expert_', '');
                        earned = (stats.gamesWonByCategory[category] || 0) >= 25;
                    }
            }
            
            if (earned) {
                userAchievements.push(achievementId);
                newAchievements.push(achievement);
                
                // Award achievement reward
                await this.db.updateUserPoints(userId, achievement.reward);
            }
        }
        
        stats.achievements = userAchievements;
        return newAchievements;
    }

    // Get user's game profile
    async getUserGameProfile(userId) {
        try {
            const userData = await this.db.getUser(userId);
            const stats = userData.gameStats || {};
            
            const winRate = stats.totalGames > 0 ? ((stats.totalWins / stats.totalGames) * 100).toFixed(1) : 0;
            const avgScore = stats.totalWins > 0 ? Math.floor(stats.totalScore / stats.totalWins) : 0;
            const level = Math.floor(userData.xp / 1000) + 1;
            
            return {
                level,
                totalXP: userData.xp || 0,
                points: userData.points || 0,
                totalGames: stats.totalGames || 0,
                totalWins: stats.totalWins || 0,
                winRate,
                averageScore: avgScore,
                currentStreak: stats.winStreak || 0,
                bestStreak: stats.bestStreak || 0,
                fastestWin: stats.fastestWin === 999 ? null : stats.fastestWin,
                averageTime: stats.averageTime ? stats.averageTime.toFixed(1) : null,
                achievements: stats.achievements || [],
                gamesWonByType: stats.gamesWonByType || {},
                gamesWonByCategory: stats.gamesWonByCategory || {}
            };
        } catch (error) {
            console.error('Error getting user game profile:', error);
            return null;
        }
    }

    // Get leaderboard data
    async getLeaderboard(type = 'score', limit = 10, chatId = null) {
        try {
            const { Database } = require('./database');
            const db = new Database();
            const stats = await db.getStats();
            
            // Get all users with game stats
            let users = [];
            for (const [userId, userData] of Object.entries(stats.users || {})) {
                if (userData.gameStats) {
                    const profile = await this.getUserGameProfile(userId);
                    if (profile) {
                        users.push({
                            userId,
                            username: userData.username || 'Unknown',
                            ...profile
                        });
                    }
                }
            }

            // Sort based on type
            switch (type) {
                case 'wins':
                    users.sort((a, b) => b.totalWins - a.totalWins);
                    break;
                case 'streak':
                    users.sort((a, b) => b.bestStreak - a.bestStreak);
                    break;
                case 'winrate':
                    users.sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));
                    break;
                case 'level':
                    users.sort((a, b) => b.level - a.level);
                    break;
                default: // score
                    users.sort((a, b) => b.points - a.points);
            }

            return users.slice(0, limit);
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            return [];
        }
    }
}

module.exports = GameScoring;