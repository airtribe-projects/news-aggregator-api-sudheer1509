require('dotenv').config();
const express = require('express');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const newsRoutes = require('./routes/newsRoutes');
const cacheRoutes = require('./routes/cacheRoutes');
const schedulerRoutes = require('./routes/schedulerRoutes');
const schedulerService = require('./services/schedulerService');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth routes (public) - includes /users/signup and /users/login
app.use('/', authRoutes);

// User routes (protected) - includes /users/preferences
app.use('/users', userRoutes);

// News routes (protected) - includes /news
app.use('/news', newsRoutes);

// Cache management routes (protected)
app.use('/api/v1/cache', cacheRoutes);

// Scheduler management routes (protected)
app.use('/api/v1/scheduler', schedulerRoutes);

// 404 handler for undefined routes (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Only start server if this file is run directly (not when required for tests)
if (require.main === module) {
    app.listen(port, (err) => {
        if (err) {
            return console.log('Something bad happened', err);
        }
        console.log(`Server is listening on ${port}`);
        
        // Auto-start the background scheduler
        console.log('');
        schedulerService.start().catch(error => {
            console.error('Failed to start scheduler:', error);
        });
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('SIGTERM signal received: closing HTTP server');
        schedulerService.stop();
        process.exit(0);
    });

    process.on('SIGINT', () => {
        console.log('SIGINT signal received: closing HTTP server');
        schedulerService.stop();
        process.exit(0);
    });
}

module.exports = app;