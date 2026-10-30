/**
 * Site Pulse — Database Client Module
 * Manages PostgreSQL connection via `pg` pool or fallback in-memory store.
 * FIX 2: Enforces fail-fast startup behavior in production if DATABASE_URL is missing.
 */

const { Pool } = require('pg');
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';
const databaseUrl = isProduction ? process.env.DATABASE_URL : (isTest ? (process.env.TEST_DATABASE_URL || null) : process.env.DATABASE_URL);

// Production Database Fail-Fast Check
if (isProduction && !databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required in production mode');
}

let pool = null;

if (databaseUrl) {
    pool = new Pool({
        connectionString: databaseUrl,
        ssl: isProduction ? { rejectUnauthorized: false } : false
    });
}

// In-memory fallback mock repository matching canonical seed data (development/test mode only)
const inMemoryStore = {
    organizations: [
        { id: 'org-apex-retail', name: 'Apex Retail Fitouts' }
    ],
    users: [
        { id: 'usr-admin-01',    supabase_auth_id: '11111111-1111-1111-1111-111111111111', organization_id: 'org-apex-retail', email: 'executive@apexfitouts.com', full_name: 'Executive Fitout Manager', role: 'admin' },
        { id: 'usr-engineer-01', supabase_auth_id: '22222222-2222-2222-2222-222222222222', organization_id: 'org-apex-retail', email: 'engineer@apexfitouts.com',  full_name: 'Site Engineer',            role: 'site_engineer' },
        { id: 'usr-viewer-01',   supabase_auth_id: '33333333-3333-3333-3333-333333333333', organization_id: 'org-apex-retail', email: 'viewer@apexfitouts.com',    full_name: 'Client Viewer',            role: 'viewer' },
        { id: 'usr-other-org-01', supabase_auth_id: '44444444-4444-4444-4444-444444444444', organization_id: 'org-other-corp',  email: 'other@othercorp.com',      full_name: 'Other Org User',           role: 'admin' }
    ],
    projects: [
        { id: 'prj-biryani-blues', organization_id: 'org-apex-retail', name: 'Biryani Blues - Gurugram', location: 'Gurugram', start_date: '2026-09-01', deadline: '2026-10-25', status: 'active' },
        { id: 'prj-chai-point',     organization_id: 'org-apex-retail', name: 'Cafe Chai Point - Delhi',     location: 'Delhi',    start_date: '2026-09-05', deadline: '2026-10-30', status: 'active' },
        { id: 'prj-ptal-homeware',  organization_id: 'org-apex-retail', name: 'P.TAL Homeware - Hyderabad', location: 'Hyderabad', start_date: '2026-09-10', deadline: '2026-11-15', status: 'active' },
        { id: 'prj-other-org',      organization_id: 'org-other-corp',  name: 'Secret Site - Mumbai',       location: 'Mumbai',   start_date: '2026-09-01', deadline: '2026-10-25', status: 'active' }
    ],
    trades: [
        // Biryani Blues
        { id: 'trd-bb-civil',      project_id: 'prj-biryani-blues', name: 'Civil',      planned_pct: 90, default_workers_required: 12 },
        { id: 'trd-bb-electrical', project_id: 'prj-biryani-blues', name: 'Electrical', planned_pct: 75, default_workers_required: 8 },
        { id: 'trd-bb-lighting',   project_id: 'prj-biryani-blues', name: 'Lighting',   planned_pct: 60, default_workers_required: 6 },
        { id: 'trd-bb-carpentry',  project_id: 'prj-biryani-blues', name: 'Carpentry',  planned_pct: 40, default_workers_required: 10 },
        { id: 'trd-bb-painting',   project_id: 'prj-biryani-blues', name: 'Painting',   planned_pct: 20, default_workers_required: 5 },

        // Cafe Chai Point
        { id: 'trd-cp-civil',      project_id: 'prj-chai-point', name: 'Civil',      planned_pct: 95, default_workers_required: 10 },
        { id: 'trd-cp-electrical', project_id: 'prj-chai-point', name: 'Electrical', planned_pct: 80, default_workers_required: 9 },
        { id: 'trd-cp-lighting',   project_id: 'prj-chai-point', name: 'Lighting',   planned_pct: 50, default_workers_required: 6 },
        { id: 'trd-cp-carpentry',  project_id: 'prj-chai-point', name: 'Carpentry',  planned_pct: 60, default_workers_required: 8 },
        { id: 'trd-cp-painting',   project_id: 'prj-chai-point', name: 'Painting',   planned_pct: 15, default_workers_required: 4 },

        // P.TAL Homeware
        { id: 'trd-pt-civil',      project_id: 'prj-ptal-homeware', name: 'Civil',      planned_pct: 70, default_workers_required: 14 },
        { id: 'trd-pt-electrical', project_id: 'prj-ptal-homeware', name: 'Electrical', planned_pct: 45, default_workers_required: 6 },
        { id: 'trd-pt-lighting',   project_id: 'prj-ptal-homeware', name: 'Lighting',   planned_pct: 25, default_workers_required: 4 },
        { id: 'trd-pt-carpentry',  project_id: 'prj-ptal-homeware', name: 'Carpentry',  planned_pct: 55, default_workers_required: 8 },
        { id: 'trd-pt-painting',   project_id: 'prj-ptal-homeware', name: 'Painting',   planned_pct: 10, default_workers_required: 3 }
    ],
    daily_updates: [
        // Biryani Blues updates
        { id: 'upd-bb-civil-01',      trade_id: 'trd-bb-civil',      date: '2026-10-01', progress_pct: 92, workers_present: 12, workers_required: 12, reason: 'On Track', created_by: 'usr-admin-01' },
        { id: 'upd-bb-electrical-01', trade_id: 'trd-bb-electrical', date: '2026-10-01', progress_pct: 75, workers_present: 8,  workers_required: 8,  reason: 'On Track', created_by: 'usr-admin-01' },
        { id: 'upd-bb-lighting-01',   trade_id: 'trd-bb-lighting',   date: '2026-10-01', progress_pct: 65, workers_present: 6,  workers_required: 6,  reason: 'On Track', created_by: 'usr-admin-01' },
        { id: 'upd-bb-carpentry-01',  trade_id: 'trd-bb-carpentry',  date: '2026-10-01', progress_pct: 42, workers_present: 10, workers_required: 10, reason: 'On Track', created_by: 'usr-admin-01' },
        { id: 'upd-bb-painting-01',   trade_id: 'trd-bb-painting',   date: '2026-10-01', progress_pct: 22, workers_present: 5,  workers_required: 5,  reason: 'On Track', created_by: 'usr-admin-01' },

        // Cafe Chai Point updates
        { id: 'upd-cp-civil-01',      trade_id: 'trd-cp-civil',      date: '2026-10-01', progress_pct: 95, workers_present: 10, workers_required: 10, reason: 'On Track',                 created_by: 'usr-admin-01' },
        { id: 'upd-cp-electrical-01', trade_id: 'trd-cp-electrical', date: '2026-10-01', progress_pct: 52, workers_present: 4,  workers_required: 9,  reason: 'Material Delay',           created_by: 'usr-admin-01' },
        { id: 'upd-cp-lighting-01',   trade_id: 'trd-cp-lighting',   date: '2026-10-01', progress_pct: 35, workers_present: 3,  workers_required: 6,  reason: 'Waiting on Another Trade', created_by: 'usr-admin-01' },
        { id: 'upd-cp-carpentry-01',  trade_id: 'trd-cp-carpentry',  date: '2026-10-01', progress_pct: 64, workers_present: 8,  workers_required: 8,  reason: 'On Track',                 created_by: 'usr-admin-01' },
        { id: 'upd-cp-painting-01',   trade_id: 'trd-cp-painting',   date: '2026-10-01', progress_pct: 15, workers_present: 4,  workers_required: 4,  reason: 'On Track',                 created_by: 'usr-admin-01' },

        // P.TAL Homeware updates
        { id: 'upd-pt-civil-01',      trade_id: 'trd-pt-civil',      date: '2026-10-01', progress_pct: 42, workers_present: 5,  workers_required: 14, reason: 'Labour Shortage',          created_by: 'usr-admin-01' },
        { id: 'upd-pt-electrical-01', trade_id: 'trd-pt-electrical', date: '2026-10-01', progress_pct: 45, workers_present: 6,  workers_required: 6,  reason: 'On Track',                 created_by: 'usr-admin-01' },
        { id: 'upd-pt-lighting-01',   trade_id: 'trd-pt-lighting',   date: '2026-10-01', progress_pct: 20, workers_present: 2,  workers_required: 4,  reason: 'Waiting on Another Trade', created_by: 'usr-admin-01' },
        { id: 'upd-pt-carpentry-01',  trade_id: 'trd-pt-carpentry',  date: '2026-10-01', progress_pct: 64, workers_present: 9,  workers_required: 8,  reason: 'On Track',                 created_by: 'usr-admin-01' },
        { id: 'upd-pt-painting-01',   trade_id: 'trd-pt-painting',   date: '2026-10-01', progress_pct: 10, workers_present: 3,  workers_required: 3,  reason: 'On Track',                 created_by: 'usr-admin-01' }
    ]
};

/**
 * Execute SQL query against Postgres pool if configured, or fall back to in-memory store.
 */
async function query(text, params = []) {
    if (pool) {
        return pool.query(text, params);
    }
    
    const sql = text.trim();

    if (sql.includes('FROM users WHERE supabase_auth_id =')) {
        const authId = params[0];
        const user = inMemoryStore.users.find(u => u.supabase_auth_id === authId);
        return { rows: user ? [user] : [] };
    }

    if (sql.includes('FROM users WHERE email =')) {
        const email = params[0];
        const user = inMemoryStore.users.find(u => u.email === email);
        return { rows: user ? [user] : [] };
    }

    if (sql.includes('FROM users WHERE id =')) {
        const id = params[0];
        const user = inMemoryStore.users.find(u => u.id === id);
        return { rows: user ? [user] : [] };
    }

    if (sql.includes('FROM organizations WHERE id =')) {
        const id = params[0];
        const org = inMemoryStore.organizations.find(o => o.id === id);
        return { rows: org ? [org] : [] };
    }

    if (sql.includes('FROM projects') && sql.includes('organization_id =')) {
        const orgId = params[0];
        let results = inMemoryStore.projects.filter(p => p.organization_id === orgId);
        if (params[1]) {
            results = results.filter(p => p.id === params[1]);
        }
        return { rows: results };
    }

    return { rows: [] };
}

module.exports = {
    pool,
    query,
    store: inMemoryStore
};
