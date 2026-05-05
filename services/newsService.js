const axios = require('axios');
const cacheService = require('./cacheService');

// NewsAPI configuration
const NEWS_API_BASE_URL = 'https://newsapi.org/v2';
const NEWS_API_KEY = process.env.NEWS_API_KEY;
// Cache TTL: 5 minutes (300 seconds) for news articles
const CACHE_TTL = 300;

class NewsService {
    static async fetchNewsByPreferences(preferences = [], options = {}) {
        try {
            // Validate API key
            if (!NEWS_API_KEY) {
                throw new Error('NEWS_API_KEY is not configured in environment variables');
            }

            // Validate and sanitize inputs
            if (!Array.isArray(preferences)) {
                preferences = [];
            }

            const {
                page = 1,
                pageSize = 20,
                language = 'en',
                sortBy = 'publishedAt'
            } = options;

            // Validate numeric parameters
            const validPage = Math.max(1, parseInt(page) || 1);
            const validPageSize = Math.min(100, Math.max(1, parseInt(pageSize) || 20));

            // Generate cache key based on request parameters
            const cacheKey = cacheService.generateKey('news', {
                preferences: preferences.sort(), // Sort for consistent key
                page: validPage,
                pageSize: validPageSize,
                language,
                sortBy
            });

            // Try to get from cache
            const cachedData = await cacheService.get(cacheKey);
            if (cachedData) {
                console.log('Cache HIT for key:', cacheKey);
                return {
                    ...cachedData,
                    cached: true,
                    cacheTime: new Date().toISOString()
                };
            }

            console.log('Cache MISS for key:', cacheKey);

            // If user has preferences, use them as keywords
            // Otherwise, fetch top headlines
            let newsData;
            
            if (preferences.length > 0) {
                // Filter out empty/invalid preferences and join as search query
                const validPreferences = preferences.filter(p => p && typeof p === 'string' && p.trim());
                
                if (validPreferences.length === 0) {
                    // Fall back to top headlines if no valid preferences
                    newsData = await this.fetchTopHeadlines({ page: validPage, pageSize: validPageSize, language });
                } else {
                    const query = validPreferences.join(' OR ');
                    
                    const response = await axios.get(`${NEWS_API_BASE_URL}/everything`, {
                        params: {
                            q: query,
                            language,
                            sortBy,
                            page: validPage,
                            pageSize: validPageSize,
                            apiKey: NEWS_API_KEY
                        },
                        timeout: 10000, // 10 second timeout
                        validateStatus: (status) => status < 500 // Don't throw for 4xx errors
                    });

                    // Validate response structure
                    if (!response.data || !Array.isArray(response.data.articles)) {
                        throw new Error('Invalid response format from NewsAPI');
                    }

                    newsData = {
                        success: true,
                        totalResults: response.data.totalResults || 0,
                        articles: response.data.articles || [],
                        page: validPage,
                        pageSize: validPageSize
                    };
                }
            } else {
                // Fetch top headlines if no preferences
                newsData = await this.fetchTopHeadlines({ page: validPage, pageSize: validPageSize, language });
            }

            // Store in cache
            await cacheService.set(cacheKey, newsData, CACHE_TTL);

            return {
                ...newsData,
                cached: false
            };
        } catch (error) {
            console.error('NewsService error:', error.message);
            
            // Handle different types of errors
            if (error.response) {
                // NewsAPI returned an error response
                const status = error.response.status;
                const message = error.response.data?.message || 'NewsAPI error';

                if (status === 401) {
                    throw new Error('Invalid NewsAPI key');
                } else if (status === 426) {
                    throw new Error('NewsAPI upgrade required');
                } else if (status === 429) {
                    throw new Error('NewsAPI rate limit exceeded');
                } else if (status === 500) {
                    throw new Error('NewsAPI server error');
                } else if (status >= 400 && status < 500) {
                    throw new Error(`NewsAPI client error: ${message}`);
                } else if (status >= 500) {
                    throw new Error(`NewsAPI server error: ${message}`);
                } else {
                    throw new Error(`NewsAPI error: ${message}`);
                }
            } else if (error.request) {
                // Request was made but no response received
                if (error.code === 'ECONNABORTED') {
                    throw new Error('NewsAPI request timeout. Please try again.');
                } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                    throw new Error('Unable to reach NewsAPI. Please check your internet connection.');
                } else {
                    throw new Error('Network error while fetching news.');
                }
            } else {
                // Something else went wrong (configuration, etc.)
                throw new Error(error.message || 'Unexpected error while fetching news');
            }
        }
    }

    /**
     * Helper method to fetch top headlines
     * @private
     */
    static async fetchTopHeadlines(options = {}) {
        const { page = 1, pageSize = 20, language = 'en' } = options;

        // Generate cache key for top headlines
        const cacheKey = cacheService.generateKey('top-headlines', {
            page,
            pageSize,
            language
        });

        // Try to get from cache
        const cachedData = await cacheService.get(cacheKey);
        if (cachedData) {
            console.log('Cache HIT for top headlines:', cacheKey);
            return {
                ...cachedData,
                cached: true,
                cacheTime: new Date().toISOString()
            };
        }

        console.log('Cache MISS for top headlines:', cacheKey);

        const response = await axios.get(`${NEWS_API_BASE_URL}/top-headlines`, {
            params: {
                language,
                page,
                pageSize,
                apiKey: NEWS_API_KEY
            },
            timeout: 10000,
            validateStatus: (status) => status < 500
        });

        // Validate response structure
        if (!response.data || !Array.isArray(response.data.articles)) {
            throw new Error('Invalid response format from NewsAPI');
        }

        const newsData = {
            success: true,
            totalResults: response.data.totalResults || 0,
            articles: response.data.articles || [],
            page,
            pageSize
        };

        // Store in cache
        await cacheService.set(cacheKey, newsData, CACHE_TTL);

        return {
            ...newsData,
            cached: false
        };
    }

    /**
     * Search news articles by keyword
     * @param {string} keyword - Search keyword
     * @param {Object} options - Additional options (page, pageSize, language, sortBy)
     * @returns {Promise} - News articles matching the keyword
     */
    static async searchNews(keyword, options = {}) {
        try {
            // Validate API key
            if (!NEWS_API_KEY) {
                throw new Error('NEWS_API_KEY is not configured in environment variables');
            }

            // Validate keyword
            if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
                throw new Error('Valid search keyword is required');
            }

            const sanitizedKeyword = keyword.trim();

            const {
                page = 1,
                pageSize = 20,
                language = 'en',
                sortBy = 'publishedAt'
            } = options;

            // Validate numeric parameters
            const validPage = Math.max(1, parseInt(page) || 1);
            const validPageSize = Math.min(100, Math.max(1, parseInt(pageSize) || 20));

            // Generate cache key for search
            const cacheKey = cacheService.generateKey('search', {
                keyword: sanitizedKeyword.toLowerCase(),
                page: validPage,
                pageSize: validPageSize,
                language,
                sortBy
            });

            // Try to get from cache
            const cachedData = await cacheService.get(cacheKey);
            if (cachedData) {
                console.log('Cache HIT for search:', cacheKey);
                return {
                    ...cachedData,
                    cached: true,
                    cacheTime: new Date().toISOString()
                };
            }

            console.log('Cache MISS for search:', cacheKey);

            // Fetch from NewsAPI
            const response = await axios.get(`${NEWS_API_BASE_URL}/everything`, {
                params: {
                    q: sanitizedKeyword,
                    language,
                    sortBy,
                    page: validPage,
                    pageSize: validPageSize,
                    apiKey: NEWS_API_KEY
                },
                timeout: 10000,
                validateStatus: (status) => status < 500
            });

            // Validate response structure
            if (!response.data || !Array.isArray(response.data.articles)) {
                throw new Error('Invalid response format from NewsAPI');
            }

            const newsData = {
                success: true,
                totalResults: response.data.totalResults || 0,
                articles: response.data.articles || [],
                page: validPage,
                pageSize: validPageSize,
                keyword: sanitizedKeyword
            };

            // Store in cache
            await cacheService.set(cacheKey, newsData, CACHE_TTL);

            return {
                ...newsData,
                cached: false
            };
        } catch (error) {
            console.error('Search news error:', error.message);
            
            // Handle different types of errors
            if (error.response) {
                const status = error.response.status;
                const message = error.response.data?.message || 'NewsAPI error';

                if (status === 401) {
                    throw new Error('Invalid NewsAPI key');
                } else if (status === 426) {
                    throw new Error('NewsAPI upgrade required');
                } else if (status === 429) {
                    throw new Error('NewsAPI rate limit exceeded');
                } else if (status === 500) {
                    throw new Error('NewsAPI server error');
                } else if (status >= 400 && status < 500) {
                    throw new Error(`NewsAPI client error: ${message}`);
                } else if (status >= 500) {
                    throw new Error(`NewsAPI server error: ${message}`);
                } else {
                    throw new Error(`NewsAPI error: ${message}`);
                }
            } else if (error.request) {
                if (error.code === 'ECONNABORTED') {
                    throw new Error('NewsAPI request timeout. Please try again.');
                } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                    throw new Error('Unable to reach NewsAPI. Please check your internet connection.');
                } else {
                    throw new Error('Network error while fetching news.');
                }
            } else {
                throw new Error(error.message || 'Unexpected error while searching news');
            }
        }
    }
}

module.exports = NewsService;
