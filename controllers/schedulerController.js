const schedulerService = require('../services/schedulerService');

class SchedulerController {
    /**
     * GET /scheduler/stats - Get scheduler statistics
     */
    static async getStats(req, res) {
        try {
            const stats = schedulerService.getStats();

            res.status(200).json({
                success: true,
                message: 'Scheduler statistics retrieved successfully',
                data: stats
            });
        } catch (error) {
            console.error('Get scheduler stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while retrieving scheduler statistics'
            });
        }
    }

    /**
     * POST /scheduler/start - Start the scheduler
     */
    static async startScheduler(req, res) {
        try {
            await schedulerService.start();

            res.status(200).json({
                success: true,
                message: 'Scheduler started successfully'
            });
        } catch (error) {
            console.error('Start scheduler error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while starting scheduler',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * POST /scheduler/stop - Stop the scheduler
     */
    static async stopScheduler(req, res) {
        try {
            schedulerService.stop();

            res.status(200).json({
                success: true,
                message: 'Scheduler stopped successfully'
            });
        } catch (error) {
            console.error('Stop scheduler error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while stopping scheduler'
            });
        }
    }

    /**
     * POST /scheduler/trigger - Manually trigger cache update
     */
    static async triggerUpdate(req, res) {
        try {
            // Run update in background
            schedulerService.triggerUpdate().catch(err => {
                console.error('Background update error:', err);
            });

            res.status(202).json({
                success: true,
                message: 'Cache update triggered and running in background'
            });
        } catch (error) {
            console.error('Trigger update error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while triggering update'
            });
        }
    }

    /**
     * GET /scheduler/config - Get scheduler configuration
     */
    static async getConfig(req, res) {
        try {
            const config = schedulerService.getConfig();

            res.status(200).json({
                success: true,
                message: 'Scheduler configuration retrieved successfully',
                data: config
            });
        } catch (error) {
            console.error('Get config error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while retrieving configuration'
            });
        }
    }

    /**
     * PUT /scheduler/config - Update scheduler configuration
     */
    static async updateConfig(req, res) {
        try {
            const { 
                topHeadlinesInterval, 
                popularSearchesInterval, 
                popularKeywords,
                languages 
            } = req.body;

            const newConfig = {};

            if (topHeadlinesInterval) {
                if (typeof topHeadlinesInterval !== 'number' || topHeadlinesInterval < 60000) {
                    return res.status(400).json({
                        success: false,
                        message: 'topHeadlinesInterval must be a number >= 60000 (1 minute)'
                    });
                }
                newConfig.topHeadlinesInterval = topHeadlinesInterval;
            }

            if (popularSearchesInterval) {
                if (typeof popularSearchesInterval !== 'number' || popularSearchesInterval < 60000) {
                    return res.status(400).json({
                        success: false,
                        message: 'popularSearchesInterval must be a number >= 60000 (1 minute)'
                    });
                }
                newConfig.popularSearchesInterval = popularSearchesInterval;
            }

            if (popularKeywords) {
                if (!Array.isArray(popularKeywords)) {
                    return res.status(400).json({
                        success: false,
                        message: 'popularKeywords must be an array'
                    });
                }
                newConfig.popularKeywords = popularKeywords;
            }

            if (languages) {
                if (!Array.isArray(languages)) {
                    return res.status(400).json({
                        success: false,
                        message: 'languages must be an array'
                    });
                }
                newConfig.languages = languages;
            }

            schedulerService.updateConfig(newConfig);

            res.status(200).json({
                success: true,
                message: 'Scheduler configuration updated successfully',
                data: schedulerService.getConfig()
            });
        } catch (error) {
            console.error('Update config error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while updating configuration',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * POST /scheduler/keywords - Add popular keyword
     */
    static async addKeyword(req, res) {
        try {
            const { keyword } = req.body;

            if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid keyword is required'
                });
            }

            schedulerService.addPopularKeyword(keyword.trim());

            res.status(200).json({
                success: true,
                message: 'Keyword added to popular searches',
                data: {
                    keyword: keyword.trim(),
                    popularKeywords: schedulerService.getConfig().popularKeywords
                }
            });
        } catch (error) {
            console.error('Add keyword error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while adding keyword'
            });
        }
    }

    /**
     * DELETE /scheduler/keywords/:keyword - Remove popular keyword
     */
    static async removeKeyword(req, res) {
        try {
            const { keyword } = req.params;

            if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid keyword is required'
                });
            }

            schedulerService.removePopularKeyword(keyword.trim());

            res.status(200).json({
                success: true,
                message: 'Keyword removed from popular searches',
                data: {
                    keyword: keyword.trim(),
                    popularKeywords: schedulerService.getConfig().popularKeywords
                }
            });
        } catch (error) {
            console.error('Remove keyword error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while removing keyword'
            });
        }
    }
}

module.exports = SchedulerController;
