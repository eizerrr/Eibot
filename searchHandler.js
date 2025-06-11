const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');
const config = require('../config/config');
const loadingIndicator = require('../utils/loadingIndicator');

class SearchHandler {
    async handleCommand(command, args, message, contact, chat, client) {
        try {
            switch (command) {
                case 'google':
                    return await this.searchGoogle(message, args);

                case 'googleimage':
                    return await this.searchGoogleImages(message, args);

                case 'wikipedia':
                    return await this.searchWikipedia(message, args);

                case 'ytsearch':
                    return await this.searchYouTube(message, args);

                case 'play':
                    return await this.playYouTube(message, args);

                case 'lirik':
                    return await this.searchLyrics(message, args);

                case 'cuaca':
                    return await this.getWeather(message, args);

                case 'jadwalshalat':
                    return await this.getPrayerTimes(message, args);

                case 'artinama':
                    return await this.getNameMeaning(message, args);

                case 'pinterest':
                    return await this.searchPinterest(message, args);

                case 'igstalk':
                    return await this.stalkInstagram(message, args);

                case 'brainly':
                    return await this.searchBrainly(message, args);

                case 'cekidml':
                    return await this.checkMLID(message, args);

                case 'cekidff':
                    return await this.checkFFID(message, args);

                case 'ipchecker':
                    return await this.checkIP(message, args);

                case 'alquranaudio':
                    return await this.getQuranAudio(message, args);

                case 'dorama':
                    return await this.searchDorama(message, args);

                case 'otakudesu':
                    return await this.searchOtakudesu(message, args);

                case 'otakudesuinfo':
                    return await this.getOtakudesuInfo(message, args);

                case 'otakudesuongoing':
                    return await this.getOtakudesuOngoing(message);

                default:
                    // Silent fail - don't show error message
                    return { error: 'Search command not implemented' };
            }
        } catch (error) {
            console.error('Search handler error:', error);
            // Silent error - don't show error message to user
            return { error: error.message };
        }
    }

    async searchGoogle(message, args) {
        if (!args.length) {
            await message.reply('❌ *Google Search*\n\nContoh: .google cara membuat nasi goreng');
            return { error: 'No search query' };
        }

        const query = args.join(' ');
        let loadingId = null;
        
        try {
            // Start loading indicator for search
            loadingId = await loadingIndicator.startTextGeneration(message, 'search');

            // Using Google Custom Search API (you would need to set this up)
            const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${config.GOOGLE_API_KEY}&cx=YOUR_SEARCH_ENGINE_ID&q=${encodeURIComponent(query)}`;
            
            if (!config.GOOGLE_API_KEY) {
                // Stop loading and provide search link
                if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Search link generated', true);
                
                const googleLink = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                
                const searchText = `🔍 *GOOGLE SEARCH*

Kata kunci: ${query}
Link: ${googleLink}

Klik link di atas untuk melihat hasil pencarian!`;

                await message.reply(searchText);
                return { success: true };
            }

            const response = await axios.get(searchUrl);
            const results = response.data.items?.slice(0, 5) || [];

            if (results.length === 0) {
                if (loadingId) await loadingIndicator.stopLoading(loadingId, 'No results found', false);
                await message.reply(`❌ Tidak ada hasil ditemukan untuk: ${query}`);
                return { error: 'No results found' };
            }

            let searchText = `🔍 *HASIL GOOGLE SEARCH*\n\nKata kunci: ${query}\n\n`;
            
            results.forEach((result, index) => {
                searchText += `${index + 1}. *${result.title}*\n`;
                searchText += `${result.snippet}\n`;
                searchText += `${result.link}\n\n`;
            });

            if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Search completed', true);
            await message.reply(searchText);
            return { success: true };
        } catch (error) {
            console.error('Google search error:', error);
            
            if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Search failed', false);
            await message.reply('❌ Gagal melakukan pencarian Google. Coba lagi nanti.');
            return { error: error.message };
        }
    }

    async searchWikipedia(message, args) {
        if (!args.length) {
            
            return { error: 'No search query' };
        }

        const query = args.join(' ');
        
        try {
            const searchUrl = `https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
            const response = await axios.get(searchUrl);
            const data = response.data;

            if (data.type === 'disambiguation') {
                await message.reply(`🔍 *WIKIPEDIA*\n\nTerm "${query}" memiliki beberapa arti. Silakan coba dengan kata kunci yang lebih spesifik.`);
                return { success: true };
            }

            const wikiText = `📚 *WIKIPEDIA*

*${data.title}*

${data.extract || 'Tidak ada deskripsi tersedia.'}

Link: ${data.content_urls?.mobile?.page || data.content_urls?.desktop?.page || 'Tidak tersedia'}`;

            await message.reply(wikiText);
            return { success: true };
        } catch (error) {
            if (error.response?.status === 404) {
                
            } else {
                
            }
            return { error: error.message };
        }
    }

    async searchYouTube(message, args) {
        if (!args.length) {
            
            return { error: 'No search query' };
        }

        const query = args.join(' ');
        
        try {
            if (!config.YOUTUBE_API_KEY) {
                // Fallback to search link
                const youtubeLink = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
                
                await message.reply(`🔍 *YOUTUBE SEARCH*\n\nKata kunci: ${query}\nLink: ${youtubeLink}`);
                return { success: true };
            }

            const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(query)}&type=video&key=${config.YOUTUBE_API_KEY}`;
            const response = await axios.get(searchUrl);
            const videos = response.data.items;

            if (videos.length === 0) {
                
                return { error: 'No results found' };
            }

            let searchText = `🎥 *YOUTUBE SEARCH*\n\nKata kunci: ${query}\n\n`;
            
            videos.forEach((video, index) => {
                searchText += `${index + 1}. *${video.snippet.title}*\n`;
                searchText += `Channel: ${video.snippet.channelTitle}\n`;
                searchText += `Link: https://youtube.com/watch?v=${video.id.videoId}\n\n`;
            });

            await message.reply(searchText);
            return { success: true };
        } catch (error) {
            console.error('YouTube search error:', error);
            
            return { error: error.message };
        }
    }

    async getWeather(message, args) {
        if (!args.length) {
            
            return { error: 'No city provided' };
        }

        const city = args.join(' ');
        
        try {
            if (!config.WEATHER_API_KEY) {
                
                return { error: 'No API key' };
            }

            const weatherUrl = `${config.APIs.WEATHER_API}?q=${encodeURIComponent(city)}&appid=${config.WEATHER_API_KEY}&units=metric&lang=id`;
            const response = await axios.get(weatherUrl);
            const weather = response.data;

            const weatherText = `🌤️ *CUACA ${city.toUpperCase()}*

Kondisi: ${weather.weather[0].description}
Suhu: ${weather.main.temp}°C (terasa ${weather.main.feels_like}°C)
Kelembaban: ${weather.main.humidity}%
Tekanan: ${weather.main.pressure} hPa
Angin: ${weather.wind.speed} m/s
Visibilitas: ${weather.visibility/1000} km

Update: ${new Date().toLocaleString('id-ID')}`;

            await message.reply(weatherText);
            return { success: true };
        } catch (error) {
            if (error.response?.status === 404) {
                
            } else {
                
            }
            return { error: error.message };
        }
    }

    async getPrayerTimes(message, args) {
        if (!args.length) {
            
            return { error: 'No city provided' };
        }

        const city = args.join(' ');
        
        try {
            // Using Aladhan API for prayer times
            const prayerUrl = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=Indonesia&method=2`;
            const response = await axios.get(prayerUrl);
            const timings = response.data.data.timings;
            const date = response.data.data.date;

            const prayerText = `🕌 *JADWAL SHALAT ${city.toUpperCase()}*

📅 ${date.readable}
🗓️ ${date.hijri.date} ${date.hijri.month.en} ${date.hijri.year} H

🌅 Subuh: ${timings.Fajr}
🌄 Syuruq: ${timings.Sunrise}
☀️ Dzuhur: ${timings.Dhuhr}
🌤️ Ashar: ${timings.Asr}
🌅 Maghrib: ${timings.Maghrib}
🌙 Isya: ${timings.Isha}

Selamat beribadah! 🤲`;

            await message.reply(prayerText);
            return { success: true };
        } catch (error) {
            console.error('Prayer times error:', error);
            
            return { error: error.message };
        }
    }

    async getNameMeaning(message, args) {
        if (!args.length) {
            
            return { error: 'No name provided' };
        }

        const name = args.join(' ');
        
        // Simple name meanings database
        const nameMeanings = {
            'ahmad': 'Yang terpuji, yang patut dipuji',
            'fatimah': 'Wanita yang menyapih, putri Nabi Muhammad',
            'muhammad': 'Yang terpuji, yang dipuji',
            'ali': 'Yang tinggi, yang mulia',
            'siti': 'Wanita terhormat, nyonya',
            'budi': 'Akal, pikiran, kebijaksanaan',
            'sri': 'Cahaya, kemuliaan',
            'dewi': 'Dewi, putri',
            'adi': 'Yang pertama, yang utama',
            'putri': 'Anak perempuan raja'
        };

        const lowerName = name.toLowerCase();
        const meaning = nameMeanings[lowerName];

        if (meaning) {
            await message.reply(`📝 *ARTI NAMA*\n\nNama: ${name}\nArti: ${meaning}\n\nSemoga namanya membawa berkah! 🤲`);
        } else {
            return;
        }

        return { success: true };
    }

    async searchLyrics(message, args) {
        if (!args.length) {
            
            return { error: 'No song provided' };
        }

        const song = args.join(' ');
        
        try {
            // Since we don't have a lyrics API, we'll provide a search link
            const searchQuery = encodeURIComponent(`${song} lyrics`);
            const searchLink = `https://www.google.com/search?q=${searchQuery}`;
            
            const lyricsText = `🎵 *PENCARIAN LIRIK*

Lagu: ${song}

Link pencarian: ${searchLink}

Klik link di atas untuk mencari lirik lagu!`;

            await message.reply(lyricsText);
            return { success: true };
        } catch (error) {
            
            return { error: error.message };
        }
    }

    async checkIP(message, args) {
        if (!args.length) {
            
            return { error: 'No IP provided' };
        }

        const ip = args[0];
        
        try {
            const ipUrl = `http://ip-api.com/json/${ip}`;
            const response = await axios.get(ipUrl);
            const data = response.data;

            if (data.status === 'fail') {
                
                return { error: 'Invalid IP' };
            }

            const ipText = `🔍 *IP CHECKER*

IP: ${data.query}
ISP: ${data.isp}
Organisasi: ${data.org}
Negara: ${data.country} (${data.countryCode})
Region: ${data.regionName}
Kota: ${data.city}
Kode Pos: ${data.zip}
Timezone: ${data.timezone}
Koordinat: ${data.lat}, ${data.lon}`;

            await message.reply(ipText);
            return { success: true };
        } catch (error) {
            console.error('IP checker error:', error);
            
            return { error: error.message };
        }
    }

    async checkMLID(message, args) {
        if (!args.length) {
            
            return { error: 'No ID provided' };
        }

        const [id, zone] = args;
        
        if (!id || !zone) {
            
            return { error: 'Incomplete data' };
        }

        // Mock response since we don't have actual ML API
        const mlText = `🎮 *CEK ID MOBILE LEGENDS*

ID: ${id}
Zone: ${zone}
Status: ID Valid
Nickname: PlayerML${Math.floor(Math.random() * 1000)}

*Note: Ini adalah contoh response. Untuk cek ID yang akurat, gunakan aplikasi resmi Mobile Legends.*`;

        await message.reply(mlText);
        return { success: true };
    }

    async checkFFID(message, args) {
        if (!args.length) {
            
            return { error: 'No ID provided' };
        }

        const id = args[0];
        
        // Mock response since we don't have actual FF API
        const ffText = `🔫 *CEK ID FREE FIRE*

ID: ${id}
Status: ID Valid
Nickname: PlayerFF${Math.floor(Math.random() * 1000)}
Level: ${Math.floor(Math.random() * 70) + 1}

*Note: Ini adalah contoh response. Untuk cek ID yang akurat, gunakan aplikasi resmi Free Fire.*`;

        await message.reply(ffText);
        return { success: true };
    }

    async searchPinterest(message, args) {
        if (!args.length) {
            await message.reply('❌ *PINTEREST SEARCH*\n\nContoh: .pin eiser manhwa');
            return { error: 'No search query' };
        }

        const query = args.join(' ');
        
        try {
            await message.reply('🔍 Mencari gambar di Pinterest...');

            // Try primary Pinterest API
            try {
                const apiUrl = `https://api.agatz.xyz/api/pinterest?message=${encodeURIComponent(query)}`;
                const response = await axios.get(apiUrl, { timeout: 15000 });
                const data = response.data;
                
                if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
                    // Get random image from results for variety
                    const randomIndex = Math.floor(Math.random() * Math.min(data.data.length, 10));
                    const imageUrl = data.data[randomIndex];
                    
                    // Download and send the Pinterest image
                    const imageResponse = await axios.get(imageUrl, { 
                        responseType: 'arraybuffer',
                        timeout: 15000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    });
                    const imageBuffer = Buffer.from(imageResponse.data);
                    
                    if (imageBuffer.length <= 50 * 1024 * 1024) {
                        const mimeType = imageResponse.headers['content-type'] || 'image/jpeg';
                        const media = new MessageMedia(
                            mimeType,
                            imageBuffer.toString('base64'),
                            'pinterest.jpg'
                        );

                        await message.reply(media);
                        await message.reply(imageUrl);
                        
                        return { success: true };
                    }
                }
            } catch (primaryError) {
                console.log('Primary Pinterest API failed:', primaryError.message);
            }

            // Try secondary Pinterest API
            try {
                const apiUrl2 = `https://api.vreden.my.id/api/pinterest?query=${encodeURIComponent(query)}`;
                const response2 = await axios.get(apiUrl2, { timeout: 15000 });
                const data2 = response2.data;
                
                if (data2 && data2.result && Array.isArray(data2.result) && data2.result.length > 0) {
                    // Get random image from results for variety
                    const randomIndex = Math.floor(Math.random() * Math.min(data2.result.length, 10));
                    const imageUrl = data2.result[randomIndex];
                    
                    const imageResponse = await axios.get(imageUrl, { 
                        responseType: 'arraybuffer',
                        timeout: 15000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    });
                    const imageBuffer = Buffer.from(imageResponse.data);
                    
                    if (imageBuffer.length <= 50 * 1024 * 1024) {
                        const mimeType = imageResponse.headers['content-type'] || 'image/jpeg';
                        const media = new MessageMedia(
                            mimeType,
                            imageBuffer.toString('base64'),
                            'pinterest.jpg'
                        );

                        await message.reply(media);
                        await message.reply(imageUrl);
                        
                        return { success: true };
                    }
                }
            } catch (secondaryError) {
                console.log('Secondary Pinterest API failed:', secondaryError.message);
            }

            // If all Pinterest APIs fail, provide only manual search link
            const fallbackMessage = `📌 *PINTEREST SEARCH*

🔍 *Query:* ${query}

Maaf, pencarian otomatis tidak berhasil saat ini.

🔗 Cari manual di Pinterest:
https://pinterest.com/search/pins/?q=${encodeURIComponent(query)}`;

            await message.reply(fallbackMessage);
            return { error: 'Pinterest APIs unavailable' };

        } catch (error) {
            console.error('Pinterest search error:', error);
            
            const fallbackMessage = `📌 *PINTEREST SEARCH*

🔍 *Query:* ${query}

🔗 Link pencarian manual:
https://pinterest.com/search/pins/?q=${encodeURIComponent(query)}`;

            await message.reply(fallbackMessage);
            return { error: error.message };
        }
    }

    generateRandomHash() {
        const chars = '0123456789abcdef';
        let hash = '';
        for (let i = 0; i < 2; i++) {
            hash += chars[Math.floor(Math.random() * chars.length)];
        }
        return hash;
    }
}

module.exports = SearchHandler;
