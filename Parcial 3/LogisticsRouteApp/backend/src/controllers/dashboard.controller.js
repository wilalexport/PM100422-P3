const { Delivery, DeliveryDestination, FuelSavingHistory, User, sequelize } = require('../models');
const { handleError } = require('../utils/errorHandler');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// Get dashboard summary data
exports.getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get today's deliveries
    const todayDeliveries = await Delivery.count({
      where: {
        userId,
        createdAt: {
          [Op.gte]: today
        }
      }
    });
    
    // Get pending deliveries
    const pendingDeliveries = await Delivery.count({
      where: {
        userId,
        status: 'pending'
      }
    });
    
    // Get completed deliveries
    const completedDeliveries = await Delivery.count({
      where: {
        userId,
        status: 'completed'
      }
    });
    
    // Get total fuel saved
    const fuelSavings = await FuelSavingHistory.findAll({
      where: { userId },
      attributes: [
        [sequelize.fn('sum', sequelize.col('fuelSaved')), 'totalFuelSaved']
      ]
    });
    
    const fuelSaved = fuelSavings[0].dataValues.totalFuelSaved || 0;
    
    res.status(200).json({
      todayDeliveries,
      pendingDeliveries,
      completedDeliveries,
      fuelSaved
    });
  } catch (error) {
    handleError(res, error);
  }
};
