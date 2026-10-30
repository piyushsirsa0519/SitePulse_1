/**
 * Site Pulse — Backend HTTP Server Entry Point
 */

require('dotenv').config();
const app = require('./app');

const db = require('./db/client');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`⚡ Site Pulse Backend API listening on port ${PORT}`);
});

const gracefulShutdown = (signal) => {
    console.log(`\n⚠️ Received ${signal}. Shutting down Site Pulse API server gracefully...`);
    server.close(async () => {
        console.log('HTTP server closed.');
        if (db.pool) {
            try {
                await db.pool.end();
                console.log('PostgreSQL connection pool closed.');
            } catch (err) {
                console.error('Error closing database pool:', err);
            }
        }
        process.exit(0);
    });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
