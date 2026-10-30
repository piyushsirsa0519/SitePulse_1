/**
 * Site Pulse — User & Organization Service
 * Data access and orchestration for users and organizations.
 * Stable Supabase Auth Identity Mapping via supabase_auth_id (UUID).
 */

const db = require('../db/client');

async function getUserBySupabaseAuthId(authId) {
    if (!authId) return null;
    
    if (db.pool) {
        const res = await db.query('SELECT * FROM users WHERE supabase_auth_id = $1', [authId]);
        return res.rows[0] || null;
    }
    
    // In-memory fallback (development/test mode)
    const user = db.store.users.find(u => u.supabase_auth_id === authId);
    return user || null;
}

async function getUserByEmail(email) {
    if (!email) return null;
    
    if (db.pool) {
        const res = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        return res.rows[0] || null;
    }
    
    const user = db.store.users.find(u => u.email === email);
    return user || null;
}

async function getUserById(id) {
    if (!id) return null;
    
    if (db.pool) {
        const res = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        return res.rows[0] || null;
    }
    
    const user = db.store.users.find(u => u.id === id);
    return user || null;
}

async function getOrganizationById(orgId) {
    if (!orgId) return null;
    
    if (db.pool) {
        const res = await db.query('SELECT * FROM organizations WHERE id = $1', [orgId]);
        return res.rows[0] || null;
    }
    
    const org = db.store.organizations.find(o => o.id === orgId);
    return org || null;
}

module.exports = {
    getUserBySupabaseAuthId,
    getUserByEmail,
    getUserById,
    getOrganizationById
};
