/**
 * Site Pulse — Express Application Setup
 */

const express = require('express');
const healthRouter = require('./routes/health');
const meRouter = require('./routes/me');
const portfolioRouter = require('./routes/portfolio');
const projectsRouter = require('./routes/projects');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Body Parser Middleware
app.use(express.json());

// CORS Middleware
app.use((req, res, next) => {
    const origin = req.headers.origin;
    const isProduction = process.env.NODE_ENV === 'production';
    const allowedOrigin = process.env.CORS_ORIGIN;

    if (isProduction) {
        if (allowedOrigin && origin === allowedOrigin) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Vary', 'Origin');
        }
        // In production mode without CORS_ORIGIN or for unapproved origins, no Access-Control-Allow-Origin header is emitted
    } else {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

// Mount Root API Info Route
app.get('/', (req, res) => {
    res.status(200).json({
        name: 'Site Pulse API',
        status: 'ok'
    });
});

// Mount API Routes
app.use('/health', healthRouter);
app.use('/me', meRouter);
app.use('/portfolio', portfolioRouter);
app.use('/projects', projectsRouter);

// 404 Unhandled Route Handler
app.use((req, res) => {
    res.status(404).json({
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.url} not found`
        }
    });
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
