const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');
const { getRandomFromArray } = require('../utils/helpers');
const quotesData = require('../data/quotes');

class RandomHandler {
    async handleCommand(command, args, message, contact, chat, client) {
        try {
            switch (command) {
                case 'quotesanime':
                    return await this.getAnimeQuote(message);

                case 'katabijak':
                case 'wisdom':
                    return await this.getWisdomQuote(message);

                case 'pantun':
                    return await this.getPantun(message);

                case 'puisi':
                case 'poem':
                    return await this.getPoem(message);

                case 'faktaunik':
                case 'randomfact':
                    return await this.getUniqueFact(message);

                case 'randomnumber':
                    return await this.getRandomNumber(message, args);

                case 'randomtag':
                    return await this.getRandomTag(message, chat);

                case 'randomanime':
                    return await this.getRandomAnime(message);

                case 'randommeme':
                case 'meme':
                    return await this.getRandomMeme(message);

                case 'waifu':
                    return await this.getWaifu(message);

                case 'neko':
                    return await this.getNeko(message);

                case 'loli':
                    return await this.getLoli(message);

                case 'husbu':
                case 'husbando':
                    return await this.getHusbando(message);

                case 'ppcouple':
                case 'couple':
                    return await this.getCoupleProfilePic(message);

                case 'apakah':
                    return await this.askQuestion(message, args);

                case 'kapankah':
                case 'kapan':
                    return await this.askWhen(message, args);

                case 'siapakah':
                case 'siapa':
                    return await this.askWho(message, args);

                case 'rate':
                    return await this.rateText(message, args);

                case 'jadian':
                case 'jodohku':
                    return await this.matchmaking(message, chat);

                case 'alay':
                    return await this.convertToAlay(message, args);

                default:
                    // Silent fail - don't show error message
                    return { error: 'Random command not implemented' };
            }
        } catch (error) {
            console.error('Random handler error:', error);
            // Silent error - don't show error message to user
            return { error: error.message };
        }
    }

    async getAnimeQuote(message) {
        try {
            const quote = getRandomFromArray(quotesData.animeQuotes);
            
            const quoteText = `🌸 *QUOTES ANIME*

"${quote.text}"

~ ${quote.character} (${quote.anime})`;

            await message.reply(quoteText);
            return { success: true };
        } catch (error) {
            return { error: error.message };
        }
    }

    async getWisdomQuote(message) {
        const quote = getRandomFromArray(quotesData.wisdomQuotes);
        
        const quoteText = `💎 *KATA BIJAK*

"${quote.text}"

~ ${quote.author}`;

        await message.reply(quoteText);
        return { success: true };
    }

    async getPantun(message) {
        const pantun = getRandomFromArray(quotesData.pantun);
        
        const pantunText = `🎭 *PANTUN*

${pantun.sampiran1}
${pantun.sampiran2}
${pantun.isi1}
${pantun.isi2}`;

        await message.reply(pantunText);
        return { success: true };
    }

    async getPoem(message) {
        const poem = getRandomFromArray(quotesData.poems);
        
        const poemText = `📝 *PUISI*

*${poem.title}*
${poem.author ? `Karya: ${poem.author}` : ''}

${poem.content}`;

        await message.reply(poemText);
        return { success: true };
    }

    async getUniqueFact(message) {
        const fact = getRandomFromArray(quotesData.uniqueFacts);
        
        const factText = `🤯 *FAKTA UNIK*

${fact}

#TahukahAnda`;

        await message.reply(factText);
        return { success: true };
    }

    async getRandomNumber(message, args) {
        let min = 1;
        let max = 100;

        if (args.length === 1 && !isNaN(args[0])) {
            max = parseInt(args[0]);
        } else if (args.length === 2 && !isNaN(args[0]) && !isNaN(args[1])) {
            min = parseInt(args[0]);
            max = parseInt(args[1]);
        }

        if (min >= max) {
            
            return { error: 'Invalid range' };
        }

        const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
        
        await message.reply(`🎲 *RANDOM NUMBER*\n\nRange: ${min} - ${max}\nHasil: **${randomNum}**`);
        return { success: true };
    }

    async getRandomTag(message, chat) {
        if (!chat.isGroup) {
            
            return { error: 'Group only' };
        }

        const participants = chat.participants;
        if (participants.length === 0) {
            
            return { error: 'No participants' };
        }

        const randomParticipant = getRandomFromArray(participants);
        const contact = await client.getContactById(randomParticipant.id._serialized);
        
        await message.reply(`🎯 *RANDOM TAG*\n\nTerpilih: @${randomParticipant.id.user} (${contact.pushname || contact.name || 'Unknown'})`, 
            undefined, { mentions: [randomParticipant.id._serialized] });
        
        return { success: true };
    }

    async getRandomAnime(message) {
        try {
            // Using a mock anime data since we don't have actual API
            const animes = [
                { title: "Naruto", genre: "Action, Adventure", year: 2002 },
                { title: "One Piece", genre: "Action, Adventure", year: 1999 },
                { title: "Attack on Titan", genre: "Action, Drama", year: 2013 },
                { title: "Demon Slayer", genre: "Action, Supernatural", year: 2019 },
                { title: "My Hero Academia", genre: "Action, School", year: 2016 }
            ];

            const anime = getRandomFromArray(animes);
            
            const animeText = `🎌 *RANDOM ANIME*

Judul: ${anime.title}
Genre: ${anime.genre}
Tahun: ${anime.year}

Selamat menonton! 🍿`;

            await message.reply(animeText);
            return { success: true };
        } catch (error) {
            
            return { error: error.message };
        }
    }

    async getRandomMeme(message) {
        try {
            // This would typically fetch from a meme API
            const memes = [
                "https://i.imgflip.com/1bij.jpg",
                "https://i.imgflip.com/5c7lwq.jpg", 
                "https://i.imgflip.com/1otk96.jpg"
            ];

            const memeUrl = getRandomFromArray(memes);
            
            try {
                const response = await axios.get(memeUrl, { responseType: 'arraybuffer' });
                const imageBuffer = Buffer.from(response.data);
                const media = new MessageMedia('image/jpeg', imageBuffer.toString('base64'), 'meme.jpg');
                
                await message.reply(media, undefined, { caption: '😂 *RANDOM MEME*\n\nSelamat tertawa!' });
                return { success: true };
            } catch (imageError) {
                return;
                return { success: true };
            }
        } catch (error) {
            
            return { error: error.message };
        }
    }

    async getWaifu(message) {
        const waifuText = `👸 *RANDOM WAIFU*

Nama: ${getRandomFromArray(['Sakura', 'Hinata', 'Mikasa', 'Nezuko', 'Miku'])}
Anime: ${getRandomFromArray(['Naruto', 'Attack on Titan', 'Demon Slayer', 'Vocaloid'])}
Tipe: ${getRandomFromArray(['Tsundere', 'Yandere', 'Kuudere', 'Dandere'])}

Waifu pilihan hari ini! 💕`;

        await message.reply(waifuText);
        return { success: true };
    }

    async getNeko(message) {
        const nekoText = `🐱 *RANDOM NEKO*

Nama: Neko-chan
Jenis: ${getRandomFromArray(['Kucing Persia', 'Kucing Anggora', 'Kucing Maine Coon', 'Kucing Ragdoll'])}
Warna: ${getRandomFromArray(['Putih', 'Hitam', 'Orange', 'Abu-abu', 'Calico'])}
Sifat: ${getRandomFromArray(['Lucu', 'Nakal', 'Manja', 'Penyayang', 'Aktif'])}

Nya~ 🐾`;

        await message.reply(nekoText);
        return { success: true };
    }

    async getLoli(message) {
        return;
        return { success: true };
    }

    async getHusbando(message) {
        const husbandonText = `👨 *RANDOM HUSBANDO*

Nama: ${getRandomFromArray(['Sasuke', 'Levi', 'Tanjiro', 'Gojo', 'Itachi'])}
Anime: ${getRandomFromArray(['Naruto', 'Attack on Titan', 'Demon Slayer', 'Jujutsu Kaisen'])}
Tipe: ${getRandomFromArray(['Cool', 'Protective', 'Mysterious', 'Strong', 'Kind'])}

Husbando pilihan hari ini! 💙`;

        await message.reply(husbandonText);
        return { success: true };
    }

    async getCoupleProfilePic(message) {
        await message.reply(`💑 *PP COUPLE*

Maaf, fitur PP Couple sedang dalam pengembangan.
Silakan cari di Google dengan kata kunci "anime couple profile picture"

Tips: Gunakan gambar yang matching untuk couple! 💕`);
        return { success: true };
    }

    async askQuestion(message, args) {
        if (!args.length) {
            
            return { error: 'No question provided' };
        }

        const answers = [
            'Ya', 'Tidak', 'Mungkin', 'Bisa jadi', 'Tidak mungkin',
            'Sudah pasti', 'Sangat mungkin', 'Kemungkinan kecil',
            'Iya dong', 'Enggak lah', 'Tergantung', 'Sulit diprediksi'
        ];

        const question = args.join(' ');
        const answer = getRandomFromArray(answers);

        await message.reply(`🔮 *PERTANYAAN RANDOM*\n\nPertanyaan: ${question}\nJawaban: **${answer}**`);
        return { success: true };
    }

    async askWhen(message, args) {
        if (!args.length) {
            
            return { error: 'No question provided' };
        }

        const timeAnswers = [
            'Besok', 'Minggu depan', 'Bulan depan', 'Tahun depan',
            '5 menit lagi', '1 jam lagi', 'Nanti malam', 'Pagi ini',
            'Tidak akan pernah', 'Sudah terjadi', 'Dalam waktu dekat',
            'Masih lama', 'Sebentar lagi', 'Kapan-kapan'
        ];

        const question = args.join(' ');
        const answer = getRandomFromArray(timeAnswers);

        await message.reply(`⏰ *KAPAN YA?*\n\nPertanyaan: ${question}\nJawaban: **${answer}**`);
        return { success: true };
    }

    async askWho(message, args) {
        if (!args.length) {
            return { error: 'No question provided' };
        }

        const whoAnswers = [
            'Kamu', 'Saya', 'Dia', 'Mereka', 'Seseorang',
            'Orang terkaya di dunia', 'Tetangga sebelah', 'Teman dekat',
            'Keluarga', 'Tidak ada yang tahu', 'Rahasia', 'Siapa ya?'
        ];

        const question = args.join(' ');
        const answer = getRandomFromArray(whoAnswers);

        await message.reply(`👤 *SIAPA YA?*\n\nPertanyaan: ${question}\nJawaban: **${answer}**`);
        return { success: true };
    }

    async rateText(message, args) {
        if (!args.length) {
            return { error: 'Nothing to rate' };
        }

        const thing = args.join(' ');
        const rating = Math.floor(Math.random() * 10) + 1;
        const stars = '⭐'.repeat(Math.floor(rating / 2));

        await message.reply(`⭐ *RATING*\n\n${thing}\n\nRating: ${rating}/10 ${stars}`);
        return { success: true };
    }

    async matchmaking(message, chat) {
        if (!chat.isGroup) {
            return { error: 'Group only command' };
        }

        const participants = chat.participants.filter(p => !p.isAdmin);
        if (participants.length < 2) {
            return { error: 'Not enough participants' };
        }

        const person1 = getRandomFromArray(participants);
        const person2 = getRandomFromArray(participants.filter(p => p.id._serialized !== person1.id._serialized));

        const compatibility = Math.floor(Math.random() * 100) + 1;

        await message.reply(`💕 *MATCHMAKING*\n\n@${person1.id.user} ❤️ @${person2.id.user}\n\nTingkat Kecocokan: ${compatibility}%\n\n${compatibility > 80 ? 'Couple goals! 💑' : compatibility > 50 ? 'Ada peluang nih! 😊' : 'Hmm, perlu usaha lebih 😅'}`,
            undefined, { mentions: [person1.id._serialized, person2.id._serialized] });

        return { success: true };
    }

    async convertToAlay(message, args) {
        if (!args.length) {
            
            return { error: 'No text provided' };
        }

        const text = args.join(' ');
        const alayMap = {
            'a': '4', 'i': '1', 'o': '0', 'e': '3', 's': '5',
            'g': '9', 't': '7', 'l': '1', 'A': '4', 'I': '1',
            'O': '0', 'E': '3', 'S': '5', 'G': '9', 'T': '7', 'L': '1'
        };

        let alayText = text;
        for (const [normal, alay] of Object.entries(alayMap)) {
            alayText = alayText.replace(new RegExp(normal, 'g'), alay);
        }

        // Add random uppercase/lowercase
        alayText = alayText.split('').map((char, index) => {
            if (index % 2 === 0) {
                return char.toUpperCase();
            } else {
                return char.toLowerCase();
            }
        }).join('');

        await message.reply(`🔤 *TEKS ALAY*\n\nAsli: ${text}\nAlay: ${alayText}`);
        return { success: true };
    }
}

module.exports = RandomHandler;
