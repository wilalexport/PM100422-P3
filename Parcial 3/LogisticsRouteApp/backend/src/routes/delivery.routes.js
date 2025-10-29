const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/delivery.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { validateCreateDelivery, validateDeliveryStop } = require('../middleware/validation.middleware');

// Delivery routes
router.post('/create', authMiddleware, validateCreateDelivery, deliveryController.createDelivery);
router.get('/', authMiddleware, deliveryController.getDeliveries);
router.get('/recent', authMiddleware, deliveryController.getRecentDeliveries);
router.get('/:id', authMiddleware, deliveryController.getDeliveryById);
router.post('/:id/start', authMiddleware, deliveryController.startDelivery);
router.post('/:id/complete-stop', authMiddleware, validateDeliveryStop, deliveryController.completeDeliveryStop);

module.exports = router;
