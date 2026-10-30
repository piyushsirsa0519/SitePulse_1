/**
 * Site Pulse — Project Service
 * Data access and orchestration for projects & dashboard analytics.
 * Strictly enforces organization isolation.
 */

const db = require('../db/client');
const {
    calculateProjectMetrics,
    getProjectBottleneck,
    calculateProjectedCompletion,
    getRecommendation
} = require('../analytics/index');

/**
 * Loads project and trades with latest daily update data, scoped by organization_id.
 */
async function getFullProjectData(projectId, orgId) {
    if (db.pool) {
        const projRes = await db.query(
            'SELECT * FROM projects WHERE id = $1 AND organization_id = $2',
            [projectId, orgId]
        );
        if (projRes.rows.length === 0) return null;

        const projectRow = projRes.rows[0];

        const tradesRes = await db.query(
            'SELECT * FROM trades WHERE project_id = $1',
            [projectId]
        );

        const tradeIds = tradesRes.rows.map(t => t.id);

        let updatesMap = {};
        if (tradeIds.length > 0) {
            const updatesRes = await db.query(
                `SELECT DISTINCT ON (trade_id) * 
                 FROM daily_updates 
                 WHERE trade_id = ANY($1) 
                 ORDER BY trade_id, date DESC`,
                [tradeIds]
            );
            updatesRes.rows.forEach(u => {
                updatesMap[u.trade_id] = u;
            });
        }

        const trades = tradesRes.rows.map(t => {
            const upd = updatesMap[t.id];
            return {
                id: t.id,
                name: t.name,
                planned_pct: Number(t.planned_pct) || 0,
                progress_pct: upd ? Number(upd.progress_pct) : 0,
                workers_present: upd ? Number(upd.workers_present) : 0,
                workers_required: upd ? Number(upd.workers_required) : Number(t.default_workers_required) || 0,
                reason: upd ? upd.reason : 'On Track'
            };
        });

        return {
            id: projectRow.id,
            name: projectRow.name,
            location: projectRow.location,
            city: projectRow.location,
            startDate: projectRow.start_date,
            start_date: projectRow.start_date,
            deadline: projectRow.deadline,
            status: projectRow.status,
            organization_id: projectRow.organization_id,
            trades: trades
        };
    }

    // In-memory fallback
    const projectRow = db.store.projects.find(p => p.id === projectId && p.organization_id === orgId);
    if (!projectRow) return null;

    const trades = db.store.trades
        .filter(t => t.project_id === projectId)
        .map(t => {
            // Find latest update
            const upd = db.store.daily_updates
                .filter(u => u.trade_id === t.id)
                .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

            return {
                id: t.id,
                name: t.name,
                planned: t.planned_pct ?? t.planned,
                planned_pct: t.planned_pct ?? t.planned,
                actual: upd ? upd.progress_pct : (t.actual ?? 0),
                progress_pct: upd ? upd.progress_pct : (t.actual ?? 0),
                workersPresent: upd ? upd.workers_present : (t.workersPresent ?? 0),
                workers_present: upd ? upd.workers_present : (t.workersPresent ?? 0),
                workersRequired: upd ? upd.workers_required : (t.workersRequired ?? t.default_workers_required),
                workers_required: upd ? upd.workers_required : (t.workersRequired ?? t.default_workers_required),
                reason: upd ? upd.reason : 'On Track'
            };
        });

    return {
        id: projectRow.id,
        name: projectRow.name,
        location: projectRow.location,
        city: projectRow.location,
        startDate: projectRow.start_date || projectRow.startDate,
        deadline: projectRow.deadline,
        status: projectRow.status,
        organization_id: projectRow.organization_id,
        trades: trades
    };
}

/**
 * Generates project dashboard analysis response scoped by organization.
 */
async function getProjectDashboardData(projectId, orgId, referenceDate = new Date()) {
    const fullProject = await getFullProjectData(projectId, orgId);
    if (!fullProject) return null;

    const metrics = calculateProjectMetrics(fullProject, referenceDate);
    const bottleneck = getProjectBottleneck(fullProject);
    const forecast = calculateProjectedCompletion(fullProject, referenceDate);
    const recommendation = getRecommendation(fullProject, referenceDate);

    return {
        project: {
            id: fullProject.id,
            name: fullProject.name,
            location: fullProject.location,
            startDate: fullProject.startDate,
            deadline: fullProject.deadline,
            status: fullProject.status
        },
        metrics,
        trades: fullProject.trades,
        bottleneck,
        forecast,
        recommendation
    };
}

module.exports = {
    getFullProjectData,
    getProjectDashboardData
};
