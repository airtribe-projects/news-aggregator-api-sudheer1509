const express = require('express');
const router = express.Router();
const NewsController = require('../controllers/newsController');
const verifyToken = require('../middleware/authMiddleware');

// All news routes require authentication
router.use(verifyToken);

// GET /news - Fetch news based on logged-in user's preferences
router.get('/', NewsController.getNews);

// GET /news/read - Get all read articles (must be before /:id routes)
router.get('/read', NewsController.getReadArticles);

// GET /news/favorites - Get all favorite articles (must be before /:id routes)
router.get('/favorites', NewsController.getFavoriteArticles);

// GET /news/stats - Get user article statistics
router.get('/stats', NewsController.getUserStats);

// GET /news/search/:keyword - Search news by keyword (must be before /:id routes)
router.get('/search/:keyword', NewsController.searchNews);

// POST /news/:id/read - Mark article as read
router.post('/:id/read', NewsController.markAsRead);

// POST /news/:id/favorite - Mark article as favorite
router.post('/:id/favorite', NewsController.markAsFavorite);

// DELETE /news/:id/favorite - Remove article from favorites
router.delete('/:id/favorite', NewsController.removeFavorite);

module.exports = router;
