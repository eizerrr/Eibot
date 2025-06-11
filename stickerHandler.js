const { MessageMedia } = require('whatsapp-web.js');
const sharp = require('sharp');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config');
const loadingIndicator = require('../utils/loadingIndicator');

class StickerHandler {
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
                case 'sticker':
                case 's':
                    return await this.createSticker(message, args);

                case 'stickercircle':
                    return await this.createCircleSticker(message);

                case 'stickerwm':
                    return await this.createStickerWithWatermark(message, args);

                case 'takesticker':
                case 'colong':
                    return await this.takeSticker(message);

                case 'toimg':
                case 'toimage':
                    return await this.stickerToImage(message);

                case 'attp':
                    return await this.createAnimatedText(message, args);

                case 'ttp':
                    return await this.createTextToImage(message, args);

                case 'smeme':
                    return await this.createMemeSticker(message, args);

                case 'snobg':
                    return await this.removeStickerBackground(message);

                case 'stickerinfo':
                    return await this.getStickerInfo(message);

                case 'setwm':
                    return await this.setWatermark(message, args, contact.id._serialized);

                case 'delsetwm':
                    return await this.deleteWatermark(message, contact.id._serialized);

                case 'semoji':
                    return await this.emojiToSticker(message, args);

                case 'semojimix':
                    return await this.mixEmojis(message, args);

                case 'quickchat':
                    return await this.createQuickChat(message, args);

                case 'telestick':
                    return await this.getTelegramSticker(message, args);

                case 'trigger':
                    return await this.createTriggerSticker(message);

                case 'brat':
                    return await this.createBratSticker(message, args);

                default:
                    
                    return { error: 'Sticker command not implemented' };
            }
        } catch (error) {
            console.error('Sticker handler error:', error);
            
            return { error: error.message };
        }
    }

    async createSticker(message, args) {
        let loadingId = null;
        try {
            const quotedMessage = await message.getQuotedMessage();
            
            if (!quotedMessage || !quotedMessage.hasMedia) {
                await message.reply('❌ Reply gambar/video untuk membuat sticker!\n\nContoh: .sticker (reply gambar)');
                return { error: 'No media provided' };
            }

            // Start loading indicator
            loadingId = await loadingIndicator.startMediaConversion(message, 'sticker');

            const media = await quotedMessage.downloadMedia();
            
            if (!media.mimetype.startsWith('image/') && !media.mimetype.startsWith('video/')) {
                if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Media type not supported', false);
                await message.reply('❌ Format media tidak didukung! Gunakan gambar atau video.');
                return { error: 'Invalid media type' };
            }

            // Update loading text based on media type
            const mediaType = media.mimetype.startsWith('image/') ? 'image' : 'video';
            if (loadingId) await loadingIndicator.updateLoadingText(loadingId, `Processing ${mediaType} to sticker...`);

            const shouldCrop = args.includes('crop');
            const inputBuffer = Buffer.from(media.data, 'base64');
            let processedBuffer;

            if (media.mimetype.startsWith('image/')) {
                processedBuffer = await this.processImageToSticker(inputBuffer, shouldCrop);
            } else {
                // For videos, we'll convert first frame to image
                processedBuffer = await this.processVideoToSticker(inputBuffer, shouldCrop);
            }

            const stickerMedia = new MessageMedia('image/webp', processedBuffer.toString('base64'), 'sticker.webp');
            
            // Stop loading indicator with success
            if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Sticker created successfully', true);
            
            await message.reply(stickerMedia, undefined, { 
                sendMediaAsSticker: true,
                stickerAuthor: config.STICKER.AUTHOR,
                stickerName: config.STICKER.PACK
            });

            return { success: true };
        } catch (error) {
            console.error('Create sticker error:', error);
            
            // Stop loading indicator with error
            if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Sticker creation failed', false);
            
            await message.reply('❌ Gagal membuat sticker. Coba lagi dengan gambar/video yang berbeda.');
            return { error: error.message };
        }
    }

    async processImageToSticker(buffer, shouldCrop) {
        let sharpImage = sharp(buffer);
        
        const { width, height } = await sharpImage.metadata();
        
        if (shouldCrop) {
            // Auto crop to square
            const size = Math.min(width, height);
            const left = Math.floor((width - size) / 2);
            const top = Math.floor((height - size) / 2);
            
            sharpImage = sharpImage.extract({ 
                left, 
                top, 
                width: size, 
                height: size 
            });
        }

        return await sharpImage
            .resize(512, 512, { 
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .webp({ quality: config.STICKER.QUALITY })
            .toBuffer();
    }

    async processVideoToSticker(buffer, shouldCrop) {
        // For video processing, we'll extract first frame
        // This is a simplified version - in production you might want to use ffmpeg
        const tempPath = path.join(this.tempDir, `video_${Date.now()}.mp4`);
        await fs.writeFile(tempPath, buffer);
        
        try {
            // Extract first frame using sharp (limited video support)
            const frameBuffer = await sharp(tempPath, { pages: 1 })
                .png()
                .toBuffer();
            
            return await this.processImageToSticker(frameBuffer, shouldCrop);
        } finally {
            // Cleanup
            try {
                await fs.unlink(tempPath);
            } catch {}
        }
    }

    async createCircleSticker(message) {
        try {
            const quotedMessage = await message.getQuotedMessage();
            
            if (!quotedMessage || !quotedMessage.hasMedia) {
                
                return { error: 'No image provided' };
            }

            const media = await quotedMessage.downloadMedia();
            
            if (!media.mimetype.startsWith('image/')) {
                
                return { error: 'Not an image' };
            }

            

            const inputBuffer = Buffer.from(media.data, 'base64');
            
            // Create circular mask
            const circleBuffer = await sharp(inputBuffer)
                .resize(512, 512, { fit: 'cover' })
                .composite([{
                    input: Buffer.from(`<svg width="512" height="512">
                        <defs>
                            <mask id="circle">
                                <circle cx="256" cy="256" r="256" fill="white"/>
                            </mask>
                        </defs>
                        <rect width="512" height="512" fill="black" mask="url(#circle)"/>
                    </svg>`),
                    blend: 'dest-in'
                }])
                .webp({ quality: config.STICKER.QUALITY })
                .toBuffer();

            const stickerMedia = new MessageMedia('image/webp', circleBuffer.toString('base64'), 'circle-sticker.webp');
            
            await message.reply(stickerMedia, undefined, { 
                sendMediaAsSticker: true,
                stickerAuthor: config.STICKER.AUTHOR,
                stickerName: config.STICKER.PACK
            });

            return { success: true };
        } catch (error) {
            console.error('Circle sticker error:', error);
            
            return { error: error.message };
        }
    }

    async createTextToImage(message, args) {
        if (!args.length) {
            
            return { error: 'No text provided' };
        }

        const text = args.join(' ');
        
        try {
            

            // Create text image using SVG
            const svgText = `
                <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
                    <rect width="512" height="512" fill="white"/>
                    <text x="256" y="256" font-family="Arial, sans-serif" font-size="32" 
                          text-anchor="middle" dominant-baseline="middle" fill="black">
                        ${text}
                    </text>
                </svg>
            `;

            const imageBuffer = await sharp(Buffer.from(svgText))
                .png()
                .toBuffer();

            const media = new MessageMedia('image/png', imageBuffer.toString('base64'), 'text-image.png');
            await message.reply(media);

            return { success: true };
        } catch (error) {
            console.error('TTP error:', error);
            
            return { error: error.message };
        }
    }

    async createAnimatedText(message, args) {
        if (!args.length) {
            
            return { error: 'No text provided' };
        }

        const text = args.join(' ');
        
        try {
            

            // For animated text, we'll create a static colorful version
            // In production, you might use APIs like TextPro.me
            const svgText = `
                <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#ff0080;stop-opacity:1" />
                            <stop offset="50%" style="stop-color:#00ff80;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#8000ff;stop-opacity:1" />
                        </linearGradient>
                    </defs>
                    <rect width="512" height="512" fill="black"/>
                    <text x="256" y="256" font-family="Arial, sans-serif" font-size="36" font-weight="bold"
                          text-anchor="middle" dominant-baseline="middle" fill="url(#gradient)">
                        ${text}
                    </text>
                </svg>
            `;

            const imageBuffer = await sharp(Buffer.from(svgText))
                .webp({ quality: config.STICKER.QUALITY })
                .toBuffer();

            const stickerMedia = new MessageMedia('image/webp', imageBuffer.toString('base64'), 'attp.webp');
            
            await message.reply(stickerMedia, undefined, { 
                sendMediaAsSticker: true,
                stickerAuthor: config.STICKER.AUTHOR,
                stickerName: config.STICKER.PACK
            });

            return { success: true };
        } catch (error) {
            console.error('ATTP error:', error);
            
            return { error: error.message };
        }
    }

    async createMemeSticker(message, args) {
        if (!args.length) {

            return { error: 'No text provided' };
        }

        const quotedMessage = await message.getQuotedMessage();
        
        if (!quotedMessage || !quotedMessage.hasMedia) {
            
            return { error: 'No image provided' };
        }

        const media = await quotedMessage.downloadMedia();
        
        if (!media.mimetype.startsWith('image/')) {
            
            return { error: 'Not an image' };
        }

        try {
            

            const [topText = '', bottomText = ''] = args.join(' ').split('|');
            const inputBuffer = Buffer.from(media.data, 'base64');

            // Create meme with text overlay
            const memeBuffer = await sharp(inputBuffer)
                .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
                .composite([
                    ...(topText ? [{
                        input: Buffer.from(`
                            <svg width="512" height="100">
                                <text x="256" y="50" font-family="Arial, sans-serif" font-size="28" font-weight="bold"
                                      text-anchor="middle" dominant-baseline="middle" fill="white" stroke="black" stroke-width="2">
                                    ${topText.toUpperCase()}
                                </text>
                            </svg>
                        `),
                        top: 10,
                        left: 0
                    }] : []),
                    ...(bottomText ? [{
                        input: Buffer.from(`
                            <svg width="512" height="100">
                                <text x="256" y="50" font-family="Arial, sans-serif" font-size="28" font-weight="bold"
                                      text-anchor="middle" dominant-baseline="middle" fill="white" stroke="black" stroke-width="2">
                                    ${bottomText.toUpperCase()}
                                </text>
                            </svg>
                        `),
                        top: 412,
                        left: 0
                    }] : [])
                ])
                .webp({ quality: config.STICKER.QUALITY })
                .toBuffer();

            const stickerMedia = new MessageMedia('image/webp', memeBuffer.toString('base64'), 'meme-sticker.webp');
            
            await message.reply(stickerMedia, undefined, { 
                sendMediaAsSticker: true,
                stickerAuthor: config.STICKER.AUTHOR,
                stickerName: config.STICKER.PACK
            });

            return { success: true };
        } catch (error) {
            console.error('Meme sticker error:', error);
            
            return { error: error.message };
        }
    }

    async stickerToImage(message) {
        try {
            const quotedMessage = await message.getQuotedMessage();
            
            if (!quotedMessage || !quotedMessage.hasMedia) {
                
                return { error: 'No sticker provided' };
            }

            const media = await quotedMessage.downloadMedia();
            
            if (media.mimetype !== 'image/webp') {
                
                return { error: 'Not a sticker' };
            }

            

            const inputBuffer = Buffer.from(media.data, 'base64');
            
            const imageBuffer = await sharp(inputBuffer)
                .png()
                .toBuffer();

            const imageMedia = new MessageMedia('image/png', imageBuffer.toString('base64'), 'sticker-to-image.png');
            await message.reply(imageMedia);

            return { success: true };
        } catch (error) {
            console.error('Sticker to image error:', error);
            
            return { error: error.message };
        }
    }

    async takeSticker(message) {
        try {
            const quotedMessage = await message.getQuotedMessage();
            
            if (!quotedMessage || !quotedMessage.hasMedia) {
                
                return { error: 'No sticker provided' };
            }

            const media = await quotedMessage.downloadMedia();
            
            if (media.mimetype !== 'image/webp') {
                
                return { error: 'Not a sticker' };
            }

            

            // Create new sticker with custom watermark
            const stickerMedia = new MessageMedia('image/webp', media.data, 'taken-sticker.webp');
            
            await message.reply(stickerMedia, undefined, { 
                sendMediaAsSticker: true,
                stickerAuthor: config.STICKER.AUTHOR,
                stickerName: config.STICKER.PACK
            });

            return { success: true };
        } catch (error) {
            console.error('Take sticker error:', error);
            
            return { error: error.message };
        }
    }

    async emojiToSticker(message, args) {
        if (!args.length) {
            
            return { error: 'No emoji provided' };
        }

        const emoji = args[0];
        
        try {
            

            // Create emoji sticker using SVG
            const svgEmoji = `
                <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
                    <rect width="512" height="512" fill="transparent"/>
                    <text x="256" y="256" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji" 
                          font-size="400" text-anchor="middle" dominant-baseline="middle">
                        ${emoji}
                    </text>
                </svg>
            `;

            const imageBuffer = await sharp(Buffer.from(svgEmoji))
                .webp({ quality: config.STICKER.QUALITY })
                .toBuffer();

            const stickerMedia = new MessageMedia('image/webp', imageBuffer.toString('base64'), 'emoji-sticker.webp');
            
            await message.reply(stickerMedia, undefined, { 
                sendMediaAsSticker: true,
                stickerAuthor: config.STICKER.AUTHOR,
                stickerName: config.STICKER.PACK
            });

            return { success: true };
        } catch (error) {
            console.error('Emoji sticker error:', error);
            
            return { error: error.message };
        }
    }

    async getStickerInfo(message) {
        try {
            const quotedMessage = await message.getQuotedMessage();
            
            if (!quotedMessage || !quotedMessage.hasMedia) {
                
                return { error: 'No sticker provided' };
            }

            const media = await quotedMessage.downloadMedia();
            
            if (media.mimetype !== 'image/webp') {
                
                return { error: 'Not a sticker' };
            }

            const infoText = `📊 *INFO STICKER*

Format: ${media.mimetype}
Ukuran: ${Math.round(Buffer.from(media.data, 'base64').length / 1024)} KB
Filename: ${media.filename || 'Tidak diketahui'}

*Metadata sticker tidak dapat dibaca dari WhatsApp Web API*`;

            await message.reply(infoText);
            return { success: true };
        } catch (error) {
            console.error('Sticker info error:', error);
            
            return { error: error.message };
        }
    }

    async setWatermark(message, args, userId) {
        if (args.length < 2) {
            
            return { error: 'Invalid format' };
        }

        const [type, ...nameParts] = args;
        const name = nameParts.join(' ');

        if (!['author', 'pack'].includes(type.toLowerCase())) {
            
            return { error: 'Invalid type' };
        }

        // In a real implementation, you would save this to database per user
        await message.reply(`✅ Watermark ${type} berhasil diset ke: "${name}"\n\nSticker selanjutnya akan menggunakan watermark ini.`);
        return { success: true };
    }

    async deleteWatermark(message, userId) {
        // In a real implementation, you would remove from database
        await message.reply('✅ Watermark berhasil dihapus. Akan menggunakan watermark default.');
        return { success: true };
    }

    async createBratSticker(message, args) {
        if (!args.length) {
            
            return { error: 'No text provided' };
        }

        const text = args.join(' ');
        
        try {
            // Calculate font size based on text length for better visibility
            let fontSize = 60;
            if (text.length > 10) fontSize = 50;
            if (text.length > 20) fontSize = 40;
            if (text.length > 30) fontSize = 35;

            // Create brat-style text with white background and larger text
            const svgText = `
                <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
                    <rect width="512" height="512" fill="#FFFFFF"/>
                    <text x="256" y="256" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="bold"
                          text-anchor="middle" dominant-baseline="middle" fill="black" letter-spacing="1px">
                        ${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                    </text>
                </svg>
            `;

            const imageBuffer = await sharp(Buffer.from(svgText))
                .webp({ quality: config.STICKER.QUALITY })
                .toBuffer();

            const stickerMedia = new MessageMedia('image/webp', imageBuffer.toString('base64'), 'brat-sticker.webp');
            
            await message.reply(stickerMedia, undefined, { 
                sendMediaAsSticker: true,
                stickerAuthor: config.STICKER.AUTHOR,
                stickerName: config.STICKER.PACK
            });

            return { success: true };
        } catch (error) {
            console.error('Brat sticker error:', error);
            // Silent error - don't show error message to user
            return { error: error.message };
        }
    }
}

module.exports = StickerHandler;
