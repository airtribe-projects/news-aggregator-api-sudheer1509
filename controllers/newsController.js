const NewsService = require('../services/newsService');
const UserModel = require('../models/userModel');
const ArticleModel = require('../models/articleModel');
const ValidationUtils = require('../utils/validation');

class NewsController {
    static async getNews(req, res) {
        try {
            // Get user from authenticated request
            const userId = req.user.id;
            
            // Fetch user to get their preferences
            const user = UserModel.findById(userId);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Get query parameters for pagination and filtering
            const {
                page = 1,
                pageSize = 20,
                language = 'en',
                sortBy = 'publishedAt'
            } = req.query;

            // Validate pagination parameters using ValidationUtils
            const paginationValidation = ValidationUtils.validatePagination(page, pageSize);
            
            if (!paginationValidation.valid) {
                return res.status(400).json({
                    success: false,
                    message: paginationValidation.message,
                    errors: { field: 'pagination' }
                });
            }

            const pageNum = paginationValidation.page;
            const pageSizeNum = paginationValidation.pageSize;

            // Validate language parameter (optional)
            if (language && typeof language !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Language must be a string',
                    errors: { field: 'language' }
                });
            }

            // Validate sortBy parameter
            const validSortOptions = ['relevancy', 'popularity', 'publishedAt'];
            if (sortBy && !validSortOptions.includes(sortBy)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid sortBy value. Must be one of: ${validSortOptions.join(', ')}`,
                    errors: { field: 'sortBy' }
                });
            }

            // Fetch news based on user preferences
            const newsData = await NewsService.fetchNewsByPreferences(
                user.preferences,
                {
                    page: pageNum,
                    pageSize: pageSizeNum,
                    language,
                    sortBy
                }
            );

            // Return flat response for tests
            res.status(200).json({
                news: newsData.articles
            });
        } catch (error) {
            console.error('Get news error:', error.message, error.stack);

            // Handle specific error messages from NewsService
            if (error.message.includes('NEWS_API_KEY') || error.message.includes('not configured')) {
                return res.status(500).json({
                    success: false,
                    message: 'News service is not properly configured',
                    error: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }

            if (error.message.includes('Invalid NewsAPI key')) {
                return res.status(500).json({
                    success: false,
                    message: 'Invalid news API configuration',
                    error: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }

            if (error.message.includes('rate limit') || error.message.includes('429')) {
                return res.status(429).json({
                    success: false,
                    message: 'News API rate limit exceeded. Please try again later.'
                });
            }

            if (error.message.includes('timeout')) {
                return res.status(504).json({
                    success: false,
                    message: 'Request timeout. Please try again.'
                });
            }

            if (error.message.includes('Unable to reach') || error.message.includes('Network error') || error.message.includes('internet connection')) {
                return res.status(503).json({
                    success: false,
                    message: 'Unable to fetch news at this time. Please check your connection and try again.'
                });
            }

            if (error.message.includes('upgrade required')) {
                return res.status(402).json({
                    success: false,
                    message: 'News API subscription upgrade required'
                });
            }

            // Generic error with safe message
            res.status(500).json({
                success: false,
                message: 'Internal server error while fetching news',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * POST /news/:id/read - Mark article as read
     */
    static async markAsRead(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            // Validate article ID
            if (!id || typeof id !== 'string' || id.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid article ID is required',
                    errors: { field: 'id' }
                });
            }

            // Get article data from request body (optional)
            const articleData = req.body.article || {};

            // Mark as read
            const result = ArticleModel.markAsRead(userId, id, articleData);

            res.status(200).json({
                success: true,
                message: 'Article marked as read',
                data: result
            });
        } catch (error) {
            console.error('Mark as read error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while marking article as read',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * POST /news/:id/favorite - Mark article as favorite
     */
    static async markAsFavorite(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            // Validate article ID
            if (!id || typeof id !== 'string' || id.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid article ID is required',
                    errors: { field: 'id' }
                });
            }

            // Get article data from request body (optional)
            const articleData = req.body.article || {};

            // Mark as favorite
            const result = ArticleModel.markAsFavorite(userId, id, articleData);

            res.status(200).json({
                success: true,
                message: 'Article marked as favorite',
                data: result
            });
        } catch (error) {
            console.error('Mark as favorite error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while marking article as favorite',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * DELETE /news/:id/favorite - Remove article from favorites
     */
    static async removeFavorite(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            // Validate article ID
            if (!id || typeof id !== 'string' || id.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid article ID is required',
                    errors: { field: 'id' }
                });
            }

            // Remove from favorites
            const removed = ArticleModel.removeFavorite(userId, id);

            if (!removed) {
                return res.status(404).json({
                    success: false,
                    message: 'Article not found in favorites'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Article removed from favorites',
                data: {
                    articleId: id,
                    favorite: false
                }
            });
        } catch (error) {
            console.error('Remove favorite error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while removing article from favorites',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * GET /news/read - Get all read articles
     */
    static async getReadArticles(req, res) {
        try {
            const userId = req.user.id;

            // Get read articles
            const readArticles = ArticleModel.getReadArticles(userId);

            res.status(200).json({
                success: true,
                message: 'Read articles retrieved successfully',
                data: {
                    articles: readArticles,
                    count: readArticles.length
                }
            });
        } catch (error) {
            console.error('Get read articles error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while retrieving read articles',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * GET /news/favorites - Get all favorite articles
     */
    static async getFavoriteArticles(req, res) {
        try {
            const userId = req.user.id;

            // Get favorite articles
            const favoriteArticles = ArticleModel.getFavoriteArticles(userId);

            res.status(200).json({
                success: true,
                message: 'Favorite articles retrieved successfully',
                data: {
                    articles: favoriteArticles,
                    count: favoriteArticles.length
                }
            });
        } catch (error) {
            console.error('Get favorite articles error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while retrieving favorite articles',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * GET /news/stats - Get user article interaction statistics
     */
    static async getUserStats(req, res) {
        try {
            const userId = req.user.id;

            // Get statistics
            const stats = ArticleModel.getUserStats(userId);

            res.status(200).json({
                success: true,
                message: 'User statistics retrieved successfully',
                data: stats
            });
        } catch (error) {
            console.error('Get user stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while retrieving user statistics',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * GET /news/search/:keyword - Search news articles by keyword
     */
    static async searchNews(req, res) {
        try {
            const { keyword } = req.params;

            // Validate keyword
            if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid search keyword is required',
                    errors: { field: 'keyword' }
                });
            }

            // Validate keyword length
            if (keyword.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'Search keyword must be at least 2 characters long',
                    errors: { field: 'keyword' }
                });
            }

            if (keyword.trim().length > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Search keyword must not exceed 100 characters',
                    errors: { field: 'keyword' }
                });
            }

            // Get query parameters for pagination and filtering
            const {
                page = 1,
                pageSize = 20,
                language = 'en',
                sortBy = 'publishedAt'
            } = req.query;

            // Validate pagination parameters
            const paginationValidation = ValidationUtils.validatePagination(page, pageSize);
            
            if (!paginationValidation.valid) {
                return res.status(400).json({
                    success: false,
                    message: paginationValidation.message,
                    errors: { field: 'pagination' }
                });
            }

            const pageNum = paginationValidation.page;
            const pageSizeNum = paginationValidation.pageSize;

            // Validate sortBy parameter
            const validSortOptions = ['relevancy', 'popularity', 'publishedAt'];
            if (sortBy && !validSortOptions.includes(sortBy)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid sortBy value. Must be one of: ${validSortOptions.join(', ')}`,
                    errors: { field: 'sortBy' }
                });
            }

            // Search news
            const newsData = await NewsService.searchNews(keyword, {
                page: pageNum,
                pageSize: pageSizeNum,
                language,
                sortBy
            });

            res.status(200).json({
                success: true,
                message: newsData.cached 
                    ? 'Search results fetched from cache' 
                    : 'Search results fetched successfully',
                data: {
                    articles: newsData.articles,
                    totalResults: newsData.totalResults,
                    page: newsData.page,
                    pageSize: newsData.pageSize,
                    keyword: newsData.keyword,
                    cached: newsData.cached || false,
                    cacheTime: newsData.cacheTime
                }
            });
        } catch (error) {
            console.error('Search news error:', error.message);

            // Handle specific error messages
            if (error.message.includes('keyword is required')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            if (error.message.includes('NEWS_API_KEY') || error.message.includes('not configured')) {
                return res.status(500).json({
                    success: false,
                    message: 'News service is not properly configured',
                    error: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }

            if (error.message.includes('rate limit')) {
                return res.status(429).json({
                    success: false,
                    message: 'News API rate limit exceeded. Please try again later.'
                });
            }

            if (error.message.includes('timeout')) {
                return res.status(504).json({
                    success: false,
                    message: 'Request timeout. Please try again.'
                });
            }

            if (error.message.includes('Unable to reach') || error.message.includes('Network error')) {
                return res.status(503).json({
                    success: false,
                    message: 'Unable to fetch news at this time. Please try again later.'
                });
            }

            // Generic error
            res.status(500).json({
                success: false,
                message: 'Internal server error while searching news',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

module.exports = NewsController;
