/**
 * Background Scheduler Service
 * Periodically updates cached news articles to simulate real-time aggregation
 */

const NewsService = require('./newsService');
const cacheService = require('./cacheService');

class SchedulerService {
    constructor() {
        this.intervals = [];
        this.isRunning = false;
        
        // Configuration
        this.config = {
            // Update top headlines every 5 minutes
            topHeadlinesInterval: 5 * 60 * 1000, // 5 minutes
            
            // Update popular searches every 10 minutes
            popularSearchesInterval: 10 * 60 * 1000, // 10 minutes
            
            // Popular search keywords to keep fresh
            popularKeywords: [
                'technology',
                'business',
                'sports',
                'health',
                'entertainment',
                'science',
                'politics'
            ],
            
            // Popular categories
            popularCategories: ['technology', 'business', 'sports', 'health'],
            
            // Languages to cache
            languages: ['en']
        };
        
        // Statistics
        this.stats = {
            totalUpdates: 0,
            successfulUpdates: 0,
            failedUpdates: 0,
            lastUpdate: null,
            nextScheduledUpdate: null
        };
    }

    /**
     * Start the background scheduler
     */
    async start() {
        if (this.isRunning) {
            console.log('Scheduler is already running');
            return;
        }

        console.log('🚀 Starting background news cache updater...');
        this.isRunning = true;

        // Run initial update
        await this.updateAllCaches();

        // Schedule periodic updates for top headlines
        const topHeadlinesInterval = setInterval(async () => {
            console.log('⏰ Scheduled update: Top headlines');
            await this.updateTopHeadlines();
        }, this.config.topHeadlinesInterval);

        this.intervals.push(topHeadlinesInterval);

        // Schedule periodic updates for popular searches
        const popularSearchesInterval = setInterval(async () => {
            console.log('⏰ Scheduled update: Popular searches');
            await this.updatePopularSearches();
        }, this.config.popularSearchesInterval);

        this.intervals.push(popularSearchesInterval);

        console.log('✅ Background scheduler started successfully');
        console.log(`   - Top headlines refresh: every ${this.config.topHeadlinesInterval / 60000} minutes`);
        console.log(`   - Popular searches refresh: every ${this.config.popularSearchesInterval / 60000} minutes`);
        
        this.stats.nextScheduledUpdate = new Date(Date.now() + this.config.topHeadlinesInterval);
    }

    /**
     * Stop the background scheduler
     */
    stop() {
        if (!this.isRunning) {
            console.log('Scheduler is not running');
            return;
        }

        console.log('🛑 Stopping background scheduler...');
        
        // Clear all intervals
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals = [];
        
        this.isRunning = false;
        console.log('✅ Background scheduler stopped');
    }

    /**
     * Update all caches (initial run)
     */
    async updateAllCaches() {
        console.log('🔄 Running initial cache update...');
        
        try {
            await this.updateTopHeadlines();
            await this.updatePopularSearches();
            
            console.log('✅ Initial cache update completed');
        } catch (error) {
            console.error('❌ Initial cache update failed:', error.message);
        }
    }

    /**
     * Update top headlines cache
     */
    async updateTopHeadlines() {
        const updates = [];
        
        for (const language of this.config.languages) {
            const updatePromise = this.fetchAndCache(
                'top-headlines',
                async () => await NewsService.fetchNewsByPreferences([], {
                    page: 1,
                    pageSize: 20,
                    language
                }),
                { language }
            );
            
            updates.push(updatePromise);
        }

        const results = await Promise.allSettled(updates);
        this.logResults('Top Headlines', results);
    }

    /**
     * Update popular searches cache
     */
    async updatePopularSearches() {
        const updates = [];
        
        for (const keyword of this.config.popularKeywords) {
            const updatePromise = this.fetchAndCache(
                'search',
                async () => await NewsService.searchNews(keyword, {
                    page: 1,
                    pageSize: 20,
                    language: 'en',
                    sortBy: 'publishedAt'
                }),
                { keyword }
            );
            
            updates.push(updatePromise);
        }

        const results = await Promise.allSettled(updates);
        this.logResults('Popular Searches', results);
    }

    /**
     * Fetch data and update cache
     * @param {string} type - Cache type (for logging)
     * @param {Function} fetchFunction - Function to fetch data
     * @param {Object} metadata - Additional metadata for logging
     */
    async fetchAndCache(type, fetchFunction, metadata = {}) {
        try {
            this.stats.totalUpdates++;
            
            const data = await fetchFunction();
            
            // Data is already cached by the service layer
            this.stats.successfulUpdates++;
            this.stats.lastUpdate = new Date();
            
            console.log(`✓ Updated ${type} cache:`, metadata);
            
            return { success: true, type, metadata };
        } catch (error) {
            this.stats.failedUpdates++;
            console.error(`✗ Failed to update ${type} cache:`, metadata, '-', error.message);
            
            return { success: false, type, metadata, error: error.message };
        }
    }

    /**
     * Log batch update results
     * @param {string} batchName - Name of the batch
     * @param {Array} results - Array of settled promises
     */
    logResults(batchName, results) {
        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failed = results.filter(r => r.status === 'rejected' || !r.value.success).length;
        
        console.log(`📊 ${batchName} update: ${successful} successful, ${failed} failed`);
    }

    /**
     * Get scheduler statistics
     * @returns {Object} - Scheduler statistics
     */
    getStats() {
        return {
            ...this.stats,
            isRunning: this.isRunning,
            configuration: {
                topHeadlinesInterval: `${this.config.topHeadlinesInterval / 60000} minutes`,
                popularSearchesInterval: `${this.config.popularSearchesInterval / 60000} minutes`,
                popularKeywords: this.config.popularKeywords,
                languages: this.config.languages
            }
        };
    }

    /**
     * Get scheduler configuration
     * @returns {Object} - Configuration object
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Update configuration
     * @param {Object} newConfig - New configuration values
     */
    updateConfig(newConfig) {
        this.config = {
            ...this.config,
            ...newConfig
        };
        
        console.log('⚙️ Scheduler configuration updated');
        
        // Restart scheduler if it's running
        if (this.isRunning) {
            console.log('🔄 Restarting scheduler with new configuration...');
            this.stop();
            this.start();
        }
    }

    /**
     * Add a custom keyword to popular searches
     * @param {string} keyword - Keyword to add
     */
    addPopularKeyword(keyword) {
        if (!this.config.popularKeywords.includes(keyword)) {
            this.config.popularKeywords.push(keyword);
            console.log(`➕ Added keyword to popular searches: ${keyword}`);
        }
    }

    /**
     * Remove a keyword from popular searches
     * @param {string} keyword - Keyword to remove
     */
    removePopularKeyword(keyword) {
        const index = this.config.popularKeywords.indexOf(keyword);
        if (index > -1) {
            this.config.popularKeywords.splice(index, 1);
            console.log(`➖ Removed keyword from popular searches: ${keyword}`);
        }
    }

    /**
     * Manually trigger cache update
     */
    async triggerUpdate() {
        console.log('🔄 Manually triggering cache update...');
        await this.updateAllCaches();
    }
}

// Create singleton instance
const schedulerService = new SchedulerService();

module.exports = schedulerService;
