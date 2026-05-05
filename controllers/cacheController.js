const cacheService = require('../services/cacheService');

class CacheController {
    /**
     * GET /cache/stats - Get cache statistics
     */
    static async getStats(req, res) {
        try {
            const stats = cacheService.getStats();

            res.status(200).json({
                success: true,
                message: 'Cache statistics retrieved successfully',
                data: stats
            });
        } catch (error) {
            console.error('Get cache stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while retrieving cache statistics'
            });
        }
    }

    /**
     * DELETE /cache - Clear all cache
     */
    static async clearCache(req, res) {
        try {
            await cacheService.clear();

            res.status(200).json({
                success: true,
                message: 'Cache cleared successfully'
            });
        } catch (error) {
            console.error('Clear cache error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while clearing cache'
            });
        }
    }

    /**
     * DELETE /cache/expired - Clear expired cache entries
     */
    static async clearExpired(req, res) {
        try {
            const cleared = await cacheService.clearExpired();

            res.status(200).json({
                success: true,
                message: `Cleared ${cleared} expired cache entries`,
                data: {
                    clearedCount: cleared
                }
            });
        } catch (error) {
            console.error('Clear expired cache error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while clearing expired cache'
            });
        }
    }

    /**
     * GET /cache/keys - Get all cache keys
     */
    static async getKeys(req, res) {
        try {
            const keys = cacheService.getKeys();

            res.status(200).json({
                success: true,
                message: 'Cache keys retrieved successfully',
                data: {
                    keys,
                    count: keys.length
                }
            });
        } catch (error) {
            console.error('Get cache keys error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while retrieving cache keys'
            });
        }
    }

    /**
     * GET /cache/info/:key - Get cache entry information
     */
    static async getKeyInfo(req, res) {
        try {
            const { key } = req.params;

            if (!key) {
                return res.status(400).json({
                    success: false,
                    message: 'Cache key is required'
                });
            }

            const info = await cacheService.getInfo(key);

            if (!info) {
                return res.status(404).json({
                    success: false,
                    message: 'Cache key not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Cache entry information retrieved successfully',
                data: info
            });
        } catch (error) {
            console.error('Get cache key info error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while retrieving cache key info'
            });
        }
    }

    /**
     * POST /cache/reset-stats - Reset cache statistics
     */
    static async resetStats(req, res) {
        try {
            cacheService.resetStats();

            res.status(200).json({
                success: true,
                message: 'Cache statistics reset successfully'
            });
        } catch (error) {
            console.error('Reset cache stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while resetting cache statistics'
            });
        }
    }
}

module.exports = CacheController;
