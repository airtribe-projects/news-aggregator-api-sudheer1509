const express = require('express');
const router = express.Router();
const CacheController = require('../controllers/cacheController');
const verifyToken = require('../middleware/authMiddleware');

// All cache management routes require authentication
router.use(verifyToken);

// GET /cache/stats - View cache statistics
router.get('/stats', CacheController.getStats);

// GET /cache/keys - Get all cache keys
router.get('/keys', CacheController.getKeys);

// GET /cache/info/:key - Get specific cache entry information
router.get('/info/:key', CacheController.getKeyInfo);

// DELETE /cache - Clear all cache
router.delete('/', CacheController.clearCache);

// DELETE /cache/expired - Clear expired cache entries
router.delete('/expired', CacheController.clearExpired);

// POST /cache/reset-stats - Reset cache statistics
router.post('/reset-stats', CacheController.resetStats);

module.exports = router;
