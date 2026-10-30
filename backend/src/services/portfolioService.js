/**
 * Site Pulse — Portfolio Service
 * Data access and orchestration for portfolio risk aggregation.
 * Strictly enforces organization isolation.
 */

const db = require('../db/client');
const { getFullProjectData } = require('./projectService');
const { calculatePortfolioRisk } = require('../analytics/index');

async function getPortfolioData(orgId, referenceDate = new Date()) {
    let projectIds = [];

    if (db.pool) {
        const res = await db.query(
            'SELECT id FROM projects WHERE organization_id = $1 AND status = $2',
            [orgId, 'active']
        );
        projectIds = res.rows.map(r => r.id);
    } else {
        projectIds = db.store.projects
            .filter(p => p.organization_id === orgId && p.status === 'active')
            .map(p => p.id);
    }

    const fullProjects = [];
    for (const pid of projectIds) {
        const p = await getFullProjectData(pid, orgId);
        if (p) fullProjects.push(p);
    }

    const portfolioRiskData = calculatePortfolioRisk(fullProjects, referenceDate);
    return portfolioRiskData;
}

module.exports = {
    getPortfolioData
};
