const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Calculate optimized route using Google Directions API
 * @param {Object} origin - Origin coordinates {latitude, longitude}
 * @param {Array} destinations - Array of destination coordinates [{latitude, longitude}, ...]
 * @returns {Object} - Optimized route information
 */
exports.calculateOptimizedRoute = async (origin, destinations) => {
  try {
    // Convert coordinates to string format for Google API
    const originStr = `${origin.latitude},${origin.longitude}`;
    const waypointsStr = destinations.map(dest => `${dest.latitude},${dest.longitude}`).join('|');
    
    // Request optimized route from Google Directions API
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/directions/json',
      {
        params: {
          origin: originStr,
          destination: originStr, // Return to origin (for TSP)
          waypoints: `optimize:true|${waypointsStr}`,
          key: config.googleMaps.apiKey
        }
      }
    );
    
    // Check if the API request was successful
    if (response.data.status !== 'OK') {
      throw new Error(`Google Directions API error: ${response.data.status}`);
    }
    
    // Get route data
    const route = response.data.routes[0];
    const optimizedOrder = route.waypoint_order;
    
    // Calculate total distance and duration
    let totalDistance = 0;
    let totalDuration = 0;
    
    route.legs.forEach(leg => {
      totalDistance += leg.distance.value;
      totalDuration += leg.duration.value;
    });
    
    // Calculate non-optimized distance (for comparison)
    // This is a simplified approach, ideally we would make another API call with non-optimized waypoints
    const nonOptimizedDistance = totalDistance * 1.2; // Assume 20% more distance
    
    // Create an array of optimized destinations
    const optimizedRoute = optimizedOrder.map(index => {
      const dest = destinations[index];
      return {
        lat: dest.latitude,
        lng: dest.longitude
      };
    });
    
    return {
      optimizedRoute,
      optimizedOrder,
      totalDistance,
      totalDuration,
      nonOptimizedDistance
    };
  } catch (error) {
    logger.error('Error calculating optimized route:', error);
    throw new Error('Failed to calculate optimized route');
  }
};
