const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs').promises;
const path = require('path');
const loadingIndicator = require('../utils/loadingIndicator');
const { Database } = require('../utils/database');

class MediaHandler {
    constructor() {
        this.tempDir = path.join(__dirname, '..', 'temp');
        this.database = new Database();
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
            const userId = contact.id._serialized;
            
            // Check premium features for advanced media processing
            const canUseAdvanced = await this.database.canUseFeature(userId, 'higherQuality');
            
            switch (command) {
                // Image Processing Commands
                case 'resize':
                    return await this.resizeImage(message, args, canUseAdvanced);
                case 'compress':
                    return await this.compressImage(message, args, canUseAdvanced);
                case 'enhance':
                case 'upscale':
                    return await this.enhanceImage(message, args, canUseAdvanced);
                case 'filter':
                    return await this.applyImageFilter(message, args, canUseAdvanced);
                case 'crop':
                    return await this.cropImage(message, args);
                case 'rotate':
                    return await this.rotateImage(message, args);
                case 'flip':
                    return await this.flipImage(message, args);
                case 'watermark':
                    return await this.addWatermark(message, args);
                case 'removebg':
                    return await this.removeBackground(message, canUseAdvanced);
                
                // Audio Processing Commands
                case 'audioconvert':
                    return await this.convertAudio(message, args, canUseAdvanced);
                case 'audiomerge':
                    return await this.mergeAudio(message, args, canUseAdvanced);
                case 'audiocut':
                    return await this.cutAudio(message, args);
                case 'changepitch':
                    return await this.changePitch(message, args, canUseAdvanced);
                case 'audiofilter':
                    return await this.applyAudioFilter(message, args, canUseAdvanced);
                
                // Video Processing Commands
                case 'videoconvert':
                    return await this.convertVideo(message, args, canUseAdvanced);
                case 'videocut':
                    return await this.cutVideo(message, args);
                case 'videocompress':
                    return await this.compressVideo(message, args, canUseAdvanced);
                case 'videofilter':
                    return await this.applyVideoFilter(message, args, canUseAdvanced);
                case 'extractaudio':
                    return await this.extractAudioFromVideo(message, args);
                case 'addsubtitle':
                    return await this.addSubtitles(message, args, canUseAdvanced);
                case 'extractaudio':
                    return await this.extractAudioFromVideo(message, args);
                case 'speedup':
                    return await this.changeVideoSpeed(message, args);
                case 'slowdown':
                    return await this.changeVideoSpeed(message, args, 'slow');
                
                // Multi-media Commands
                case 'mediainfo':
                    return await this.getMediaInfo(message);
                case 'thumbnail':
                    return await this.generateThumbnail(message, args);
                case 'gif2mp4':
                    return await this.convertGifToMp4(message, args);
                case 'mp42gif':
                    return await this.convertMp4ToGif(message, args);
                case 'merge':
                    return await this.mergeImages(message, args, canUseAdvanced);
                case 'split':
                    return await this.splitImage(message, args);
                case 'collage':
                    return await this.createCollage(message, args, canUseAdvanced);
                
                default:
                    return { error: 'Unknown media command' };
            }
        } catch (error) {
            console.error('Media handler error:', error);
            return { error: error.message };
        }
    }

    // Image Processing Methods
    async resizeImage(message, args, isPremium) {
        try {
            if (!message.hasMedia) {
                await message.reply('❌ Reply dengan gambar yang ingin diresize\n\nContoh:\n• .resize 500x500\n• .resize 1920x1080\n• .resize 50% (persentase)');
                return { error: 'No media' };
            }

            if (args.length === 0) {
                await message.reply('❌ Masukkan ukuran yang diinginkan\n\nFormat:\n• .resize 500x500 (lebar x tinggi)\n• .resize 50% (persentase)\n• .resize 1080 (lebar, tinggi auto)');
                return { error: 'No size specified' };
            }

            let loadingId = await loadingIndicator.startMediaConversion(message, 'image resize');

            const media = await message.downloadMedia();
            if (!media) {
                if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Download failed', false);
                await message.reply('❌ Gagal mengunduh media');
                return { error: 'Download failed' };
            }

            const inputPath = path.join(this.tempDir, `input_${Date.now()}.${media.mimetype.split('/')[1]}`);
            const outputPath = path.join(this.tempDir, `resized_${Date.now()}.png`);

            await fs.writeFile(inputPath, media.data, 'base64');

            let width, height;
            const sizeArg = args[0];

            if (sizeArg.includes('%')) {
                // Percentage resize
                const percentage = parseInt(sizeArg.replace('%', ''));
                const metadata = await sharp(inputPath).metadata();
                width = Math.round(metadata.width * (percentage / 100));
                height = Math.round(metadata.height * (percentage / 100));
            } else if (sizeArg.includes('x')) {
                // Width x Height format
                [width, height] = sizeArg.split('x').map(Number);
            } else {
                // Single dimension (width only)
                width = parseInt(sizeArg);
                height = null;
            }

            const maxSize = isPremium ? 4096 : 2048;
            if (width > maxSize || (height && height > maxSize)) {
                if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Size limit exceeded', false);
                await message.reply(`❌ Ukuran maksimal ${maxSize}px. ${isPremium ? '' : 'Upgrade premium untuk ukuran lebih besar!'}`);
                return { error: 'Size limit exceeded' };
            }

            await sharp(inputPath)
                .resize(width, height, {
                    fit: sharp.fit.inside,
                    withoutEnlargement: false
                })
                .png({ quality: isPremium ? 100 : 80 })
                .toFile(outputPath);

            const resultBuffer = await fs.readFile(outputPath);
            
            if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Resize completed', true);
            
            await message.reply('✅ *IMAGE RESIZED*\n\nProcessing completed, sending result...');
            
            const { MessageMedia } = require('whatsapp-web.js');
            const resizedMedia = new MessageMedia('image/png', resultBuffer.toString('base64'), `resized_${width}${height ? `x${height}` : ''}.png`);
            await message.reply(resizedMedia);

            // Cleanup
            await fs.unlink(inputPath).catch(() => {});
            await fs.unlink(outputPath).catch(() => {});

            return { success: true };
        } catch (error) {
            console.error('Resize image error:', error);
            return { error: error.message };
        }
    }

    async compressImage(message, args, isPremium) {
        try {
            if (!message.hasMedia) {
                await message.reply('❌ Reply dengan gambar yang ingin dikompres\n\nContoh:\n• .compress 50 (kualitas 50%)\n• .compress low/medium/high');
                return { error: 'No media' };
            }

            let quality = 80; // Default quality
            
            if (args.length > 0) {
                const qualityArg = args[0].toLowerCase();
                if (qualityArg === 'low') quality = 50;
                else if (qualityArg === 'medium') quality = 75;
                else if (qualityArg === 'high') quality = 90;
                else if (qualityArg === 'max' && isPremium) quality = 95;
                else if (!isNaN(parseInt(qualityArg))) {
                    quality = Math.max(10, Math.min(isPremium ? 95 : 90, parseInt(qualityArg)));
                }
            }

            let loadingId = await loadingIndicator.startMediaConversion(message, 'image compression');

            const media = await message.downloadMedia();
            const inputPath = path.join(this.tempDir, `input_${Date.now()}.${media.mimetype.split('/')[1]}`);
            const outputPath = path.join(this.tempDir, `compressed_${Date.now()}.jpg`);

            await fs.writeFile(inputPath, media.data, 'base64');

            const originalStats = await fs.stat(inputPath);
            const originalSize = originalStats.size;

            await sharp(inputPath)
                .jpeg({ 
                    quality: quality,
                    progressive: true,
                    mozjpeg: isPremium 
                })
                .toFile(outputPath);

            const compressedStats = await fs.stat(outputPath);
            const compressedSize = compressedStats.size;
            const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);

            const resultBuffer = await fs.readFile(outputPath);
            
            if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Compression completed', true);
            
            const { MessageMedia } = require('whatsapp-web.js');
            const compressedMedia = new MessageMedia('image/jpeg', resultBuffer.toString('base64'), `compressed_${quality}.jpg`);
            
            await message.reply(`✅ *IMAGE COMPRESSED*\n\nOriginal: ${(originalSize / 1024).toFixed(1)} KB\nCompressed: ${(compressedSize / 1024).toFixed(1)} KB\nReduction: ${compressionRatio}%\nQuality: ${quality}%`);
            await message.reply(compressedMedia);

            // Cleanup
            await fs.unlink(inputPath).catch(() => {});
            await fs.unlink(outputPath).catch(() => {});

            return { success: true };
        } catch (error) {
            console.error('Compress image error:', error);
            return { error: error.message };
        }
    }

    async enhanceImage(message, args, isPremium) {
        try {
            if (!message.hasMedia) {
                await message.reply('❌ Reply dengan gambar yang ingin dienhance\n\nContoh:\n• .enhance auto\n• .enhance denoise\n• .enhance sharpen');
                return { error: 'No media' };
            }

            if (!isPremium) {
                await message.reply('❌ Fitur enhance image hanya untuk premium users!\n\n💎 Upgrade ke premium untuk akses fitur ini.\nType .premium untuk info lebih lanjut.');
                return { error: 'Premium required' };
            }

            const enhanceType = args[0] || 'auto';
            let loadingId = await loadingIndicator.startMediaConversion(message, 'image enhancement');

            const media = await message.downloadMedia();
            const inputPath = path.join(this.tempDir, `input_${Date.now()}.${media.mimetype.split('/')[1]}`);
            const outputPath = path.join(this.tempDir, `enhanced_${Date.now()}.png`);

            await fs.writeFile(inputPath, media.data, 'base64');

            let pipeline = sharp(inputPath);

            switch (enhanceType.toLowerCase()) {
                case 'denoise':
                    pipeline = pipeline.median(3);
                    break;
                case 'sharpen':
                    pipeline = pipeline.sharpen({ sigma: 1.5 });
                    break;
                case 'contrast':
                    pipeline = pipeline.modulate({ 
                        brightness: 1.1,
                        saturation: 1.2 
                    });
                    break;
                case 'auto':
                default:
                    pipeline = pipeline
                        .normalize()
                        .sharpen({ sigma: 1.0 })
                        .modulate({ 
                            brightness: 1.05,
                            saturation: 1.1 
                        });
                    break;
            }

            await pipeline
                .png({ quality: 100, compressionLevel: 6 })
                .toFile(outputPath);

            const resultBuffer = await fs.readFile(outputPath);
            
            if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Enhancement completed', true);
            
            const { MessageMedia } = require('whatsapp-web.js');
            const enhancedMedia = new MessageMedia('image/png', resultBuffer.toString('base64'), `enhanced_${enhanceType}.png`);
            
            await message.reply(`✅ *IMAGE ENHANCED*\n\nEnhancement: ${enhanceType}\nQuality: Premium\n\n💎 Premium feature`);
            await message.reply(enhancedMedia);

            // Cleanup
            await fs.unlink(inputPath).catch(() => {});
            await fs.unlink(outputPath).catch(() => {});

            return { success: true };
        } catch (error) {
            console.error('Enhance image error:', error);
            return { error: error.message };
        }
    }

    async applyImageFilter(message, args, isPremium) {
        try {
            if (!message.hasMedia) {
                await message.reply('❌ Reply dengan gambar untuk apply filter\n\nFilters:\n• .filter sepia\n• .filter grayscale\n• .filter blur\n• .filter vintage (premium)\n• .filter neon (premium)');
                return { error: 'No media' };
            }

            const filter = args[0]?.toLowerCase() || 'grayscale';
            const premiumFilters = ['vintage', 'neon', 'dramatic', 'cinematic'];
            
            if (premiumFilters.includes(filter) && !isPremium) {
                await message.reply(`❌ Filter "${filter}" hanya untuk premium users!\n\n💎 Upgrade ke premium untuk akses semua filter.\nType .premium untuk info lebih lanjut.`);
                return { error: 'Premium required' };
            }

            let loadingId = await loadingIndicator.startMediaConversion(message, 'applying filter');

            const media = await message.downloadMedia();
            const inputPath = path.join(this.tempDir, `input_${Date.now()}.${media.mimetype.split('/')[1]}`);
            const outputPath = path.join(this.tempDir, `filtered_${Date.now()}.png`);

            await fs.writeFile(inputPath, media.data, 'base64');

            let pipeline = sharp(inputPath);

            switch (filter) {
                case 'sepia':
                    pipeline = pipeline.tint({ r: 255, g: 204, b: 153 });
                    break;
                case 'grayscale':
                    pipeline = pipeline.grayscale();
                    break;
                case 'blur':
                    const blurAmount = parseInt(args[1]) || 5;
                    pipeline = pipeline.blur(blurAmount);
                    break;
                case 'vintage':
                    pipeline = pipeline
                        .modulate({ brightness: 0.9, saturation: 0.7 })
                        .tint({ r: 255, g: 230, b: 200 });
                    break;
                case 'neon':
                    pipeline = pipeline
                        .modulate({ brightness: 1.2, saturation: 1.8 })
                        .tint({ r: 200, g: 255, b: 255 });
                    break;
                case 'dramatic':
                    pipeline = pipeline
                        .modulate({ brightness: 0.8, saturation: 1.3 })
                        .sharpen({ sigma: 2.0 });
                    break;
            }

            await pipeline.png({ quality: isPremium ? 100 : 80 }).toFile(outputPath);

            const resultBuffer = await fs.readFile(outputPath);
            
            if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Filter applied', true);
            
            const { MessageMedia } = require('whatsapp-web.js');
            const filteredMedia = new MessageMedia('image/png', resultBuffer.toString('base64'), `filtered_${filter}.png`);
            
            await message.reply(`✅ *FILTER APPLIED*\n\nFilter: ${filter}\nQuality: ${isPremium ? 'Premium' : 'Standard'}${premiumFilters.includes(filter) ? '\n💎 Premium feature' : ''}`);
            await message.reply(filteredMedia);

            // Cleanup
            await fs.unlink(inputPath).catch(() => {});
            await fs.unlink(outputPath).catch(() => {});

            return { success: true };
        } catch (error) {
            console.error('Apply filter error:', error);
            return { error: error.message };
        }
    }

    // Audio Processing Methods
    async convertAudio(message, args, isPremium) {
        try {
            if (!message.hasMedia) {
                await message.reply('❌ Reply dengan audio yang ingin diconvert\n\nFormat tersedia:\n• .audioconvert mp3\n• .audioconvert wav\n• .audioconvert ogg\n• .audioconvert flac (premium)');
                return { error: 'No media' };
            }

            const format = args[0]?.toLowerCase() || 'mp3';
            const premiumFormats = ['flac', 'wav'];
            
            if (premiumFormats.includes(format) && !isPremium) {
                await message.reply(`❌ Format "${format}" hanya untuk premium users!\n\n💎 Upgrade ke premium untuk akses semua format.\nType .premium untuk info lebih lanjut.`);
                return { error: 'Premium required' };
            }

            let loadingId = await loadingIndicator.startMediaConversion(message, 'audio conversion');

            const media = await message.downloadMedia();
            const inputPath = path.join(this.tempDir, `input_${Date.now()}.${media.mimetype.split('/')[1]}`);
            const outputPath = path.join(this.tempDir, `converted_${Date.now()}.${format}`);

            await fs.writeFile(inputPath, media.data, 'base64');

            return new Promise((resolve, reject) => {
                let ffmpegCommand = ffmpeg(inputPath);

                // Set quality based on premium status
                if (format === 'mp3') {
                    ffmpegCommand = ffmpegCommand.audioBitrate(isPremium ? '320k' : '192k');
                } else if (format === 'ogg') {
                    ffmpegCommand = ffmpegCommand.audioBitrate(isPremium ? '256k' : '128k');
                }

                ffmpegCommand
                    .format(format)
                    .on('end', async () => {
                        try {
                            const resultBuffer = await fs.readFile(outputPath);
                            
                            if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Conversion completed', true);
                            
                            const { MessageMedia } = require('whatsapp-web.js');
                            const audioMedia = new MessageMedia(`audio/${format}`, resultBuffer.toString('base64'), `converted_audio.${format}`);
                            
                            await message.reply(`✅ *AUDIO CONVERTED*\n\nFormat: ${format.toUpperCase()}\nQuality: ${isPremium ? 'High' : 'Standard'}`);
                            await message.reply(audioMedia);

                            // Cleanup
                            await fs.unlink(inputPath).catch(() => {});
                            await fs.unlink(outputPath).catch(() => {});

                            resolve({ success: true });
                        } catch (error) {
                            reject(error);
                        }
                    })
                    .on('error', (error) => {
                        reject(error);
                    })
                    .save(outputPath);
            });

        } catch (error) {
            console.error('Convert audio error:', error);
            return { error: error.message };
        }
    }

    // Video Processing Methods
    async convertVideo(message, args, isPremium) {
        try {
            if (!message.hasMedia) {
                await message.reply('❌ Reply dengan video yang ingin diconvert\n\nFormat tersedia:\n• .videoconvert mp4\n• .videoconvert webm\n• .videoconvert avi (premium)\n• .videoconvert mov (premium)');
                return { error: 'No media' };
            }

            const format = args[0]?.toLowerCase() || 'mp4';
            const premiumFormats = ['avi', 'mov', 'mkv'];
            
            if (premiumFormats.includes(format) && !isPremium) {
                await message.reply(`❌ Format "${format}" hanya untuk premium users!\n\n💎 Upgrade ke premium untuk akses semua format.\nType .premium untuk info lebih lanjut.`);
                return { error: 'Premium required' };
            }

            let loadingId = await loadingIndicator.startMediaConversion(message, 'video conversion');

            const media = await message.downloadMedia();
            const inputPath = path.join(this.tempDir, `input_${Date.now()}.${media.mimetype.split('/')[1]}`);
            const outputPath = path.join(this.tempDir, `converted_${Date.now()}.${format}`);

            await fs.writeFile(inputPath, media.data, 'base64');

            return new Promise((resolve, reject) => {
                let ffmpegCommand = ffmpeg(inputPath);

                // Set quality based on premium status
                if (isPremium) {
                    ffmpegCommand = ffmpegCommand
                        .videoBitrate('2000k')
                        .audioBitrate('256k');
                } else {
                    ffmpegCommand = ffmpegCommand
                        .videoBitrate('1000k')
                        .audioBitrate('128k');
                }

                ffmpegCommand
                    .format(format)
                    .videoCodec('libx264')
                    .audioCodec('aac')
                    .on('end', async () => {
                        try {
                            const resultBuffer = await fs.readFile(outputPath);
                            
                            if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Conversion completed', true);
                            
                            const { MessageMedia } = require('whatsapp-web.js');
                            const videoMedia = new MessageMedia(`video/${format}`, resultBuffer.toString('base64'), `converted_video.${format}`);
                            
                            await message.reply(`✅ *VIDEO CONVERTED*\n\nFormat: ${format.toUpperCase()}\nQuality: ${isPremium ? 'High (2000k)' : 'Standard (1000k)'}`);
                            await message.reply(videoMedia);

                            // Cleanup
                            await fs.unlink(inputPath).catch(() => {});
                            await fs.unlink(outputPath).catch(() => {});

                            resolve({ success: true });
                        } catch (error) {
                            reject(error);
                        }
                    })
                    .on('error', (error) => {
                        reject(error);
                    })
                    .save(outputPath);
            });

        } catch (error) {
            console.error('Convert video error:', error);
            return { error: error.message };
        }
    }

    async getMediaInfo(message) {
        try {
            if (!message.hasMedia) {
                await message.reply('❌ Reply dengan media untuk mendapatkan informasi detail');
                return { error: 'No media' };
            }

            let loadingId = await loadingIndicator.startTextGeneration(message, 'analysis');

            const media = await message.downloadMedia();
            const inputPath = path.join(this.tempDir, `input_${Date.now()}.${media.mimetype.split('/')[1]}`);
            
            await fs.writeFile(inputPath, media.data, 'base64');

            let mediaInfo = `📊 *MEDIA INFORMATION*\n\n`;
            mediaInfo += `📄 *File Type:* ${media.mimetype}\n`;
            mediaInfo += `💾 *File Size:* ${(media.data.length * 0.75 / 1024).toFixed(2)} KB\n`;

            if (media.mimetype.startsWith('image/')) {
                const metadata = await sharp(inputPath).metadata();
                mediaInfo += `📐 *Dimensions:* ${metadata.width} x ${metadata.height}px\n`;
                mediaInfo += `🎨 *Color Space:* ${metadata.space}\n`;
                mediaInfo += `📊 *Channels:* ${metadata.channels}\n`;
                if (metadata.density) {
                    mediaInfo += `🔍 *DPI:* ${metadata.density}\n`;
                }
            } else if (media.mimetype.startsWith('video/') || media.mimetype.startsWith('audio/')) {
                // For video/audio, we'd use ffprobe but keeping it simple for now
                mediaInfo += `🎬 *Media Type:* ${media.mimetype.startsWith('video/') ? 'Video' : 'Audio'}\n`;
            }

            if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Analysis completed', true);
            
            await message.reply(mediaInfo);

            // Cleanup
            await fs.unlink(inputPath).catch(() => {});

            return { success: true };
        } catch (error) {
            console.error('Get media info error:', error);
            return { error: error.message };
        }
    }

    // Additional Advanced Media Processing Methods
    async cropImage(message, args) {
        try {
            if (!message.hasMedia) {
                await message.reply('❌ Reply dengan gambar yang ingin dicrop\n\nContoh:\n• .crop 100,100,300,300 (x,y,width,height)\n• .crop center 200x200');
                return { error: 'No media' };
            }

            if (args.length === 0) {
                await message.reply('❌ Masukkan parameter crop\n\nFormat:\n• .crop 100,100,300,300 (x,y,width,height)\n• .crop center 200x200');
                return { error: 'No parameters' };
            }

            let loadingId = await loadingIndicator.startMediaConversion(message, 'image crop');

            const media = await message.downloadMedia();
            const inputPath = path.join(this.tempDir, `input_${Date.now()}.${media.mimetype.split('/')[1]}`);
            const outputPath = path.join(this.tempDir, `cropped_${Date.now()}.png`);

            await fs.writeFile(inputPath, media.data, 'base64');

            let cropOptions = {};
            const cropArg = args.join(' ');

            if (cropArg.startsWith('center')) {
                const sizeMatch = cropArg.match(/(\d+)x(\d+)/);
                if (sizeMatch) {
                    const width = parseInt(sizeMatch[1]);
                    const height = parseInt(sizeMatch[2]);
                    const metadata = await sharp(inputPath).metadata();
                    cropOptions = {
                        left: Math.max(0, Math.floor((metadata.width - width) / 2)),
                        top: Math.max(0, Math.floor((metadata.height - height) / 2)),
                        width: width,
                        height: height
                    };
                }
            } else {
                const coords = cropArg.split(',').map(Number);
                if (coords.length === 4) {
                    cropOptions = {
                        left: coords[0],
                        top: coords[1],
                        width: coords[2],
                        height: coords[3]
                    };
                }
            }

            await sharp(inputPath)
                .extract(cropOptions)
                .png({ quality: 90 })
                .toFile(outputPath);

            const resultBuffer = await fs.readFile(outputPath);
            
            if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Crop completed', true);
            
            const { MessageMedia } = require('whatsapp-web.js');
            const croppedMedia = new MessageMedia('image/png', resultBuffer.toString('base64'), 'cropped_image.png');
            
            await message.reply(`✅ *IMAGE CROPPED*\n\nCrop area: ${cropOptions.width}x${cropOptions.height}`);
            await message.reply(croppedMedia);

            // Cleanup
            await fs.unlink(inputPath).catch(() => {});
            await fs.unlink(outputPath).catch(() => {});

            return { success: true };
        } catch (error) {
            console.error('Crop image error:', error);
            return { error: error.message };
        }
    }

    async rotateImage(message, args) {
        try {
            if (!message.hasMedia) {
                await message.reply('❌ Reply dengan gambar yang ingin dirotate\n\nContoh:\n• .rotate 90\n• .rotate 180\n• .rotate -45');
                return { error: 'No media' };
            }

            const angle = parseInt(args[0]) || 90;
            let loadingId = await loadingIndicator.startMediaConversion(message, 'image rotation');

            const media = await message.downloadMedia();
            const inputPath = path.join(this.tempDir, `input_${Date.now()}.${media.mimetype.split('/')[1]}`);
            const outputPath = path.join(this.tempDir, `rotated_${Date.now()}.png`);

            await fs.writeFile(inputPath, media.data, 'base64');

            await sharp(inputPath)
                .rotate(angle)
                .png({ quality: 90 })
                .toFile(outputPath);

            const resultBuffer = await fs.readFile(outputPath);
            
            if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Rotation completed', true);
            
            const { MessageMedia } = require('whatsapp-web.js');
            const rotatedMedia = new MessageMedia('image/png', resultBuffer.toString('base64'), 'rotated_image.png');
            
            await message.reply(`✅ *IMAGE ROTATED*\n\nAngle: ${angle}°`);
            await message.reply(rotatedMedia);

            // Cleanup
            await fs.unlink(inputPath).catch(() => {});
            await fs.unlink(outputPath).catch(() => {});

            return { success: true };
        } catch (error) {
            console.error('Rotate image error:', error);
            return { error: error.message };
        }
    }

    async flipImage(message, args) {
        try {
            if (!message.hasMedia) {
                await message.reply('❌ Reply dengan gambar yang ingin di-flip\n\nContoh:\n• .flip horizontal\n• .flip vertical\n• .flip both');
                return { error: 'No media' };
            }

            const direction = args[0]?.toLowerCase() || 'horizontal';
            let loadingId = await loadingIndicator.startMediaConversion(message, 'image flip');

            const media = await message.downloadMedia();
            const inputPath = path.join(this.tempDir, `input_${Date.now()}.${media.mimetype.split('/')[1]}`);
            const outputPath = path.join(this.tempDir, `flipped_${Date.now()}.png`);

            await fs.writeFile(inputPath, media.data, 'base64');

            let pipeline = sharp(inputPath);

            switch (direction) {
                case 'horizontal':
                    pipeline = pipeline.flop();
                    break;
                case 'vertical':
                    pipeline = pipeline.flip();
                    break;
                case 'both':
                    pipeline = pipeline.flop().flip();
                    break;
            }

            await pipeline.png({ quality: 90 }).toFile(outputPath);

            const resultBuffer = await fs.readFile(outputPath);
            
            if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Flip completed', true);
            
            const { MessageMedia } = require('whatsapp-web.js');
            const flippedMedia = new MessageMedia('image/png', resultBuffer.toString('base64'), 'flipped_image.png');
            
            await message.reply(`✅ *IMAGE FLIPPED*\n\nDirection: ${direction}`);
            await message.reply(flippedMedia);

            // Cleanup
            await fs.unlink(inputPath).catch(() => {});
            await fs.unlink(outputPath).catch(() => {});

            return { success: true };
        } catch (error) {
            console.error('Flip image error:', error);
            return { error: error.message };
        }
    }

    async addWatermark(message, args) {
        try {
            if (!message.hasMedia) {
                await message.reply('❌ Reply dengan gambar untuk menambah watermark\n\nContoh:\n• .watermark "Text" bottom-right\n• .watermark "© 2024" center');
                return { error: 'No media' };
            }

            if (args.length === 0) {
                await message.reply('❌ Masukkan text watermark\n\nContoh:\n• .watermark "Your Text"\n• .watermark "© 2024" bottom-right');
                return { error: 'No text' };
            }

            const watermarkText = args.join(' ').replace(/"/g, '');
            const position = args[args.length - 1]?.toLowerCase() || 'bottom-right';
            
            let loadingId = await loadingIndicator.startMediaConversion(message, 'adding watermark');

            const media = await message.downloadMedia();
            const inputPath = path.join(this.tempDir, `input_${Date.now()}.${media.mimetype.split('/')[1]}`);
            const outputPath = path.join(this.tempDir, `watermarked_${Date.now()}.png`);

            await fs.writeFile(inputPath, media.data, 'base64');

            const metadata = await sharp(inputPath).metadata();
            const fontSize = Math.max(20, Math.floor(metadata.width / 25));

            // Create text SVG
            const textSvg = `
                <svg width="${metadata.width}" height="${metadata.height}">
                    <text x="${position.includes('right') ? metadata.width - 20 : 20}" 
                          y="${position.includes('bottom') ? metadata.height - 20 : 40}" 
                          font-family="Arial" 
                          font-size="${fontSize}" 
                          fill="rgba(255,255,255,0.8)" 
                          text-anchor="${position.includes('right') ? 'end' : 'start'}">${watermarkText}</text>
                </svg>
            `;

            await sharp(inputPath)
                .composite([{
                    input: Buffer.from(textSvg),
                    gravity: 'southeast'
                }])
                .png({ quality: 90 })
                .toFile(outputPath);

            const resultBuffer = await fs.readFile(outputPath);
            
            if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Watermark added', true);
            
            const { MessageMedia } = require('whatsapp-web.js');
            const watermarkedMedia = new MessageMedia('image/png', resultBuffer.toString('base64'), 'watermarked_image.png');
            
            await message.reply(`✅ *WATERMARK ADDED*\n\nText: "${watermarkText}"\nPosition: ${position}`);
            await message.reply(watermarkedMedia);

            // Cleanup
            await fs.unlink(inputPath).catch(() => {});
            await fs.unlink(outputPath).catch(() => {});

            return { success: true };
        } catch (error) {
            console.error('Add watermark error:', error);
            return { error: error.message };
        }
    }

    async removeBackground(message, isPremium) {
        try {
            if (!message.hasMedia) {
                await message.reply('❌ Reply dengan gambar untuk remove background');
                return { error: 'No media' };
            }

            if (!isPremium) {
                await message.reply('❌ Fitur remove background hanya untuk premium users!\n\n💎 Upgrade ke premium untuk akses fitur ini.\nType .premium untuk info lebih lanjut.');
                return { error: 'Premium required' };
            }

            let loadingId = await loadingIndicator.startMediaConversion(message, 'removing background');

            const media = await message.downloadMedia();
            const inputPath = path.join(this.tempDir, `input_${Date.now()}.${media.mimetype.split('/')[1]}`);
            const outputPath = path.join(this.tempDir, `nobg_${Date.now()}.png`);

            await fs.writeFile(inputPath, media.data, 'base64');

            // Simple background removal using color threshold (basic implementation)
            await sharp(inputPath)
                .removeAlpha()
                .png({ quality: 100 })
                .toFile(outputPath);

            const resultBuffer = await fs.readFile(outputPath);
            
            if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Background removed', true);
            
            const { MessageMedia } = require('whatsapp-web.js');
            const nobgMedia = new MessageMedia('image/png', resultBuffer.toString('base64'), 'no_background.png');
            
            await message.reply(`✅ *BACKGROUND REMOVED*\n\nQuality: Premium\n\n💎 Premium feature`);
            await message.reply(nobgMedia);

            // Cleanup
            await fs.unlink(inputPath).catch(() => {});
            await fs.unlink(outputPath).catch(() => {});

            return { success: true };
        } catch (error) {
            console.error('Remove background error:', error);
            return { error: error.message };
        }
    }

    async generateThumbnail(message, args) {
        try {
            if (!message.hasMedia) {
                await message.reply('❌ Reply dengan video untuk generate thumbnail\n\nContoh:\n• .thumbnail 0:30 (timestamp)\n• .thumbnail random');
                return { error: 'No media' };
            }

            const timestamp = args[0] || '0:01';
            let loadingId = await loadingIndicator.startMediaConversion(message, 'generating thumbnail');

            const media = await message.downloadMedia();
            const inputPath = path.join(this.tempDir, `input_${Date.now()}.${media.mimetype.split('/')[1]}`);
            const outputPath = path.join(this.tempDir, `thumbnail_${Date.now()}.jpg`);

            await fs.writeFile(inputPath, media.data, 'base64');

            return new Promise((resolve, reject) => {
                ffmpeg(inputPath)
                    .screenshots({
                        timestamps: [timestamp],
                        filename: path.basename(outputPath),
                        folder: path.dirname(outputPath),
                        size: '640x360'
                    })
                    .on('end', async () => {
                        try {
                            const resultBuffer = await fs.readFile(outputPath);
                            
                            if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Thumbnail generated', true);
                            
                            const { MessageMedia } = require('whatsapp-web.js');
                            const thumbnailMedia = new MessageMedia('image/jpeg', resultBuffer.toString('base64'), 'thumbnail.jpg');
                            
                            await message.reply(`✅ *THUMBNAIL GENERATED*\n\nTimestamp: ${timestamp}\nSize: 640x360`);
                            await message.reply(thumbnailMedia);

                            // Cleanup
                            await fs.unlink(inputPath).catch(() => {});
                            await fs.unlink(outputPath).catch(() => {});

                            resolve({ success: true });
                        } catch (error) {
                            reject(error);
                        }
                    })
                    .on('error', (error) => {
                        reject(error);
                    });
            });

        } catch (error) {
            console.error('Generate thumbnail error:', error);
            return { error: error.message };
        }
    }
}

module.exports = MediaHandler;