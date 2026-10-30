/**
 * Projects Router
 * GET /projects/:id/dashboard (Authenticated)
 * POST /projects/:id/updates (Authenticated, Authorized roles: admin, manager, site_engineer)
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/authorization');
const { getProjectDashboardData } = require('../services/projectService');
const { createOrUpdateDailyUpdate } = require('../services/updateService');

// GET /projects/:id/dashboard
router.get('/:id/dashboard', authenticateToken, async (req, res, next) => {
    try {
        const projectId = req.params.id;
        const refDateStr = req.query.date;
        const referenceDate = refDateStr ? new Date(refDateStr) : new Date();

        const dashboardData = await getProjectDashboardData(projectId, req.user.organizationId, referenceDate);
        if (!dashboardData) {
            return res.status(404).json({
                error: {
                    code: 'PROJECT_NOT_FOUND',
                    message: 'Project not found or does not belong to your organization'
                }
            });
        }

        res.status(200).json(dashboardData);
    } catch (err) {
        next(err);
    }
});

// POST /projects/:id/updates
router.post(
    '/:id/updates',
    authenticateToken,
    requireRoles('admin', 'manager', 'site_engineer'),
    async (req, res, next) => {
        try {
            const projectId = req.params.id;
            const { tradeId, date, progressPct, workersPresent, workersRequired, reason, notes } = req.body;

            const updatedRecord = await createOrUpdateDailyUpdate({
                projectId,
                tradeId,
                date,
                progressPct,
                workersPresent,
                workersRequired,
                reason,
                notes,
                user: req.user
            });

            res.status(200).json({
                status: 'success',
                data: updatedRecord
            });
        } catch (err) {
            next(err);
        }
    }
);

module.exports = router;
