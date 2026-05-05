const express = require('express');
const router = express.Router();
const SchedulerController = require('../controllers/schedulerController');
const verifyToken = require('../middleware/authMiddleware');

// All scheduler routes require authentication
router.use(verifyToken);

// GET /scheduler/stats - Get scheduler statistics
router.get('/stats', SchedulerController.getStats);

// GET /scheduler/config - Get scheduler configuration
router.get('/config', SchedulerController.getConfig);

// POST /scheduler/start - Start the scheduler
router.post('/start', SchedulerController.startScheduler);

// POST /scheduler/stop - Stop the scheduler
router.post('/stop', SchedulerController.stopScheduler);

// POST /scheduler/trigger - Manually trigger cache update
router.post('/trigger', SchedulerController.triggerUpdate);

// PUT /scheduler/config - Update scheduler configuration
router.put('/config', SchedulerController.updateConfig);

// POST /scheduler/keywords - Add popular keyword
router.post('/keywords', SchedulerController.addKeyword);

// DELETE /scheduler/keywords/:keyword - Remove popular keyword
router.delete('/keywords/:keyword', SchedulerController.removeKeyword);

module.exports = router;
