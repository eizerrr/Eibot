const { MessageMedia } = require('whatsapp-web.js');

class LoadingIndicator {
    constructor() {
        this.activeLoaders = new Map();
        this.loadingFrames = [
            '⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'
        ];
        this.currentFrame = 0;
    }

    // Start animated loading indicator
    async startLoading(message, text = 'Processing', duration = 30000) {
        const chatId = message.from;
        const loadingId = `${chatId}_${Date.now()}`;
        
        try {
            // Send initial loading message
            const loadingMessage = await message.reply(`${this.loadingFrames[0]} ${text}...`);
            
            // Store loading info
            const loadingInfo = {
                message: loadingMessage,
                text: text,
                interval: null,
                startTime: Date.now()
            };
            
            this.activeLoaders.set(loadingId, loadingInfo);
            
            // Start animation
            loadingInfo.interval = setInterval(() => {
                this.updateLoadingFrame(loadingId);
            }, 200);
            
            // Auto-stop after duration
            setTimeout(() => {
                this.stopLoading(loadingId, 'Operation timed out');
            }, duration);
            
            return loadingId;
        } catch (error) {
            console.error('Failed to start loading indicator:', error);
            return null;
        }
    }

    // Update loading animation frame
    async updateLoadingFrame(loadingId) {
        const loadingInfo = this.activeLoaders.get(loadingId);
        if (!loadingInfo) return;
        
        try {
            this.currentFrame = (this.currentFrame + 1) % this.loadingFrames.length;
            const elapsed = Math.floor((Date.now() - loadingInfo.startTime) / 1000);
            
            await loadingInfo.message.edit(`${this.loadingFrames[this.currentFrame]} ${loadingInfo.text}... (${elapsed}s)`);
        } catch (error) {
            // Message might be deleted or failed to edit, stop the loader
            this.stopLoading(loadingId);
        }
    }

    // Stop loading and show completion message
    async stopLoading(loadingId, completionText = 'Completed', isSuccess = true) {
        const loadingInfo = this.activeLoaders.get(loadingId);
        if (!loadingInfo) return;
        
        try {
            // Clear interval
            if (loadingInfo.interval) {
                clearInterval(loadingInfo.interval);
            }
            
            // Update final message
            const icon = isSuccess ? '✅' : '❌';
            const elapsed = Math.floor((Date.now() - loadingInfo.startTime) / 1000);
            
            await loadingInfo.message.edit(`${icon} ${completionText} (${elapsed}s)`);
            
            // Clean up
            this.activeLoaders.delete(loadingId);
            
            // Auto-delete completion message after 3 seconds
            setTimeout(async () => {
                try {
                    await loadingInfo.message.delete();
                } catch (error) {
                    // Message might already be deleted
                }
            }, 3000);
            
        } catch (error) {
            console.error('Failed to stop loading indicator:', error);
            // Still clean up
            this.activeLoaders.delete(loadingId);
        }
    }

    // Update loading text without stopping
    async updateLoadingText(loadingId, newText) {
        const loadingInfo = this.activeLoaders.get(loadingId);
        if (!loadingInfo) return;
        
        loadingInfo.text = newText;
    }

    // Media-specific loading indicators
    async startMediaDownload(message, mediaType = 'media') {
        const texts = {
            'video': 'Downloading video',
            'audio': 'Downloading audio', 
            'image': 'Processing image',
            'sticker': 'Creating sticker',
            'media': 'Downloading media'
        };
        
        return await this.startLoading(message, texts[mediaType] || texts['media'], 60000);
    }

    async startMediaConversion(message, conversionType = 'conversion') {
        const texts = {
            'mp4': 'Converting to MP4',
            'mp3': 'Converting to MP3',
            'webp': 'Converting to WebP',
            'jpg': 'Converting to JPG',
            'sticker': 'Converting to sticker',
            'conversion': 'Converting media'
        };
        
        return await this.startLoading(message, texts[conversionType] || texts['conversion'], 45000);
    }

    async startTextGeneration(message, operation = 'generation') {
        const texts = {
            'ai': 'Generating AI response',
            'image': 'Generating image',
            'text': 'Processing text',
            'search': 'Searching',
            'generation': 'Generating content'
        };
        
        return await this.startLoading(message, texts[operation] || texts['generation'], 30000);
    }

    // Batch operations
    async startBatchOperation(message, operation, total) {
        return await this.startLoading(message, `${operation} (0/${total})`, 120000);
    }

    async updateBatchProgress(loadingId, operation, current, total) {
        await this.updateLoadingText(loadingId, `${operation} (${current}/${total})`);
    }

    // Clean up all active loaders
    cleanup() {
        for (const [loadingId, loadingInfo] of this.activeLoaders) {
            if (loadingInfo.interval) {
                clearInterval(loadingInfo.interval);
            }
        }
        this.activeLoaders.clear();
    }

    // Get active loader count
    getActiveCount() {
        return this.activeLoaders.size;
    }
}

// Export singleton instance
const loadingIndicator = new LoadingIndicator();
module.exports = loadingIndicator;