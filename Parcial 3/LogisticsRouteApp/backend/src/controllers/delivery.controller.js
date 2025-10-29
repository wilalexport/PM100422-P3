const { Delivery, DeliveryDestination, FuelSavingHistory, User, sequelize } = require('../models');
const { handleError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

// Create a new delivery with optimized route
exports.createDelivery = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { origin, destinations, routeInfo } = req.body;
    const userId = req.user.id;
    
    // Validate required data
    if (!origin || !destinations || !Array.isArray(destinations) || destinations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Origin and at least one destination are required'
      });
    }
    
    // Create delivery record
    const delivery = await Delivery.create({
      userId,
      status: 'pending',
      originLat: origin.latitude,
      originLng: origin.longitude,
      totalDistance: routeInfo.totalDistance,
      totalDuration: routeInfo.totalDuration,
      nonOptimizedDistance: routeInfo.totalDistance * 1.2, // Estimated non-optimized distance
    }, { transaction });
    
    // Create delivery destinations
    const destinationPromises = destinations.map(dest => {
      return DeliveryDestination.create({
        deliveryId: delivery.id,
        address: dest.address,
        lat: dest.coordinates.latitude,
        lng: dest.coordinates.longitude,
        optimizedOrder: dest.optimizedOrder,
        completed: false
      }, { transaction });
    });
    
    await Promise.all(destinationPromises);
    
    // Create fuel saving record
    await FuelSavingHistory.create({
      userId,
      deliveryId: delivery.id,
      optimizedDistance: routeInfo.totalDistance,
      nonOptimizedDistance: routeInfo.totalDistance * 1.2, // Estimated non-optimized distance
      fuelSaved: routeInfo.fuelSavings,
      fuelPrice: null, // Can be updated later
      moneySaved: null // Can be calculated later
    }, { transaction });
    
    await transaction.commit();
    
    res.status(201).json({
      success: true,
      message: 'Delivery created successfully',
      id: delivery.id
    });
  } catch (error) {
    await transaction.rollback();
    handleError(res, error);
  }
};

// Get all deliveries for a user
exports.getDeliveries = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;
    
    const whereClause = { userId };
    
    if (status) {
      whereClause.status = status;
    }
    
    const deliveries = await Delivery.findAll({
      where: whereClause,
      include: [
        {
          model: DeliveryDestination,
          as: 'destinations',
          attributes: ['id', 'address', 'lat', 'lng', 'optimizedOrder', 'completed', 'completedAt']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      deliveries: deliveries.map(delivery => ({
        id: delivery.id,
        status: delivery.status,
        createdAt: delivery.createdAt,
        startTime: delivery.startTime,
        completionTime: delivery.completionTime,
        origin: {
          latitude: delivery.originLat,
          longitude: delivery.originLng
        },
        destinations: delivery.destinations.map(dest => ({
          id: dest.id,
          address: dest.address,
          coordinates: {
            latitude: dest.lat,
            longitude: dest.lng
          },
          optimizedOrder: dest.optimizedOrder,
          completed: dest.completed,
          completedAt: dest.completedAt
        })),
        routeInfo: {
          totalDistance: delivery.totalDistance,
          totalDuration: delivery.totalDuration,
          fuelSavings: (delivery.nonOptimizedDistance - delivery.totalDistance) / 10000 // Rough estimate
        }
      }))
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Get recent deliveries for dashboard
exports.getRecentDeliveries = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const deliveries = await Delivery.findAll({
      where: { userId },
      include: [
        {
          model: DeliveryDestination,
          as: 'destinations',
          attributes: ['id', 'address', 'lat', 'lng', 'optimizedOrder', 'completed', 'completedAt']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });
    
    res.status(200).json(
      deliveries.map(delivery => ({
        id: delivery.id,
        status: delivery.status,
        createdAt: delivery.createdAt,
        startTime: delivery.startTime,
        completionTime: delivery.completionTime,
        origin: {
          latitude: delivery.originLat,
          longitude: delivery.originLng
        },
        destinations: delivery.destinations.map(dest => ({
          id: dest.id,
          address: dest.address,
          coordinates: {
            latitude: dest.lat,
            longitude: dest.lng
          },
          optimizedOrder: dest.optimizedOrder,
          completed: dest.completed,
          completedAt: dest.completedAt
        })),
        routeInfo: {
          totalDistance: delivery.totalDistance,
          totalDuration: delivery.totalDuration,
          fuelSavings: (delivery.nonOptimizedDistance - delivery.totalDistance) / 10000 // Rough estimate
        }
      }))
    );
  } catch (error) {
    handleError(res, error);
  }
};

// Get a specific delivery
exports.getDeliveryById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const delivery = await Delivery.findOne({
      where: { id, userId },
      include: [
        {
          model: DeliveryDestination,
          as: 'destinations',
          attributes: ['id', 'address', 'lat', 'lng', 'optimizedOrder', 'completed', 'completedAt']
        }
      ]
    });
    
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }
    
    res.status(200).json({
      id: delivery.id,
      status: delivery.status,
      createdAt: delivery.createdAt,
      startTime: delivery.startTime,
      completionTime: delivery.completionTime,
      origin: {
        latitude: delivery.originLat,
        longitude: delivery.originLng
      },
      destinations: delivery.destinations.map(dest => ({
        id: dest.id,
        address: dest.address,
        coordinates: {
          latitude: dest.lat,
          longitude: dest.lng
        },
        optimizedOrder: dest.optimizedOrder,
        completed: dest.completed,
        completedAt: dest.completedAt
      })),
      routeInfo: {
        totalDistance: delivery.totalDistance,
        totalDuration: delivery.totalDuration,
        fuelSavings: (delivery.nonOptimizedDistance - delivery.totalDistance) / 10000 // Rough estimate
      }
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Start a delivery
exports.startDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const delivery = await Delivery.findOne({
      where: { id, userId }
    });
    
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }
    
    if (delivery.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Delivery has already been started or completed'
      });
    }
    
    await delivery.startDelivery();
    
    res.status(200).json({
      success: true,
      message: 'Delivery started successfully'
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Complete a delivery stop
exports.completeDeliveryStop = async (req, res) => {
  try {
    const { id } = req.params;
    const { destinationId } = req.body;
    const userId = req.user.id;
    
    const delivery = await Delivery.findOne({
      where: { id, userId },
      include: [
        {
          model: DeliveryDestination,
          as: 'destinations'
        }
      ]
    });
    
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }
    
    if (delivery.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Delivery is not in progress'
      });
    }
    
    const destination = delivery.destinations.find(dest => dest.id === destinationId);
    
    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found'
      });
    }
    
    await destination.markAsCompleted();
    
    // Check if all destinations are completed
    const allCompleted = await DeliveryDestination.findAll({
      where: { deliveryId: id, completed: false }
    });
    
    if (allCompleted.length === 0) {
      await delivery.completeDelivery();
    }
    
    res.status(200).json({
      success: true,
      message: 'Delivery stop completed successfully',
      allCompleted: allCompleted.length === 0
    });
  } catch (error) {
    handleError(res, error);
  }
};
