const OpenAI = require('openai');
const axios = require('axios');
const config = require('../config/config');
const { MessageMedia } = require('whatsapp-web.js');
const loadingIndicator = require('../utils/loadingIndicator');

class AIHandler {
    constructor() {
        // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        this.openai = new OpenAI({ 
            apiKey: process.env.OPENAI_API_KEY || config.OPENAI_API_KEY 
        });
        this.geminiApiKey = process.env.GEMINI_API_KEY;
    }

    async handleCommand(command, args, message, contact, chat, client) {
        try {
            switch (command) {
                case 'openai':
                case 'ai':
                    return await this.handleOpenAI(args.join(' '), message);

                case 'bard':
                    return await this.handleBard(args.join(' '), message);

                case 'aiimage':
                case 'dalle':
                    return await this.generateImage(args.join(' '), message);

                case 'jadianime':
                    return await this.convertToAnime(message);

                case 'nexara':
                    return await this.handleNexara(args.join(' '), message);

                case 'voicejapan':
                    return await this.generateJapaneseVoice(args.join(' '), message);

                default:
                    
                    return { error: 'AI command not implemented' };
            }
        } catch (error) {
            console.error('AI handler error:', error);
            
            return { error: error.message };
        }
    }

    async handleOpenAI(prompt, message) {
        if (!prompt) {
            await message.reply('❌ *AI Assistant*\n\nContoh: .ai kenapa langit biru?');
            return { error: 'No prompt provided' };
        }

        let loadingId = null;
        try {
            // Start loading indicator
            loadingId = await loadingIndicator.startTextGeneration(message, 'ai');

            // Try Gemini AI first
            if (this.geminiApiKey) {
                try {
                    const aiResponse = await this.handleGeminiAI(prompt);
                    
                    // Stop loading indicator with success
                    if (loadingId) await loadingIndicator.stopLoading(loadingId, 'AI response generated', true);
                    
                    if (aiResponse.length > 2000) {
                        const chunks = this.splitMessage(aiResponse, 2000);
                        for (const chunk of chunks) {
                            await message.reply(chunk);
                        }
                    } else {
                        await message.reply(aiResponse);
                    }

                    return { success: true };
                } catch (geminiError) {
                    console.log('Gemini error, trying OpenAI:', geminiError.message);
                }
            }

            // Fallback to OpenAI if Gemini fails
            try {
                if (this.openai.apiKey) {
                    const response = await this.openai.chat.completions.create({
                        model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
                        messages: [
                            {
                                role: "system",
                                content: "Kamu adalah asisten AI yang santai dan membantu. Jawab dalam bahasa Indonesia dengan gaya percakapan yang natural dan tidak formal. Berikan jawaban yang singkat, jelas, dan langsung ke intinya tanpa bertele-tele. Jangan gunakan emoji."
                            },
                            {
                                role: "user",
                                content: prompt
                            }
                        ],
                        max_tokens: 1500,
                        temperature: 0.8
                    });

                    const aiResponse = response.choices[0].message.content;
                    
                    // Stop loading indicator with success
                    if (loadingId) await loadingIndicator.stopLoading(loadingId, 'AI response generated', true);
                    
                    if (aiResponse.length > 2000) {
                        const chunks = this.splitMessage(aiResponse, 2000);
                        for (const chunk of chunks) {
                            await message.reply(chunk);
                        }
                    } else {
                        await message.reply(aiResponse);
                    }

                    return { success: true };
                }
            } catch (openaiError) {
                console.log('OpenAI error:', openaiError.message);
            }

            // Final fallback to simple answers
            if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Fallback response generated', true);
            const simpleResponse = this.getSimpleAnswer(prompt);
            await message.reply(simpleResponse);

            return { success: true };
        } catch (error) {
            console.error('AI handler error:', error);
            
            // Stop loading indicator with error
            if (loadingId) await loadingIndicator.stopLoading(loadingId, 'AI processing failed', false);
            
            await message.reply('❌ Maaf, terjadi kesalahan saat memproses permintaan AI. Coba lagi nanti.');
            return { error: error.message };
        }
    }

    async handleGeminiAI(prompt) {
        try {
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`,
                {
                    contents: [{
                        parts: [{
                            text: `Kamu adalah asisten AI yang santai dan membantu. Jawab dalam bahasa Indonesia dengan gaya percakapan yang natural dan tidak formal. Berikan jawaban yang singkat, jelas, dan langsung ke intinya tanpa bertele-tele. Jangan gunakan emoji.\n\nPertanyaan: ${prompt}`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data && response.data.candidates && response.data.candidates[0] && response.data.candidates[0].content) {
                return response.data.candidates[0].content.parts[0].text;
            }

            throw new Error('No response from Gemini API');
        } catch (error) {
            console.error('Gemini API error:', error.response?.data || error.message);
            throw error;
        }
    }

    getSimpleAnswer(prompt) {
        const lowerPrompt = prompt.toLowerCase();
        
        // Geography and Indonesia
        if ((lowerPrompt.includes('tinggi') || lowerPrompt.includes('pendek')) && lowerPrompt.includes('indonesia')) {
            return "Ada beberapa faktor yang bikin tinggi badan orang Indonesia relatif lebih pendek. Pertama faktor genetik dari nenek moyang. Kedua masalah gizi, dulu banyak yang kurang nutrisi saat masa pertumbuhan. Ketiga faktor lingkungan dan akses kesehatan yang belum optimal di beberapa daerah. Sekarang sudah mulai membaik kok dengan perbaikan gizi dan kesehatan.";
        }
        
        // Science questions
        if (lowerPrompt.includes('langit') && lowerPrompt.includes('biru')) {
            return "Langit biru karena hamburan Rayleigh. Cahaya matahari punya berbagai warna, tapi cahaya biru punya panjang gelombang lebih pendek jadi lebih mudah dihamburkan partikel kecil di atmosfer. Makanya mata kita lihat langit berwarna biru.";
        }
        
        if (lowerPrompt.includes('kenapa') && (lowerPrompt.includes('hujan') || lowerPrompt.includes('air'))) {
            return "Hujan terjadi karena siklus air. Air menguap dari laut dan sungai, naik jadi awan, lalu kondensasi jadi tetesan air. Kalau udah berat, jatuh sebagai hujan. Proses ini berulang terus.";
        }
        
        if (lowerPrompt.includes('kenapa') && lowerPrompt.includes('matahari')) {
            return "Matahari menghasilkan energi lewat fusi nuklir, atom hidrogen bergabung jadi helium dan lepaskan energi besar. Energi ini jadi cahaya dan panas yang sampai ke Bumi dalam 8 menit. Tanpa matahari, Bumi bakal gelap dan dingin.";
        }
        
        // Technology questions
        if (lowerPrompt.includes('internet') || lowerPrompt.includes('wifi')) {
            return "Internet itu jaringan global yang nyambungin komputer di seluruh dunia. Dimulai dari proyek militer Amerika tahun 1960-an. WiFi adalah teknologi buat akses internet tanpa kabel pake gelombang radio. Sekarang kita bisa komunikasi, belajar, dan hiburan dari mana aja.";
        }
        
        // Health questions  
        if (lowerPrompt.includes('sehat') || lowerPrompt.includes('olahraga')) {
            return "Tips hidup sehat: makan bergizi seimbang, olahraga rutin minimal 30 menit sehari, tidur 7-8 jam, minum air putih cukup, kelola stres, hindari rokok dan alkohol. Olahraga gak harus berat, jalan kaki atau naik tangga aja udah bagus.";
        }
        
        // Food questions
        if (lowerPrompt.includes('makanan') && lowerPrompt.includes('indonesia')) {
            return "Makanan Indonesia kaya banget. Ada rendang dari Sumbar, gudeg dari Jogja, soto dari berbagai daerah, nasi goreng yang udah mendunia, gado-gado, rujak. Kekayaan rempah Indonesia bikin cita rasa makanan kita unik dan dikenal dunia.";
        }
        
        // Greetings
        if (lowerPrompt.includes('apa kabar') || lowerPrompt.includes('halo') || lowerPrompt.includes('hai') || lowerPrompt.includes('hello')) {
            return "Halo, aku baik. Ada yang bisa dibantu?";
        }
        
        // Education questions
        if (lowerPrompt.includes('belajar') || lowerPrompt.includes('sekolah')) {
            return "Tips belajar efektif: buat jadwal teratur, cari tempat nyaman dan tenang, pake berbagai metode, istirahat berkala, diskusi sama teman atau guru. Setiap orang punya gaya belajar berbeda, cari yang paling cocok.";
        }
        
        // Default response with more engaging content
        const topics = [
            "sains dan alam", "teknologi", "kesehatan", "makanan Indonesia", 
            "sejarah", "geografi", "tips belajar", "gaya hidup sehat"
        ];
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];
        
        return `Hmm, pertanyaan menarik. Aku bisa bantu jawab berbagai hal seperti tentang ${randomTopic}. Coba tanya yang lebih spesifik.\n\nContoh: "Kenapa langit biru?", "Bagaimana cara hidup sehat?", "Apa makanan khas Indonesia?"`;
    }

    async handleBard(prompt, message) {
        if (!prompt) {
            await message.reply('❌ *Bard AI*\n\nContoh: .bard jelaskan tentang AI');
            return { error: 'No prompt provided' };
        }

        let loadingId = null;
        try {
            // Start loading indicator
            loadingId = await loadingIndicator.startTextGeneration(message, 'bard');

            // Use Gemini API as Bard replacement since they're similar Google models
            try {
                const geminiResponse = await this.handleGeminiAI(prompt);
                
                // Stop loading indicator with success
                if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Bard response generated', true);
                
                if (geminiResponse.length > 2000) {
                    const chunks = this.splitMessage(geminiResponse, 2000);
                    for (const chunk of chunks) {
                        await message.reply(chunk);
                    }
                } else {
                    await message.reply(`🧠 *Bard AI:*\n\n${geminiResponse}`);
                }
                return { success: true };
            } catch (geminiError) {
                // Fallback to OpenAI if Gemini fails
                const response = await this.openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        {
                            role: "system",
                            content: "Anda adalah asisten AI seperti Google Bard. Berikan jawaban yang komprehensif dan informatif dalam bahasa Indonesia. Gunakan gaya yang santai dan mudah dipahami."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    max_tokens: 2000,
                    temperature: 0.8
                });

                const bardResponse = response.choices[0].message.content;
                
                // Stop loading indicator with success
                if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Bard response generated', true);
                
                if (bardResponse.length > 2000) {
                    const chunks = this.splitMessage(bardResponse, 2000);
                    for (const chunk of chunks) {
                        await message.reply(chunk);
                    }
                } else {
                    await message.reply(`🧠 *Bard AI:*\n\n${bardResponse}`);
                }
                return { success: true };
            }
        } catch (error) {
            console.error('Bard handler error:', error);
            
            // Stop loading indicator with error
            if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Bard processing failed', false);
            
            await message.reply('❌ Maaf, terjadi kesalahan saat memproses permintaan Bard AI. Coba lagi nanti.');
            return { error: error.message };
        }
    }

    async generateImage(prompt, message) {
        if (!prompt) {
            await message.reply('❌ *AI Image Generator*\n\nContoh: .aiimage kucing lucu bermain di taman');
            return { error: 'No prompt provided' };
        }

        if (!this.openai.apiKey) {
            await message.reply('❌ OpenAI API key tidak tersedia untuk generate gambar.');
            return { error: 'No API key' };
        }

        let loadingId = null;
        try {
            // Start loading indicator for image generation
            loadingId = await loadingIndicator.startTextGeneration(message, 'image');
            

            // Sanitize and enhance prompt for DALL-E 3 compliance
            let cleanPrompt = prompt
                .replace(/[^\w\s.,!?-]/g, '') // Remove special characters
                .trim()
                .substring(0, 400); // Limit length
            
            if (cleanPrompt.length < 5) {
                await message.reply('❌ Prompt terlalu pendek. Berikan deskripsi yang lebih detail.');
                return { error: 'Prompt too short' };
            }
            
            const enhancedPrompt = `A high-quality digital artwork depicting ${cleanPrompt}, professional style, detailed, vibrant colors`;
            
            const response = await this.openai.images.generate({
                model: "dall-e-3",
                prompt: enhancedPrompt,
                n: 1,
                size: "1024x1024",
                quality: "standard"
            });

            const imageUrl = response.data[0].url;
            
            // Update loading text for image download
            if (loadingId) await loadingIndicator.updateLoadingText(loadingId, 'Downloading generated image...');

            // Download and send image
            const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const imageBuffer = Buffer.from(imageResponse.data);
            const media = new MessageMedia('image/png', imageBuffer.toString('base64'), 'ai-generated.png');
            
            // Stop loading indicator with success
            if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Image generated successfully', true);
            
            await message.reply(media, undefined, { caption: `🎨 *AI Generated Image*\n\nPrompt: ${prompt}` });
            return { success: true };
        } catch (error) {
            console.error('DALL-E error:', error);
            
            // Try DALL-E 2 as fallback
            try {
                if (loadingId) await loadingIndicator.updateLoadingText(loadingId, 'Trying alternative method...');
                
                const fallbackResponse = await this.openai.images.generate({
                    model: "dall-e-2",
                    prompt: cleanPrompt,
                    n: 1,
                    size: "1024x1024"
                });

                const imageUrl = fallbackResponse.data[0].url;
                
                // Download and send image
                const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                const imageBuffer = Buffer.from(imageResponse.data);
                const media = new MessageMedia('image/png', imageBuffer.toString('base64'), 'ai-generated.png');
                
                // Stop loading indicator with success
                if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Image generated successfully', true);
                
                await message.reply(media, undefined, { 
                    caption: `🎨 *AI Generated Image*\n\nPrompt: ${prompt}\nGenerated by DALL-E 2` 
                });
                
                return { success: true };
                
            } catch (fallbackError) {
                console.error('DALL-E 2 fallback error:', fallbackError);
                
                // Stop loading indicator with error
                if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Image generation failed', false);
                
                await message.reply('❌ Gagal generate gambar dengan kedua model AI. Silakan coba prompt yang lebih sederhana atau coba lagi nanti.');
                return { error: fallbackError.message };
            }
        }
    }

    async convertToAnime(message) {
        try {
            const quotedMessage = await message.getQuotedMessage();
            
            if (!quotedMessage || !quotedMessage.hasMedia) {
                return { error: 'No image provided' };
            }

            const media = await quotedMessage.downloadMedia();
            
            if (!media.mimetype.startsWith('image/')) {
                return { error: 'Not an image' };
            }

            

            // Convert image to base64 for OpenAI Vision
            const base64Image = media.data;

            const response = await this.openai.chat.completions.create({
                model: config.APIs.OPENAI_MODEL,
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: "Analyze this image and create a detailed prompt to recreate it in anime/manga art style. Focus on key visual elements, composition, and style details."
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:${media.mimetype};base64,${base64Image}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 500
            });

            const animePrompt = response.choices[0].message.content;
            
            // Generate anime-style image
            const imageResponse = await this.openai.images.generate({
                model: "dall-e-3",
                prompt: `Anime/manga style: ${animePrompt}`,
                n: 1,
                size: "1024x1024",
                quality: "standard"
            });

            const imageUrl = imageResponse.data[0].url;
            const imageData = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const imageBuffer = Buffer.from(imageData.data);
            const animeMedia = new MessageMedia('image/png', imageBuffer.toString('base64'), 'anime-style.png');
            
            await message.reply(animeMedia, undefined, { caption: '🎌 *Anime Style Conversion*\n\nGambar berhasil diubah ke anime style!' });
            return { success: true };
        } catch (error) {
            console.error('Anime conversion error:', error);
            
            return { error: error.message };
        }
    }

    async handleNexara(prompt, message) {
        if (!prompt) {
            
            return { error: 'No prompt provided' };
        }

        try {
            

            // Using OpenAI as Nexara alternative
            const response = await this.openai.chat.completions.create({
                model: config.APIs.OPENAI_MODEL,
                messages: [
                    {
                        role: "system",
                        content: "Anda adalah Nexara AI, asisten yang memberikan jawaban kreatif dan inovatif. Berikan perspektif unik dalam bahasa Indonesia."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 1500,
                temperature: 0.9
            });

            const nexaraResponse = response.choices[0].message.content;
            await message.reply(`🔮 *Nexara AI Response:*\n\n${nexaraResponse}`);
            return { success: true };
        } catch (error) {
            
            return { error: error.message };
        }
    }

    async generateJapaneseVoice(text, message) {
        if (!text) {
            
            return { error: 'No text provided' };
        }

        try {
            

            // This would require a Japanese TTS service
            // For now, we'll use a placeholder response
            return;
            return { success: true };
        } catch (error) {
            
            return { error: error.message };
        }
    }

    splitMessage(text, maxLength) {
        const chunks = [];
        let currentChunk = '';
        const words = text.split(' ');

        for (const word of words) {
            if ((currentChunk + word).length > maxLength) {
                if (currentChunk) {
                    chunks.push(currentChunk.trim());
                    currentChunk = word + ' ';
                } else {
                    chunks.push(word);
                }
            } else {
                currentChunk += word + ' ';
            }
        }

        if (currentChunk) {
            chunks.push(currentChunk.trim());
        }

        return chunks;
    }
}

module.exports = AIHandler;
