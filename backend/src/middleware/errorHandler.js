/**
 * Site Pulse — Centralized Error Handler Middleware
 * Formats all backend API errors consistently.
 */

function errorHandler(err, req, res, next) {
    const statusCode = err.statusCode || err.status || 500;
    const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
    const message = err.message || 'An unexpected internal server error occurred';

    res.status(statusCode).json({
        error: {
            code: errorCode,
            message: message
        }
    });
}

module.exports = errorHandler;
