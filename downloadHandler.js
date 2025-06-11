const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');
const ytdl = require('@distube/ytdl-core');
const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config');
const loadingIndicator = require('../utils/loadingIndicator');

class DownloadHandler {
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
                case 'ytmp3':
                    return await this.downloadYouTubeAudio(message, args);

                case 'ytmp4':
                    return await this.downloadYouTubeVideo(message, args);

                case 'tt':
                case 'tiktoknowm':
                    return await this.downloadTikTokNoWatermark(message, args);

                case 'tiktokwm':
                    return await this.downloadTikTokWithWatermark(message, args);

                case 'tiktokmusic':
                    return await this.downloadTikTokMusic(message, args);

                case 'igdl':
                    return await this.downloadInstagramPost(message, args);

                case 'igstory':
                    return await this.downloadInstagramStory(message, args);

                case 'igtv':
                    return await this.downloadInstagramTV(message, args);

                case 'igreel':
                    return await this.downloadInstagramReel(message, args);

                case 'facebook':
                    return await this.downloadFacebook(message, args);

                case 'twitterdl':
                    return await this.downloadTwitter(message, args);

                case 'threads':
                    return await this.downloadThreads(message, args);

                case 'mediafire':
                    return await this.downloadMediafire(message, args);

                case 'pindl':
                    return await this.downloadPinterest(message, args);

                case 'otakudesudl':
                    return await this.downloadOtakudesu(message, args);

                default:
                    
                    return { error: 'Download command not implemented' };
            }
        } catch (error) {
            console.error('Download handler error:', error);
            
            return { error: error.message };
        }
    }

    async downloadYouTubeAudio(message, args) {
        if (!args.length) {
            await message.reply('❌ *YOUTUBE MP3*\n\nContoh: .ytmp3 https://youtu.be/xxxxx');
            return { error: 'No URL provided' };
        }

        const url = args[0];

        if (!this.isValidYouTubeURL(url)) {
            await message.reply('❌ URL YouTube tidak valid!');
            return { error: 'Invalid YouTube URL' };
        }

        let loadingId = null;
        try {
            // Start loading indicator
            loadingId = await loadingIndicator.startMediaDownload(message, 'audio');

            // Validate URL
            if (!ytdl.validateURL(url)) {
                if (loadingId) await loadingIndicator.stopLoading(loadingId, 'URL tidak dapat diakses', false);
                await message.reply('❌ URL YouTube tidak dapat diakses!');
                return { error: 'Invalid YouTube URL' };
            }

            // Get video info
            const info = await ytdl.getInfo(url);
            const title = info.videoDetails.title.substring(0, 50).replace(/[^\w\s]/gi, '');
            const duration = parseInt(info.videoDetails.lengthSeconds);

            // Check duration limit (max 10 minutes)
            if (duration > 600) {
                if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Video terlalu panjang', false);
                await message.reply('❌ Video terlalu panjang! Maksimal 10 menit.');
                return { error: 'Video too long' };
            }

            // Update loading text with video info
            if (loadingId) await loadingIndicator.updateLoadingText(loadingId, `Downloading: ${title.substring(0, 30)}...`);

            // Download audio
            const tempFile = path.join(this.tempDir, `audio_${Date.now()}.mp3`);
            
            const audioStream = ytdl(url, {
                filter: 'audioonly',
                quality: 'lowestaudio',
                format: 'mp3'
            });

            const writeStream = require('fs').createWriteStream(tempFile);
            audioStream.pipe(writeStream);

            await new Promise((resolve, reject) => {
                writeStream.on('finish', resolve);
                writeStream.on('error', reject);
                audioStream.on('error', reject);
            });

            // Update loading text for file processing
            if (loadingId) await loadingIndicator.updateLoadingText(loadingId, 'Processing audio file...');

            // Check file size (max 50MB)
            const stats = await fs.stat(tempFile);
            if (stats.size > 50 * 1024 * 1024) {
                await fs.unlink(tempFile);
                if (loadingId) await loadingIndicator.stopLoading(loadingId, 'File terlalu besar', false);
                await message.reply('❌ File terlalu besar (max 50MB)');
                return { error: 'File too large' };
            }

            // Send audio file
            const audioBuffer = await fs.readFile(tempFile);
            const media = new MessageMedia('audio/mpeg', audioBuffer.toString('base64'), `${title}.mp3`);

            const caption = `🎵 *YOUTUBE MP3*

📝 *Judul:* ${title}
⏱️ *Durasi:* ${this.formatDuration(duration)}
📏 *Ukuran:* ${(stats.size / (1024 * 1024)).toFixed(2)} MB

_Audio berhasil diunduh dan dikirim ke grup_`;

            // Stop loading indicator with success
            if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Audio download completed', true);

            await message.reply(media);
            await message.reply(caption);

            // Clean up
            await fs.unlink(tempFile);
            return { success: true };

        } catch (error) {
            console.error('YouTube MP3 error:', error);
            
            // Stop loading indicator with error
            if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Download failed', false);
            
            // Fallback to manual instructions
            const fallbackMessage = `🎵 *YOUTUBE MP3 DOWNLOADER*

🔗 *Link YouTube:* ${url}

📱 *Cara Download:*
1. Buka website: https://ytmp3.cc/
2. Copy paste link YouTube di atas ke website tersebut
3. Klik "Convert" dan tunggu proses selesai
4. Klik "Download" untuk mendapatkan file MP3

💡 *Alternatif website:*
• https://y2mate.com/
• https://mp3converter.net/
• https://320ytmp3.com/

_Automatic download gagal, gunakan cara manual di atas_`;

            await message.reply(fallbackMessage);
            return { error: error.message };
        }
    }

    async downloadYouTubeVideo(message, args) {
        if (!args.length) {
            
            return { error: 'No URL provided' };
        }

        const url = args[0];

        if (!this.isValidYouTubeURL(url)) {
            
            return { error: 'Invalid YouTube URL' };
        }

        let loadingId = null;
        try {
            // Start loading indicator
            loadingId = await loadingIndicator.startMediaDownload(message, 'video');

            // Validate URL
            if (!ytdl.validateURL(url)) {
                if (loadingId) await loadingIndicator.stopLoading(loadingId, 'URL tidak dapat diakses', false);
                await message.reply('❌ URL YouTube tidak dapat diakses!');
                return { error: 'Invalid YouTube URL' };
            }

            // Get video info
            const info = await ytdl.getInfo(url);
            const title = info.videoDetails.title.substring(0, 50).replace(/[^\w\s]/gi, '');
            const duration = parseInt(info.videoDetails.lengthSeconds);

            // Check duration limit (max 5 minutes for video)
            if (duration > 300) {
                if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Video terlalu panjang', false);
                await message.reply('❌ Video terlalu panjang! Maksimal 5 menit.');
                return { error: 'Video too long' };
            }

            // Update loading text with video info
            if (loadingId) await loadingIndicator.updateLoadingText(loadingId, `Downloading: ${title.substring(0, 30)}...`);

            // Download video
            const tempFile = path.join(this.tempDir, `video_${Date.now()}.mp4`);
            
            const videoStream = ytdl(url, {
                filter: 'videoandaudio',
                quality: 'lowest'
            });

            const writeStream = require('fs').createWriteStream(tempFile);
            videoStream.pipe(writeStream);

            await new Promise((resolve, reject) => {
                writeStream.on('finish', resolve);
                writeStream.on('error', reject);
                videoStream.on('error', reject);
            });

            // Update loading text for file processing
            if (loadingId) await loadingIndicator.updateLoadingText(loadingId, 'Processing video file...');

            // Check file size (max 100MB)
            const stats = await fs.stat(tempFile);
            if (stats.size > 100 * 1024 * 1024) {
                await fs.unlink(tempFile);
                if (loadingId) await loadingIndicator.stopLoading(loadingId, 'File terlalu besar', false);
                await message.reply('❌ File terlalu besar (max 100MB)');
                return { error: 'File too large' };
            }

            // Send video file
            const videoBuffer = await fs.readFile(tempFile);
            const media = new MessageMedia('video/mp4', videoBuffer.toString('base64'), `${title}.mp4`);

            const caption = `🎥 *YOUTUBE MP4*

📝 *Judul:* ${title}
⏱️ *Durasi:* ${this.formatDuration(duration)}
📏 *Ukuran:* ${(stats.size / (1024 * 1024)).toFixed(2)} MB

_Video berhasil diunduh dan dikirim ke grup_`;

            // Stop loading indicator with success
            if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Video download completed', true);

            await message.reply(media);
            await message.reply(caption);

            // Clean up
            await fs.unlink(tempFile);
            return { success: true };

        } catch (error) {
            console.error('YouTube MP4 error:', error);
            
            // Stop loading indicator with error
            if (loadingId) await loadingIndicator.stopLoading(loadingId, 'Download failed', false);
            
            // Fallback to manual instructions
            const fallbackMessage = `🎥 *YOUTUBE MP4 DOWNLOADER*

🔗 *Link YouTube:* ${url}

📱 *Cara Download:*
1. Buka website: https://y2mate.com/
2. Copy paste link YouTube di atas ke website tersebut
3. Pilih kualitas video yang diinginkan
4. Klik "Download" untuk mendapatkan file MP4

💡 *Alternatif website:*
• https://ytmp4.cc/
• https://savefrom.net/
• https://keepvid.com/

_Automatic download gagal, gunakan cara manual di atas_`;

            await message.reply(fallbackMessage);
            return { error: error.message };
        }
    }

    async downloadTikTokNoWatermark(message, args) {
        if (!args.length) {
            await message.reply('❌ *TIKTOK DOWNLOADER*\n\nContoh: .tt https://vt.tiktok.com/xxxxx');
            return { error: 'No URL provided' };
        }

        const url = args[0];
        
        if (!url.includes('tiktok.com')) {
            await message.reply('❌ URL TikTok tidak valid!');
            return { error: 'Invalid TikTok URL' };
        }

        try {
            await message.reply('⏳ Mengunduh video TikTok...');

            // Use TikTok API to get video data
            const apiUrl = `https://tikwm.com/api/?url=${encodeURIComponent(url)}`;
            const response = await axios.get(apiUrl);
            const data = response.data;

            if (!data.data || !data.data.play) {
                throw new Error('Video tidak dapat diunduh');
            }

            // Download video file
            const videoUrl = data.data.play;
            const videoResponse = await axios.get(videoUrl, { responseType: 'arraybuffer' });
            const videoBuffer = Buffer.from(videoResponse.data);

            // Check file size (max 50MB)
            if (videoBuffer.length > 50 * 1024 * 1024) {
                await message.reply('❌ File terlalu besar (max 50MB)');
                return { error: 'File too large' };
            }

            // Format date properly
            const createDate = data.data.create_time ? new Date(data.data.create_time * 1000) : new Date();
            const formatDate = createDate.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric'
            }) + ' ' + createDate.toLocaleTimeString('id-ID');

            // Send detailed info message first
            const infoMessage = `*[ Tiktok Downloader ]*

- Id : ${data.data.id || 'Unknown'}
- Username : ${data.data.author.unique_id || 'Unknown'}
- Nickname : ${data.data.author.nickname || 'Unknown'}
- Type : video
- CreateAt : ${formatDate}
- Play : ${data.data.play_count || 0}
- Download : ${data.data.download_count || 0}
- Share : ${data.data.share_count || 0}
- Comment : ${data.data.comment_count || 0}
- Like : ${data.data.digg_count || 0}
- Favourite : ${data.data.collect_count || 0}
- Description : ${data.data.title || ''}`;

            await message.reply(infoMessage);

            // Send video file separately to avoid media sending errors
            try {
                const media = new MessageMedia('video/mp4', videoBuffer.toString('base64'), 'tiktok.mp4');
                await message.reply(media);
            } catch (mediaError) {
                console.error('Media send error:', mediaError);
                // If media fails, provide download link
                await message.reply(`📹 Video TikTok berhasil diproses!\n\n🔗 Link download: ${data.data.play}\n\n_Copy link di atas untuk download manual_`);
            }
            return { success: true };

        } catch (error) {
            console.error('TikTok download error:', error);
            
            // Fallback to manual instructions
            const fallbackMessage = `🎬 *TIKTOK DOWNLOADER*

🔗 *Link TikTok:* ${url}

📱 *Cara Download:*
1. Buka website: https://snaptik.app/
2. Copy paste link TikTok di atas ke website tersebut
3. Klik "Download" untuk mendapatkan video tanpa watermark

💡 *Alternatif website:*
• https://ssstik.io/
• https://tikmate.online/
• https://tiktokdownload.online/

_Automatic download gagal, gunakan cara manual di atas_`;

            await message.reply(fallbackMessage);
            return { error: error.message };
        }
    }

    async downloadInstagramPost(message, args) {
        if (!args.length) {
            await message.reply('❌ *INSTAGRAM DOWNLOADER*\n\nContoh: .ig https://instagram.com/p/xxxxx');
            return { error: 'No URL provided' };
        }

        const url = args[0];

        if (!this.isValidInstagramURL(url)) {
            await message.reply('❌ URL Instagram tidak valid!');
            return { error: 'Invalid Instagram URL' };
        }

        try {
            await message.reply('⏳ Mengunduh konten Instagram...');

            // Use Instagram API to get media data
            const apiUrl = `https://instagram-downloader-download-instagram-videos-stories.p.rapidapi.com/index`;
            const response = await axios.post(apiUrl, { url: url }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-RapidAPI-Host': 'instagram-downloader-download-instagram-videos-stories.p.rapidapi.com',
                    'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || 'demo-key'
                }
            });

            const data = response.data;

            if (!data.media || data.media.length === 0) {
                throw new Error('Media tidak ditemukan');
            }

            // Get the first media item
            const mediaItem = data.media[0];
            const mediaUrl = mediaItem.url;
            const mediaType = mediaItem.type; // 'image' or 'video'

            // Download media file
            const mediaResponse = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
            const mediaBuffer = Buffer.from(mediaResponse.data);

            // Check file size (max 50MB)
            if (mediaBuffer.length > 50 * 1024 * 1024) {
                await message.reply('❌ File terlalu besar (max 50MB)');
                return { error: 'File too large' };
            }

            // Determine media type and send
            const mimeType = mediaType === 'video' ? 'video/mp4' : 'image/jpeg';
            const filename = mediaType === 'video' ? 'instagram.mp4' : 'instagram.jpg';
            const media = new MessageMedia(mimeType, mediaBuffer.toString('base64'), filename);
            
            const caption = `📷 *INSTAGRAM ${mediaType.toUpperCase()}*

📝 *Caption:* ${data.title || 'Instagram Post'}
👤 *Author:* ${data.owner || 'Unknown'}
📏 *Ukuran:* ${(mediaBuffer.length / (1024 * 1024)).toFixed(2)} MB

_Konten berhasil diunduh dari Instagram_`;

            await message.reply(media);
            await message.reply(caption);
            return { success: true };

        } catch (error) {
            console.error('Instagram download error:', error);
            
            // Fallback to manual instructions
            const fallbackMessage = `📷 *INSTAGRAM DOWNLOADER*

🔗 *Link Instagram:* ${url}

📱 *Cara Download:*
1. Buka website: https://snapinsta.app/
2. Copy paste link Instagram di atas ke website tersebut
3. Klik "Download" untuk mendapatkan foto/video

💡 *Alternatif website:*
• https://igram.world/
• https://saveinsta.app/
• https://instasave.website/

_Automatic download gagal, gunakan cara manual di atas_`;

            await message.reply(fallbackMessage);
            return { error: error.message };
        }
    }

    async downloadFacebook(message, args) {
        if (!args.length) {
            
            return { error: 'No URL provided' };
        }

        const url = args[0];

        if (!this.isValidFacebookURL(url)) {
            
            return { error: 'Invalid Facebook URL' };
        }

        try {
            

            return;
            
            return { success: true };
        } catch (error) {
            console.error('Facebook download error:', error);
            
            return { error: error.message };
        }
    }

    async downloadTwitter(message, args) {
        if (!args.length) {
            
            return { error: 'No URL provided' };
        }

        const url = args[0];

        if (!this.isValidTwitterURL(url)) {
            
            return { error: 'Invalid Twitter URL' };
        }

        try {
            

            return;
            
            return { success: true };
        } catch (error) {
            console.error('Twitter download error:', error);
            
            return { error: error.message };
        }
    }

    async downloadMediafire(message, args) {
        if (!args.length) {
            
            return { error: 'No URL provided' };
        }

        const url = args[0];

        if (!url.includes('mediafire.com')) {
            
            return { error: 'Invalid Mediafire URL' };
        }

        try {
            

            return;
            
            return { success: true };
        } catch (error) {
            console.error('Mediafire download error:', error);
            
            return { error: error.message };
        }
    }

    // Helper methods
    isValidYouTubeURL(url) {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
        return youtubeRegex.test(url);
    }

    isValidTikTokURL(url) {
        console.log(`DEBUG: Testing URL: "${url}"`);
        const tiktokRegex = /^https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com)\/.+/;
        const result = tiktokRegex.test(url);
        console.log(`DEBUG: Regex test result: ${result}`);
        
        // Also test individual patterns for debugging
        const patterns = [
            /tiktok\.com/,
            /vm\.tiktok\.com/,
            /vt\.tiktok\.com/
        ];
        
        patterns.forEach((pattern, index) => {
            console.log(`DEBUG: Pattern ${index + 1} (${pattern.source}): ${pattern.test(url)}`);
        });
        
        return result;
    }

    isValidInstagramURL(url) {
        const instagramRegex = /^(https?:\/\/)?(www\.)?instagram\.com\/.+/;
        return instagramRegex.test(url);
    }

    isValidFacebookURL(url) {
        const facebookRegex = /^(https?:\/\/)?(www\.)?(facebook\.com|fb\.watch)\/.+/;
        return facebookRegex.test(url);
    }

    isValidTwitterURL(url) {
        const twitterRegex = /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/.+/;
        return twitterRegex.test(url);
    }

    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

module.exports = DownloadHandler;
