const express = require('express');
const router = express.Router();
const routeOptimizationController = require('../controllers/routeOptimization.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { validateRouteOptimization } = require('../middleware/validation.middleware');

// Route optimization routes
router.post('/optimize', authMiddleware, validateRouteOptimization, routeOptimizationController.optimizeRoute);

module.exports = router;
