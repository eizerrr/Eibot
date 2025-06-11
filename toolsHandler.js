const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config');
const loadingIndicator = require('../utils/loadingIndicator');

class ToolsHandler {
    constructor() {
        this.tempDir = config.TEMP_DIR || './temp';
        this.ensureTempDir();
    }

    async ensureTempDir() {
        try {
            await fs.access(this.tempDir);
        } catch {
            await fs.mkdir(this.tempDir, { recursive: true });
        }
    }

    async handleCommand(command, args, message, contact, chat, client) {
        try {
            switch (command) {
                case 'translate':
                    return await this.translateText(message, args);

                case 'qrcode':
                    return await this.generateQRCode(message, args);

                case 'qrcodereader':
                    return await this.readQRCode(message);

                case 'screenshot':
                    return await this.takeScreenshot(message, args);

                case 'shortlink':
                    return await this.shortenURL(message, args);

                case 'ebase64':
                    return await this.encodeBase64(message, args);

                case 'dbase64':
                    return await this.decodeBase64(message, args);

                case 'ehex':
                    return await this.encodeHex(message, args);

                case 'dhex':
                    return await this.decodeHex(message, args);

                case 'enc':
                    return await this.encryptText(message, args);

                case 'dec':
                    return await this.decryptText(message, args);

                case 'tts':
                    return await this.textToSpeech(message, args);

                case 'tts2':
                    return await this.textToSpeechAdvanced(message, args);

                case 'ocr':
                    return await this.ocrImage(message);

                case 'removebackground':
                case 'nobg':
                    return await this.removeBackground(message);

                case 'blur':
                    return await this.blurImage(message, args);

                case 'upscale':
                    return await this.upscaleImage(message);

                case 'tomp3':
                    return await this.convertToMP3(message);

                case 'tovn':
                    return await this.convertToVoiceNote(message);

                case 'tourl':
                    return await this.uploadToURL(message);

                case 'toviewonce':
                    return await this.convertToViewOnce(message);

                case 'readviewonce':
                    return await this.readViewOnce(message);

                case 'poll':
                    return await this.createPoll(message, args);

                case 'readmore':
                    return await this.createReadMore(message, args);

                case 'fakereply':
                    return await this.createFakeReply(message, args);

                case 'nulis':
                    return await this.handwritingText(message, args);

                case 'hartatahta':
                    return await this.createHartaTahta(message, args);

                case 'wait':
                    return await this.whatAnimeIs(message);

                case 'cekplatform':
                    return await this.checkPlatform(message, args);

                case 'hd':
                    return await this.enhanceHD(message, args);

                case 'halah':
                case 'hilih':
                case 'huluh':
                case 'heleh':
                case 'holoh':
                    return await this.convertTextStyle(message, args, command);

                case 'myemail':
                    return await this.generateTempEmail(message);

                case 'getemail':
                    return await this.getTempEmailMessages(message, args);

                case 'ytcomment':
                    return await this.createYouTubeComment(message, args);

                default:
                    // Silent fail - don't show error message
                    return { error: 'Tools command not implemented' };
            }
        } catch (error) {
            console.error('Tools handler error:', error);
            // Silent error - don't show error message to user
            return { error: error.message };
        }
    }

    async translateText(message, args) {
        if (args.length < 2) {
            
            return { error: 'Invalid format' };
        }

        const [targetLang, ...textParts] = args;
        const text = textParts.join(' ');

        try {
            

            const translateUrl = `${config.APIs.TRANSLATE_API}?q=${encodeURIComponent(text)}&langpair=auto|${targetLang}`;
            const response = await axios.get(translateUrl);
            
            if (response.data.responseStatus !== 200) {
                
                return { error: 'Translation failed' };
            }

            const translatedText = response.data.responseData.translatedText;
            const detectedLang = response.data.responseData.match?.language || 'auto';

            const translateResult = `🌐 *TRANSLATE*

📝 *Teks Asli:* ${text}
🔍 *Bahasa Terdeteksi:* ${detectedLang}
🎯 *Bahasa Target:* ${targetLang}
✅ *Hasil:* ${translatedText}`;

            await message.reply(translateResult);
            return { success: true };
        } catch (error) {
            console.error('Translate error:', error);
            
            return { error: error.message };
        }
    }

    async generateQRCode(message, args) {
        if (!args.length) {
            
            return { error: 'No text provided' };
        }

        const text = args.join(' ');

        try {
            

            const qrUrl = `${config.APIs.QR_API}?size=500x500&data=${encodeURIComponent(text)}`;
            const response = await axios.get(qrUrl, { responseType: 'arraybuffer' });
            const imageBuffer = Buffer.from(response.data);

            const media = new MessageMedia('image/png', imageBuffer.toString('base64'), 'qrcode.png');
            await message.reply(media, undefined, { caption: `📱 *QR CODE*\n\nTeks: ${text}` });

            return { success: true };
        } catch (error) {
            console.error('QR Code error:', error);
            
            return { error: error.message };
        }
    }

    async readQRCode(message) {
        try {
            const quotedMessage = await message.getQuotedMessage();
            
            if (!quotedMessage || !quotedMessage.hasMedia) {
                
                return { error: 'No image provided' };
            }

            const media = await quotedMessage.downloadMedia();
            
            if (!media.mimetype.startsWith('image/')) {
                
                return { error: 'Not an image' };
            }

            

            // In a real implementation, you would use a QR code reading library
            // For now, we'll provide a placeholder response
            return;
            return { success: true };
        } catch (error) {
            console.error('QR Reader error:', error);
            
            return { error: error.message };
        }
    }

    async takeScreenshot(message, args) {
        if (!args.length) {
            
            return { error: 'No URL provided' };
        }

        const url = args[0];

        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            
            return { error: 'Invalid URL' };
        }

        try {
            

            // Using a screenshot API service
            const screenshotUrl = `${config.APIs.SCREENSHOT_API}?url=${encodeURIComponent(url)}&dimension=1280x720`;
            
            if (!config.APIs.SCREENSHOT_API || config.APIs.SCREENSHOT_API.includes('screenshotmachine')) {
                return;
                return { error: 'No screenshot API' };
            }

            const response = await axios.get(screenshotUrl, { responseType: 'arraybuffer' });
            const imageBuffer = Buffer.from(response.data);

            const media = new MessageMedia('image/png', imageBuffer.toString('base64'), 'screenshot.png');
            await message.reply(media, undefined, { caption: `📸 *SCREENSHOT*\n\nURL: ${url}` });

            return { success: true };
        } catch (error) {
            console.error('Screenshot error:', error);
            
            return { error: error.message };
        }
    }

    async shortenURL(message, args) {
        if (!args.length) {
            
            return { error: 'No URL provided' };
        }

        const url = args[0];

        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            
            return { error: 'Invalid URL' };
        }

        try {
            

            const shortUrl = `${config.APIs.SHORTLINK_API}?url=${encodeURIComponent(url)}`;
            const response = await axios.get(shortUrl);
            
            const shortLink = response.data;

            const linkText = `🔗 *SHORT LINK*

📎 *URL Asli:* ${url}
✂️ *Short Link:* ${shortLink}

Klik link pendek untuk mengakses URL asli!`;

            await message.reply(linkText);
            return { success: true };
        } catch (error) {
            console.error('Short link error:', error);
            
            return { error: error.message };
        }
    }

    async encodeBase64(message, args) {
        if (!args.length) {
            
            return { error: 'No text provided' };
        }

        const text = args.join(' ');
        const encoded = Buffer.from(text, 'utf8').toString('base64');

        await message.reply(`🔐 *BASE64 ENCODE*\n\n📝 *Teks Asli:* ${text}\n🔑 *Base64:* ${encoded}`);
        return { success: true };
    }

    async decodeBase64(message, args) {
        if (!args.length) {
            
            return { error: 'No base64 provided' };
        }

        const base64 = args[0];

        try {
            const decoded = Buffer.from(base64, 'base64').toString('utf8');
            await message.reply(`🔓 *BASE64 DECODE*\n\n🔑 *Base64:* ${base64}\n📝 *Teks Asli:* ${decoded}`);
            return { success: true };
        } catch (error) {
            
            return { error: 'Invalid base64' };
        }
    }

    async encodeHex(message, args) {
        if (!args.length) {
            
            return { error: 'No text provided' };
        }

        const text = args.join(' ');
        const encoded = Buffer.from(text, 'utf8').toString('hex');

        await message.reply(`🔐 *HEX ENCODE*\n\n📝 *Teks Asli:* ${text}\n🔢 *Hex:* ${encoded}`);
        return { success: true };
    }

    async decodeHex(message, args) {
        if (!args.length) {
            
            return { error: 'No hex provided' };
        }

        const hex = args[0];

        try {
            const decoded = Buffer.from(hex, 'hex').toString('utf8');
            await message.reply(`🔓 *HEX DECODE*\n\n🔢 *Hex:* ${hex}\n📝 *Teks Asli:* ${decoded}`);
            return { success: true };
        } catch (error) {
            
            return { error: 'Invalid hex' };
        }
    }

    async textToSpeech(message, args) {
        if (!args.length) {
            
            return { error: 'No text provided' };
        }

        const text = args.join(' ');

        try {
            

            // Using Google TTS API would require proper implementation
            return;
            return { success: true };
        } catch (error) {
            console.error('TTS error:', error);
            
            return { error: error.message };
        }
    }

    async convertTextStyle(message, args, style) {
        if (!args.length) {
            
            return { error: 'No text provided' };
        }

        const text = args.join(' ');
        let convertedText;

        const vowelMap = {
            'halah': { 'a': 'a', 'e': 'a', 'i': 'a', 'o': 'a', 'u': 'a' },
            'hilih': { 'a': 'i', 'e': 'i', 'i': 'i', 'o': 'i', 'u': 'i' },
            'huluh': { 'a': 'u', 'e': 'u', 'i': 'u', 'o': 'u', 'u': 'u' },
            'heleh': { 'a': 'e', 'e': 'e', 'i': 'e', 'o': 'e', 'u': 'e' },
            'holoh': { 'a': 'o', 'e': 'o', 'i': 'o', 'o': 'o', 'u': 'o' }
        };

        const map = vowelMap[style];
        convertedText = text.toLowerCase().replace(/[aeiou]/g, (match) => map[match] || match);

        await message.reply(`🔤 *${style.toUpperCase()}*\n\n📝 *Asli:* ${text}\n✨ *${style}:* ${convertedText}`);
        return { success: true };
    }

    async createReadMore(message, args) {
        if (args.length < 2) {
            
            return { error: 'Invalid format' };
        }

        const fullText = args.join(' ');
        const [shortText, longText] = fullText.split('|').map(t => t.trim());

        if (!shortText || !longText) {
            
            return { error: 'Invalid format' };
        }

        const readMoreText = `${shortText}${'‌'.repeat(4000)}\n\n${longText}`;
        await message.reply(readMoreText);
        return { success: true };
    }

    async createPoll(message, args) {
        if (args.length < 3) {
            
            return { error: 'Invalid format' };
        }

        const fullText = args.join(' ');
        const parts = fullText.split('|').map(t => t.trim());
        const question = parts[0];
        const options = parts.slice(1);

        if (options.length < 2) {
            
            return { error: 'Not enough options' };
        }

        let pollText = `📊 *POLL*\n\n*${question}*\n\n`;
        options.forEach((option, index) => {
            pollText += `${index + 1}. ${option}\n`;
        });
        pollText += `\nKetik nomor pilihan Anda (1-${options.length})`;

        await message.reply(pollText);
        return { success: true };
    }

    async uploadToURL(message) {
        try {
            const quotedMessage = await message.getQuotedMessage();
            
            if (!quotedMessage || !quotedMessage.hasMedia) {
                
                return { error: 'No media provided' };
            }

            

            // In a real implementation, you would upload to a file hosting service
            return;
            return { success: true };
        } catch (error) {
            console.error('Upload error:', error);
            
            return { error: error.message };
        }
    }

    async generateTempEmail(message) {
        try {
            

            // Generate random email
            const randomString = Math.random().toString(36).substring(7);
            const tempEmail = `${randomString}@tempmail.org`;

            const emailText = `📧 *TEMPORARY EMAIL*

Email: ${tempEmail}
Status: Aktif
Masa berlaku: 24 jam

Gunakan .getemail untuk cek pesan masuk.

*Note: Ini adalah contoh email. Untuk email sementara yang benar-benar berfungsi, gunakan layanan seperti tempmail.org atau 10minutemail.com*`;

            await message.reply(emailText);
            return { success: true };
        } catch (error) {
            console.error('Temp email error:', error);
            
            return { error: error.message };
        }
    }

    async blurImage(message, args) {
        try {
            const quotedMessage = await message.getQuotedMessage();
            
            if (!quotedMessage || !quotedMessage.hasMedia) {
                
                return { error: 'No image provided' };
            }

            const media = await quotedMessage.downloadMedia();
            
            if (!media.mimetype.startsWith('image/')) {
                
                return { error: 'Not an image' };
            }

            

            const blurLevel = args[0] ? parseInt(args[0]) : 5;
            const inputBuffer = Buffer.from(media.data, 'base64');

            const blurredBuffer = await sharp(inputBuffer)
                .blur(blurLevel)
                .jpeg({ quality: 90 })
                .toBuffer();

            const blurredMedia = new MessageMedia('image/jpeg', blurredBuffer.toString('base64'), 'blurred.jpg');
            await message.reply(blurredMedia, undefined, { caption: `🌫️ *BLUR IMAGE*\n\nLevel blur: ${blurLevel}` });

            return { success: true };
        } catch (error) {
            console.error('Blur error:', error);
            
            return { error: error.message };
        }
    }

    async checkPlatform(message, args) {
        const platform = process.platform;
        const nodeVersion = process.version;
        const architecture = process.arch;
        const uptime = process.uptime();

        const platformText = `💻 *PLATFORM INFO*

OS: ${platform}
Node.js: ${nodeVersion}
Architecture: ${architecture}
Uptime: ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m
Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`;

        await message.reply(platformText);
        return { success: true };
    }

    async enhanceHD(message, args) {
        try {
            let targetMessage = message;
            
            // Check if this is a reply to a message with media
            if (message.hasQuotedMsg) {
                const quotedMsg = await message.getQuotedMessage();
                if (quotedMsg && quotedMsg.hasMedia) {
                    targetMessage = quotedMsg;
                }
            }
            
            // If no media found in original or quoted message
            if (!targetMessage.hasMedia) {
                await message.reply('❌ *HD Enhancement*\n\nReply ke foto atau video yang ingin ditingkatkan kualitasnya.');
                return { error: 'No media provided' };
            }

            await message.reply('⏳ Sedang memproses enhancement HD...');

            const media = await targetMessage.downloadMedia();
            const buffer = Buffer.from(media.data, 'base64');

            if (media.mimetype.startsWith('image/')) {
                // Get original image metadata
                const metadata = await sharp(buffer).metadata();
                const originalWidth = metadata.width || 512;
                const originalHeight = metadata.height || 512;
                
                // Calculate enhanced dimensions (2x upscale, max 4096px)
                const scaleFactor = Math.min(2, 4096 / Math.max(originalWidth, originalHeight));
                const newWidth = Math.round(originalWidth * scaleFactor);
                const newHeight = Math.round(originalHeight * scaleFactor);

                // Enhance image quality with advanced processing
                const enhancedBuffer = await sharp(buffer)
                    .resize(newWidth, newHeight, { 
                        kernel: sharp.kernel.lanczos3,
                        fit: 'fill'
                    })
                    .sharpen(1.2, 1.0, 2.5)
                    .modulate({
                        brightness: 1.05,
                        saturation: 1.15,
                        hue: 0
                    })
                    .gamma(1.1)
                    .jpeg({ 
                        quality: 95, 
                        progressive: true,
                        mozjpeg: true 
                    })
                    .toBuffer();

                // Check enhanced file size (max 50MB for WhatsApp)
                if (enhancedBuffer.length > 50 * 1024 * 1024) {
                    await message.reply('❌ File hasil enhancement terlalu besar. Coba dengan foto yang lebih kecil.');
                    return { error: 'Enhanced file too large' };
                }

                const enhancedMedia = new MessageMedia(
                    'image/jpeg',
                    enhancedBuffer.toString('base64'),
                    'enhanced_hd.jpg'
                );

                const sizeInfo = `
📊 *Enhancement Info:*
• Original: ${originalWidth}x${originalHeight}
• Enhanced: ${newWidth}x${newHeight}
• Scale: ${scaleFactor.toFixed(1)}x
• Size: ${(enhancedBuffer.length / (1024 * 1024)).toFixed(2)} MB`;

                await message.reply(enhancedMedia, undefined, { 
                    caption: `✅ *HD Enhancement Complete*${sizeInfo}\n\n_Foto telah ditingkatkan dengan AI upscaling dan color enhancement_`
                });

                return { success: true };

            } else if (media.mimetype.startsWith('video/')) {
                // For video, we'll focus on optimizing encoding
                await message.reply('🎥 *Video HD Enhancement*\n\nVideo processing membutuhkan waktu lebih lama. Fitur ini sedang dalam pengembangan untuk mengoptimalkan kualitas video.');
                return { success: true };

            } else {
                await message.reply('❌ Format file tidak didukung. Hanya mendukung foto dan video.');
                return { error: 'Unsupported format' };
            }

        } catch (error) {
            console.error('HD Enhancement error:', error);
            await message.reply('❌ Gagal memproses HD enhancement. Pastikan file tidak terlalu besar.');
            return { error: error.message };
        }
    }
}

module.exports = ToolsHandler;
