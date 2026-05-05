/**
 * Article Interactions Model
 * Manages user interactions with articles (read, favorite)
 * In-memory storage (replace with database in production)
 */

// Store user article interactions
// Structure: { userId: { read: [articleIds], favorites: [articleIds], articles: { articleId: articleData } } }
const userArticleInteractions = new Map();

class ArticleModel {
    /**
     * Initialize user interactions if not exists
     * @param {number} userId - User ID
     */
    static initializeUser(userId) {
        if (!userArticleInteractions.has(userId)) {
            userArticleInteractions.set(userId, {
                read: [],
                favorites: [],
                articles: new Map() // Store article details
            });
        }
    }

    /**
     * Mark article as read
     * @param {number} userId - User ID
     * @param {string} articleId - Article ID
     * @param {Object} articleData - Article data to store
     * @returns {Object} - Updated interaction
     */
    static markAsRead(userId, articleId, articleData = {}) {
        this.initializeUser(userId);
        
        const userInteractions = userArticleInteractions.get(userId);
        
        // Add to read list if not already there
        if (!userInteractions.read.includes(articleId)) {
            userInteractions.read.push(articleId);
            
            // Store article data
            userInteractions.articles.set(articleId, {
                ...articleData,
                readAt: new Date().toISOString()
            });
        }

        return {
            articleId,
            read: true,
            readAt: userInteractions.articles.get(articleId)?.readAt
        };
    }

    /**
     * Mark article as favorite
     * @param {number} userId - User ID
     * @param {string} articleId - Article ID
     * @param {Object} articleData - Article data to store
     * @returns {Object} - Updated interaction
     */
    static markAsFavorite(userId, articleId, articleData = {}) {
        this.initializeUser(userId);
        
        const userInteractions = userArticleInteractions.get(userId);
        
        // Add to favorites if not already there
        if (!userInteractions.favorites.includes(articleId)) {
            userInteractions.favorites.push(articleId);
            
            // Store or update article data
            const existingArticle = userInteractions.articles.get(articleId);
            userInteractions.articles.set(articleId, {
                ...existingArticle,
                ...articleData,
                favoritedAt: new Date().toISOString()
            });
        }

        return {
            articleId,
            favorite: true,
            favoritedAt: userInteractions.articles.get(articleId)?.favoritedAt
        };
    }

    /**
     * Remove article from favorites
     * @param {number} userId - User ID
     * @param {string} articleId - Article ID
     * @returns {boolean} - Success status
     */
    static removeFavorite(userId, articleId) {
        this.initializeUser(userId);
        
        const userInteractions = userArticleInteractions.get(userId);
        const index = userInteractions.favorites.indexOf(articleId);
        
        if (index > -1) {
            userInteractions.favorites.splice(index, 1);
            
            // Update article data
            const article = userInteractions.articles.get(articleId);
            if (article) {
                delete article.favoritedAt;
            }
            
            return true;
        }
        
        return false;
    }

    /**
     * Get all read articles for user
     * @param {number} userId - User ID
     * @returns {Array} - Array of read articles
     */
    static getReadArticles(userId) {
        this.initializeUser(userId);
        
        const userInteractions = userArticleInteractions.get(userId);
        
        return userInteractions.read.map(articleId => {
            const article = userInteractions.articles.get(articleId);
            return {
                id: articleId,
                ...article,
                isRead: true,
                isFavorite: userInteractions.favorites.includes(articleId)
            };
        });
    }

    /**
     * Get all favorite articles for user
     * @param {number} userId - User ID
     * @returns {Array} - Array of favorite articles
     */
    static getFavoriteArticles(userId) {
        this.initializeUser(userId);
        
        const userInteractions = userArticleInteractions.get(userId);
        
        return userInteractions.favorites.map(articleId => {
            const article = userInteractions.articles.get(articleId);
            return {
                id: articleId,
                ...article,
                isRead: userInteractions.read.includes(articleId),
                isFavorite: true
            };
        });
    }

    /**
     * Check if article is read
     * @param {number} userId - User ID
     * @param {string} articleId - Article ID
     * @returns {boolean}
     */
    static isRead(userId, articleId) {
        this.initializeUser(userId);
        const userInteractions = userArticleInteractions.get(userId);
        return userInteractions.read.includes(articleId);
    }

    /**
     * Check if article is favorite
     * @param {number} userId - User ID
     * @param {string} articleId - Article ID
     * @returns {boolean}
     */
    static isFavorite(userId, articleId) {
        this.initializeUser(userId);
        const userInteractions = userArticleInteractions.get(userId);
        return userInteractions.favorites.includes(articleId);
    }

    /**
     * Get user interaction statistics
     * @param {number} userId - User ID
     * @returns {Object} - Statistics
     */
    static getUserStats(userId) {
        this.initializeUser(userId);
        
        const userInteractions = userArticleInteractions.get(userId);
        
        return {
            totalRead: userInteractions.read.length,
            totalFavorites: userInteractions.favorites.length,
            totalArticles: userInteractions.articles.size
        };
    }

    /**
     * Clear all interactions for a user
     * @param {number} userId - User ID
     */
    static clearUserInteractions(userId) {
        userArticleInteractions.delete(userId);
    }
}

module.exports = ArticleModel;
