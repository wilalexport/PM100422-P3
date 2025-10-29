const { Delivery, DeliveryDestination, FuelSavingHistory, User } = require('../models');
const { calculateOptimizedRoute } = require('../services/routeOptimizationService');
const { handleError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

// Optimize route based on origin and destinations
exports.optimizeRoute = async (req, res) => {
  try {
    const { origin, destinations } = req.body;
    const userId = req.user.id;
    
    if (!origin || !destinations || !Array.isArray(destinations) || destinations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Origin and at least one destination are required'
      });
    }
    
    // Call route optimization service
    const result = await calculateOptimizedRoute(origin, destinations);
    
    res.status(200).json({
      success: true,
      optimizedRoute: result.optimizedRoute,
      totalDistance: result.totalDistance,
      totalDuration: result.totalDuration,
      nonOptimizedDistance: result.nonOptimizedDistance
    });
  } catch (error) {
    handleError(res, error);
  }
};
