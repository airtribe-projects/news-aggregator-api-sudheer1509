/**
 * Async handler wrapper to catch errors in async route handlers
 * Eliminates the need for try-catch in every async route
 * @param {Function} fn - Async route handler function
 * @returns {Function} - Express middleware function
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Global error handler middleware
 * Catches all errors and sends appropriate responses
 */
const errorHandler = (err, req, res, next) => {
    console.error('Error Handler:', err.message, err.stack);

    // Authentication errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid authentication token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Authentication token has expired'
        });
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: err.errors
        });
    }

    // Axios/Network errors
    if (err.isAxiosError) {
        if (err.response) {
            return res.status(err.response.status || 500).json({
                success: false,
                message: 'External API error',
                details: process.env.NODE_ENV === 'development' ? err.response.data : undefined
            });
        } else if (err.request) {
            return res.status(503).json({
                success: false,
                message: 'Unable to reach external service'
            });
        }
    }

    // Handle errors with status code
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';

    res.status(statusCode).json({
        success: false,
        message: message,
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

/**
 * 404 handler for undefined routes
 */
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`
    });
};

module.exports = {
    asyncHandler,
    errorHandler,
    notFoundHandler
};
