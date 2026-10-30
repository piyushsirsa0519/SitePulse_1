/**
 * Site Pulse — Database Seed Runner
 * Seeds initial demo data into PostgreSQL database.
 */

const fs = require('fs');
const path = require('path');
const db = require('../src/db/client');

async function runSeed() {
    try {
        const seedSqlPath = path.join(__dirname, 'seed.sql');
        const sql = fs.readFileSync(seedSqlPath, 'utf8');
        
        console.log('🌱 Seeding database from backend/db/seed.sql...');
        await db.query(sql);
        console.log('✅ Database seeded successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed to seed database:', err);
        process.exit(1);
    }
}

runSeed();
