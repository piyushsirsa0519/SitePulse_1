/**
 * Authenticated User Profile Router
 * GET /me (Authenticated)
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getOrganizationById } = require('../services/userService');

router.get('/', authenticateToken, async (req, res, next) => {
    try {
        const org = await getOrganizationById(req.user.organizationId);

        res.status(200).json({
            user: {
                id: req.user.id,
                email: req.user.email,
                name: req.user.name,
                role: req.user.role
            },
            organization: {
                id: org ? org.id : req.user.organizationId,
                name: org ? org.name : 'Unknown Organization'
            }
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
