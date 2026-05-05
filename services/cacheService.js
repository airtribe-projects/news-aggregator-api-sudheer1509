/**
 * Cache Service
 * In-memory caching mechanism with TTL (Time To Live) support
 * Uses async/await for all operations to ensure consistency
 */

class CacheService {
    constructor() {
        // In-memory cache storage
        this.cache = new Map();
        // Default TTL: 5 minutes (300 seconds)
        this.defaultTTL = 300;
        // Cache statistics
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0
        };
    }

    /**
     * Generate cache key from parameters
     * @param {string} prefix - Key prefix
     * @param {Object} params - Parameters to include in key
     * @returns {string} - Cache key
     */
    generateKey(prefix, params = {}) {
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}:${JSON.stringify(params[key])}`)
            .join('|');
        return `${prefix}:${sortedParams}`;
    }

    /**
     * Set a value in cache with TTL
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttl - Time to live in seconds (default: 5 minutes)
     * @returns {Promise<boolean>} - Success status
     */
    async set(key, value, ttl = this.defaultTTL) {
        try {
            const expiresAt = Date.now() + (ttl * 1000);
            
            this.cache.set(key, {
                value,
                expiresAt,
                createdAt: Date.now()
            });

            this.stats.sets++;

            // Schedule automatic cleanup
            setTimeout(() => {
                this.delete(key);
            }, ttl * 1000);

            return true;
        } catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    }

    /**
     * Get a value from cache
     * @param {string} key - Cache key
     * @returns {Promise<any|null>} - Cached value or null if not found/expired
     */
    async get(key) {
        try {
            const cached = this.cache.get(key);

            if (!cached) {
                this.stats.misses++;
                return null;
            }

            // Check if cache entry has expired
            if (Date.now() > cached.expiresAt) {
                this.stats.misses++;
                await this.delete(key);
                return null;
            }

            this.stats.hits++;
            return cached.value;
        } catch (error) {
            console.error('Cache get error:', error);
            this.stats.misses++;
            return null;
        }
    }

    /**
     * Delete a value from cache
     * @param {string} key - Cache key
     * @returns {Promise<boolean>} - Success status
     */
    async delete(key) {
        try {
            const deleted = this.cache.delete(key);
            if (deleted) {
                this.stats.deletes++;
            }
            return deleted;
        } catch (error) {
            console.error('Cache delete error:', error);
            return false;
        }
    }

    /**
     * Check if key exists in cache and is not expired
     * @param {string} key - Cache key
     * @returns {Promise<boolean>} - True if exists and not expired
     */
    async has(key) {
        const value = await this.get(key);
        return value !== null;
    }

    /**
     * Clear all cache entries
     * @returns {Promise<void>}
     */
    async clear() {
        try {
            this.cache.clear();
            console.log('Cache cleared');
        } catch (error) {
            console.error('Cache clear error:', error);
        }
    }

    /**
     * Clear expired cache entries
     * @returns {Promise<number>} - Number of entries cleared
     */
    async clearExpired() {
        try {
            let cleared = 0;
            const now = Date.now();

            for (const [key, entry] of this.cache.entries()) {
                if (now > entry.expiresAt) {
                    await this.delete(key);
                    cleared++;
                }
            }

            if (cleared > 0) {
                console.log(`Cleared ${cleared} expired cache entries`);
            }

            return cleared;
        } catch (error) {
            console.error('Clear expired error:', error);
            return 0;
        }
    }

    /**
     * Get cache statistics
     * @returns {Object} - Cache statistics
     */
    getStats() {
        const hitRate = this.stats.hits + this.stats.misses > 0
            ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
            : 0;

        return {
            ...this.stats,
            size: this.cache.size,
            hitRate: `${hitRate}%`
        };
    }

    /**
     * Reset cache statistics
     */
    resetStats() {
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0
        };
    }

    /**
     * Get all cache keys
     * @returns {Array<string>} - Array of cache keys
     */
    getKeys() {
        return Array.from(this.cache.keys());
    }

    /**
     * Get cache entry information
     * @param {string} key - Cache key
     * @returns {Object|null} - Cache entry info or null
     */
    async getInfo(key) {
        const cached = this.cache.get(key);
        
        if (!cached) {
            return null;
        }

        const now = Date.now();
        const age = now - cached.createdAt;
        const ttl = cached.expiresAt - now;

        return {
            key,
            createdAt: new Date(cached.createdAt).toISOString(),
            expiresAt: new Date(cached.expiresAt).toISOString(),
            ageInSeconds: Math.floor(age / 1000),
            ttlInSeconds: Math.floor(ttl / 1000),
            isExpired: now > cached.expiresAt
        };
    }
}

// Create singleton instance
const cacheService = new CacheService();

// Schedule periodic cleanup of expired entries (every 10 minutes)
setInterval(async () => {
    await cacheService.clearExpired();
}, 10 * 60 * 1000);

module.exports = cacheService;
