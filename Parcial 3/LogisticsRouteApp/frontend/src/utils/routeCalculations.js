/**
 * Calculate fuel savings based on optimized route vs non-optimized route
 * @param {number} optimizedDistance - Optimized route distance in meters
 * @param {number} nonOptimizedDistance - Non-optimized route distance in meters
 * @param {number} fuelEfficiency - Vehicle fuel efficiency in km/liter (default: 10)
 * @returns {number} - Fuel savings in liters
 */
export const calculateFuelSavings = (optimizedDistance, nonOptimizedDistance, fuelEfficiency = 10) => {
  // Convert distances to kilometers
  const optimizedDistanceKm = optimizedDistance / 1000;
  const nonOptimizedDistanceKm = nonOptimizedDistance / 1000;
  
  // Calculate fuel consumption for both routes
  const optimizedFuelConsumption = optimizedDistanceKm / fuelEfficiency;
  const nonOptimizedFuelConsumption = nonOptimizedDistanceKm / fuelEfficiency;
  
  // Calculate fuel savings
  return nonOptimizedFuelConsumption - optimizedFuelConsumption;
};

/**
 * Format a duration in seconds to a human-readable format
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Formatted duration (e.g. "1h 30m")
 */
export const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * Format a distance in meters to a human-readable format
 * @param {number} meters - Distance in meters
 * @returns {string} - Formatted distance (e.g. "1.5 km" or "500 m")
 */
export const formatDistance = (meters) => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
};
