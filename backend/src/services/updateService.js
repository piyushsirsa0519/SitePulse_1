/**
 * Site Pulse — Daily Update Service
 * Data access and orchestration for logging trade progress & workforce updates.
 * Enforces role authorization & organization isolation.
 */

const db = require('../db/client');
const { getFullProjectData } = require('./projectService');

async function createOrUpdateDailyUpdate({ projectId, tradeId, date, progressPct, workersPresent, workersRequired, reason, notes, user }) {
    // 1. Role Authorization Check (admin, manager, site_engineer)
    const allowedRoles = ['admin', 'manager', 'site_engineer'];
    if (!user || !allowedRoles.includes(user.role)) {
        const err = new Error(`User role '${user ? user.role : 'unauthenticated'}' does not have permission to submit daily updates`);
        err.code = 'FORBIDDEN';
        err.statusCode = 403;
        throw err;
    }

    // 2. Input Validation
    const prog = Number(progressPct);
    if (isNaN(prog) || prog < 0 || prog > 100) {
        const err = new Error('progressPct must be a number between 0 and 100');
        err.code = 'INVALID_INPUT';
        err.statusCode = 400;
        throw err;
    }

    const present = Number(workersPresent);
    if (isNaN(present) || present < 0) {
        const err = new Error('workersPresent must be a non-negative integer');
        err.code = 'INVALID_INPUT';
        err.statusCode = 400;
        throw err;
    }

    const required = Number(workersRequired);
    if (isNaN(required) || required < 0) {
        const err = new Error('workersRequired must be a non-negative integer');
        err.code = 'INVALID_INPUT';
        err.statusCode = 400;
        throw err;
    }

    if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const err = new Error('Invalid date format. Expected YYYY-MM-DD');
        err.code = 'INVALID_INPUT';
        err.statusCode = 400;
        throw err;
    }

    // Compare date string directly in YYYY-MM-DD format against local today date
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    if (date > todayStr) {
        const err = new Error('Daily update date cannot be in the future');
        err.code = 'FUTURE_DATE_REJECTED';
        err.statusCode = 400;
        throw err;
    }

    // 3. Organization Isolation: Verify project belongs to user's org
    const project = await getFullProjectData(projectId, user.organizationId);
    if (!project) {
        const err = new Error('Project not found or does not belong to user organization');
        err.code = 'PROJECT_NOT_FOUND';
        err.statusCode = 404;
        throw err;
    }

    // 4. Verify trade belongs to project
    const trade = project.trades.find(t => t.id === tradeId);
    if (!trade) {
        const err = new Error(`Trade '${tradeId}' not found in project '${projectId}'`);
        err.code = 'INVALID_TRADE';
        err.statusCode = 400;
        throw err;
    }

    const updateReason = reason || 'On Track';
    const updateNotes = notes || null;

    // 5. Execute UPSERT
    if (db.pool) {
        const updateId = `upd-${tradeId}-${date}`;
        const sql = `
            INSERT INTO daily_updates (id, trade_id, date, progress_pct, workers_present, workers_required, reason, notes, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (trade_id, date) DO UPDATE SET
                progress_pct = EXCLUDED.progress_pct,
                workers_present = EXCLUDED.workers_present,
                workers_required = EXCLUDED.workers_required,
                reason = EXCLUDED.reason,
                notes = EXCLUDED.notes,
                created_by = EXCLUDED.created_by,
                created_at = CURRENT_TIMESTAMP
            RETURNING *;
        `;
        const res = await db.query(sql, [
            updateId,
            tradeId,
            date,
            prog,
            present,
            required,
            updateReason,
            updateNotes,
            user.id
        ]);
        return res.rows[0];
    }

    // In-memory fallback
    let existingIndex = db.store.daily_updates.findIndex(u => u.trade_id === tradeId && u.date === date);
    const updateRecord = {
        id: existingIndex >= 0 ? db.store.daily_updates[existingIndex].id : `upd-${tradeId}-${date}`,
        trade_id: tradeId,
        date: date,
        progress_pct: prog,
        workers_present: present,
        workers_required: required,
        reason: updateReason,
        notes: updateNotes,
        created_by: user.id
    };

    if (existingIndex >= 0) {
        db.store.daily_updates[existingIndex] = updateRecord;
    } else {
        db.store.daily_updates.push(updateRecord);
    }

    return updateRecord;
}

module.exports = {
    createOrUpdateDailyUpdate
};
