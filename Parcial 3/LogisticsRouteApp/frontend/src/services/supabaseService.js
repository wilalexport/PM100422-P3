import { supabase } from '../Libs/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import bcrypt from 'bcryptjs';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ==================== Gemini AI Configuration ====================
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ==================== Authentication Services ====================

/**
 * Register a new user with email and password (with hashing)
 */
export const registerUser = async (email, password, fullName, phoneNumber) => {
  try {
    // Hash password before storing
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone_number: phoneNumber,
        },
        emailRedirectTo: undefined, // We'll verify with OTP
      },
    });

    if (authError) {
      // Handle specific errors
      if (authError.message?.includes('Email rate limit exceeded')) {
        throw new Error('Has excedido el límite de registros. Por favor intenta más tarde.');
      }
      if (authError.message?.includes('User already registered')) {
        throw new Error('Este correo ya está registrado. Intenta iniciar sesión.');
      }
      throw authError;
    }

    // Create user profile in users table with hashed password
    if (authData.user) {
      const { data: insertedData, error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email: email,
            full_name: fullName,
            phone_number: phoneNumber,
            password_hash: passwordHash,
          },
        ])
        .select();

      if (profileError) {
        // Delete the auth user since profile creation failed
        await supabase.auth.admin.deleteUser(authData.user.id).catch(() => {});
        
        throw new Error(`Error al crear perfil de usuario: ${profileError.message || 'Verifica los permisos de la tabla'}`);
      }
    }

    return { success: true, user: authData.user };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: error.message || 'Error al registrar usuario' };
  }
};

/**
 * Validate password and send OTP to user's email for login
 */
export const loginWithEmail = async (email, password) => {
  try {
    // Normalize email (trim and lowercase)
    const normalizedEmail = email.trim().toLowerCase();
    
    // Now get user's hashed password from database
    // Use ilike for case-insensitive search
    const { data: usersData, error: userError } = await supabase
      .from('users')
      .select('id, password_hash, email, created_at')
      .ilike('email', normalizedEmail)
      .order('created_at', { ascending: false });

    if (userError || !usersData || usersData.length === 0) {
      // Try exact match as fallback
      const { data: exactMatch } = await supabase
        .from('users')
        .select('id, password_hash, email, created_at')
        .eq('email', normalizedEmail)
        .order('created_at', { ascending: false });
      
      if (!exactMatch || exactMatch.length === 0) {
        throw new Error('Este correo no está registrado. Por favor regístrate primero.');
      }
      
      // Use exact match result
      usersData = exactMatch;
    }

    // Take the most recent user (first in the ordered list)
    const userData = usersData[0];

    // Check if password_hash is valid
    if (!userData.password_hash || userData.password_hash === 'RESET_REQUIRED') {
      throw new Error('Este usuario necesita establecer una contraseña. Por favor regístrate nuevamente.');
    }

    // Validate password
    const isValidPassword = await bcrypt.compare(password, userData.password_hash);
    
    if (!isValidPassword) {
      throw new Error('Contraseña incorrecta. Por favor intenta nuevamente.');
    }

    // Password is correct, now send OTP
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false, // Only allow existing users to login
      },
    });

    if (error) {
      // Handle specific errors
      if (error.message?.includes('Email rate limit exceeded')) {
        throw new Error('Has excedido el límite de intentos. Por favor intenta más tarde.');
      }
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message || 'Error al iniciar sesión' };
  }
};

/**
 * Verify OTP code
 */
export const verifyOTP = async (email, token) => {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) throw error;

    // Store session
    if (data.session) {
      await AsyncStorage.setItem('userToken', data.session.access_token);
      await AsyncStorage.setItem('userId', data.user.id);
    }

    return { success: true, session: data.session, user: data.user };
  } catch (error) {
    console.error('OTP verification error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Logout user
 */
export const logout = async () => {
  try {
    await supabase.auth.signOut();
    await AsyncStorage.multiRemove(['userToken', 'userId']);
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get current user session
 */
export const getCurrentUser = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    
    // Return user directly, not wrapped in success object
    return session?.user || null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

// ==================== User Profile Services ====================

/**
 * Get user profile
 */
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    // Return profile directly
    return data;
  } catch (error) {
    console.error('Get profile error:', error);
    return null;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, profile: data };
  } catch (error) {
    console.error('Update profile error:', error);
    return { success: false, error: error.message };
  }
};

// ==================== Delivery Services ====================

/**
 * Create a new delivery
 */
export const createDelivery = async (deliveryData) => {
  try {
    const { data, error } = await supabase
      .from('deliveries')
      .insert([deliveryData])
      .select()
      .single();

    if (error) throw error;

    return { success: true, delivery: data };
  } catch (error) {
    console.error('Create delivery error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get deliveries for a user
 */
export const getUserDeliveries = async (userId, status = null) => {
  try {
    let query = supabase
      .from('deliveries')
      .select('*, delivery_destinations(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, deliveries: data };
  } catch (error) {
    console.error('Get deliveries error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Add destinations to a delivery
 */
export const addDeliveryDestinations = async (deliveryId, destinations) => {
  try {
    const destinationsWithDeliveryId = destinations.map((dest) => ({
      ...dest,
      delivery_id: deliveryId,
    }));

    const { data, error } = await supabase
      .from('delivery_destinations')
      .insert(destinationsWithDeliveryId)
      .select();

    if (error) throw error;

    return { success: true, destinations: data };
  } catch (error) {
    console.error('Add destinations error:', error);
    return { success: false, error: error.message };
  }
};

// ==================== Route Optimization Services ====================

/**
 * Create optimized route and save fuel savings
 */
export const optimizeRoute = async (userId, startLocation, destinations, vehicleEfficiency = 10) => {
  try {
    if (!destinations || destinations.length === 0) {
      throw new Error('No hay destinos para optimizar');
    }

    // STEP 1: Use Distance Matrix API to get real distances between all points
    // Build matrix of all destinations
    const allLocations = [startLocation, ...destinations];
    const locationsStr = allLocations
      .map(loc => `${loc.latitude},${loc.longitude}`)
      .join('|');

    // Get distance matrix for all points
    const matrixUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${locationsStr}&destinations=${locationsStr}&mode=driving&departure_time=now&traffic_model=best_guess&key=${GOOGLE_MAPS_API_KEY}`;

    const matrixResponse = await fetch(matrixUrl);
    const matrixData = await matrixResponse.json();

    if (matrixData.status !== 'OK') {
      throw new Error(`Distance Matrix API error: ${matrixData.status}`);
    }

    // STEP 2: Apply Nearest Neighbor algorithm
    const unvisited = destinations.map((_, index) => index);
    const optimizedOrder = [];
    let currentLocationIndex = 0; // Start from origin (index 0 in allLocations)

    while (unvisited.length > 0) {
      let nearestIndex = -1;
      let shortestDistance = Infinity;

      // Find nearest unvisited destination
      unvisited.forEach(destIndex => {
        const actualDestIndex = destIndex + 1; // +1 because destinations start at index 1 in allLocations
        const element = matrixData.rows[currentLocationIndex].elements[actualDestIndex];

        if (element.status === 'OK') {
          const distance = element.distance.value; // meters
          
          if (distance < shortestDistance) {
            shortestDistance = distance;
            nearestIndex = destIndex;
          }
        }
      });

      if (nearestIndex === -1) {
        // No valid route found, just take first unvisited
        nearestIndex = unvisited[0];
      }

      optimizedOrder.push(nearestIndex);
      currentLocationIndex = nearestIndex + 1; // Update current position
      unvisited.splice(unvisited.indexOf(nearestIndex), 1);
    }

    // Reorder destinations based on optimized order
    const optimizedDestinations = optimizedOrder.map(index => destinations[index]);

    // STEP 3: Get actual route with Directions API using optimized order
    const waypoints = optimizedDestinations
      .map(dest => `${dest.latitude},${dest.longitude}`)
      .join('|');

    const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${startLocation.latitude},${startLocation.longitude}&destination=${startLocation.latitude},${startLocation.longitude}&waypoints=${waypoints}&mode=driving&departure_time=now&traffic_model=best_guess&key=${GOOGLE_MAPS_API_KEY}`;

    const directionsResponse = await fetch(directionsUrl);
    const directionsData = await directionsResponse.json();

    if (directionsData.status !== 'OK') {
      throw new Error(`Directions API error: ${directionsData.status}`);
    }

    const route = directionsData.routes[0];
    const legs = route.legs;

    // Calculate total distance and duration
    let totalDistance = 0;
    let totalDuration = 0;
    legs.forEach(leg => {
      totalDistance += leg.distance.value; // meters
      totalDuration += leg.duration.value; // seconds
    });

    // Create delivery record with optimized data
    const { data: delivery, error: deliveryError } = await supabase
      .from('deliveries')
      .insert([
        {
          user_id: userId,
          start_latitude: startLocation.latitude,
          start_longitude: startLocation.longitude,
          start_address: startLocation.address,
          total_distance: totalDistance,
          estimated_duration: totalDuration,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (deliveryError) throw deliveryError;

    // Add destinations with optimized order
    const destinationData = optimizedDestinations.map((dest, index) => ({
      delivery_id: delivery.id,
      latitude: dest.latitude,
      longitude: dest.longitude,
      address: dest.address,
      order_number: index + 1,
      status: 'pending',
    }));

    const { error: destError } = await supabase
      .from('delivery_destinations')
      .insert(destinationData);

    if (destError) throw destError;

    // Calculate fuel savings (comparing optimized vs non-optimized)
    // Assume non-optimized would be 15% longer
    const originalDistance = totalDistance * 1.15;
    const distanceSaved = originalDistance - totalDistance;
    const fuelSaved = (distanceSaved / 1000) / vehicleEfficiency; // liters
    const costSaved = fuelSaved * 4.5; // $4.50 per gallon average

    const { data: savingsData, error: savingsError } = await supabase
      .from('fuel_saving_history')
      .insert([
        {
          user_id: userId,
          delivery_id: delivery.id,
          original_distance: originalDistance,
          optimized_distance: totalDistance,
          fuel_saved: fuelSaved,
          cost_saved: costSaved,
        },
      ])
      .select()
      .single();

    if (savingsError) {
      console.error('Savings record error:', savingsError);
      // Don't fail the whole operation if savings record fails
    }

    // Extract polyline for route visualization
    const overviewPolyline = route.overview_polyline.points;

    return {
      success: true,
      delivery: {
        ...delivery,
        optimized_order: optimizedOrder,
        polyline: overviewPolyline,
      },
      optimizedDestinations,
      savings: savingsData,
    };
  } catch (error) {
    console.error('Route optimization error:', error);
    return { success: false, error: error.message };
  }
};

// ==================== Dashboard Services ====================

/**
 * Get dashboard summary statistics
 */
export const getDashboardStats = async (userId) => {
  try {
    // Get total deliveries
    const { count: totalDeliveries, error: deliveriesError } = await supabase
      .from('deliveries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (deliveriesError) throw deliveriesError;

    // Get completed deliveries
    const { count: completedDeliveries, error: completedError } = await supabase
      .from('deliveries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (completedError) throw completedError;

    // Get pending deliveries
    const { count: pendingDeliveries, error: pendingError } = await supabase
      .from('deliveries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (pendingError) throw pendingError;

    // Get total savings
    const { data: savingsData, error: savingsError } = await supabase
      .from('fuel_saving_history')
      .select('fuel_saved, cost_saved')
      .eq('user_id', userId);

    if (savingsError) throw savingsError;

    const totalFuelSaved = savingsData.reduce((sum, record) => sum + (record.fuel_saved || 0), 0);
    const totalCostSaved = savingsData.reduce((sum, record) => sum + (record.cost_saved || 0), 0);

    return {
      todayDeliveries: 0, // TODO: Calculate today's deliveries
      totalDeliveries: totalDeliveries || 0,
      completedDeliveries: completedDeliveries || 0,
      pendingDeliveries: pendingDeliveries || 0,
      fuelSaved: parseFloat(totalFuelSaved.toFixed(2)) || 0,
      costSaved: parseFloat(totalCostSaved.toFixed(2)) || 0,
    };
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return {
      todayDeliveries: 0,
      totalDeliveries: 0,
      completedDeliveries: 0,
      pendingDeliveries: 0,
      fuelSaved: 0,
      costSaved: 0,
    };
  }
};

/**
 * Get fuel savings history
 */
export const getFuelSavingsHistory = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('fuel_saving_history')
      .select('*, deliveries(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, history: data };
  } catch (error) {
    console.error('Get fuel savings history error:', error);
    return { success: false, error: error.message };
  }
};

// ==================== Google Maps Integration ====================

export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

/**
 * Geocode an address to coordinates OR reverse geocode coordinates to address
 */
export const geocodeAddress = async (addressOrLat, longitude = null) => {
  try {
    let url;
    
    // If longitude is provided, do reverse geocoding (coordinates to address)
    if (longitude !== null) {
      url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${addressOrLat},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
    } else {
      // Regular geocoding (address to coordinates)
      url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        addressOrLat
      )}&key=${GOOGLE_MAPS_API_KEY}`;
    }
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      const formattedAddress = data.results[0].formatted_address;
      
      if (longitude !== null) {
        // Return address for reverse geocoding
        return formattedAddress;
      } else {
        // Return coordinates for regular geocoding
        return {
          success: true,
          coordinates: {
            latitude: location.lat,
            longitude: location.lng,
          },
          address: formattedAddress,
        };
      }
    }

    return longitude !== null ? 'Ubicación desconocida' : { success: false, error: 'Address not found' };
  } catch (error) {
    console.error('Geocoding error:', error);
    return longitude !== null ? 'Error al obtener dirección' : { success: false, error: error.message };
  }
};

/**
 * Get directions between multiple points
 */
export const getDirections = async (origin, waypoints, destination) => {
  try {
    const waypointsStr = waypoints
      .map((wp) => `${wp.latitude},${wp.longitude}`)
      .join('|');

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&waypoints=optimize:true|${waypointsStr}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK') {
      return { success: true, routes: data.routes };
    }

    return { success: false, error: data.status };
  } catch (error) {
    console.error('Directions error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Optimize route order using Google Distance Matrix API
 * Returns optimized order of destinations considering real distances and traffic
 */
export const optimizeRouteOrder = async (origin, destinations) => {
  try {
    if (!destinations || destinations.length === 0) {
      return { success: false, error: 'No hay destinos para optimizar' };
    }

    // For single destination, no optimization needed
    if (destinations.length === 1) {
      return {
        success: true,
        optimizedOrder: [0],
        optimizedDestinations: destinations,
        totalDistance: 0,
        totalDuration: 0,
      };
    }

    // Build origins and destinations strings for Distance Matrix API
    const originsStr = `${origin.latitude},${origin.longitude}`;
    const destinationsStr = destinations
      .map(dest => `${dest.latitude},${dest.longitude}`)
      .join('|');

    // Get distance matrix from origin to all destinations
    const matrixUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originsStr}&destinations=${destinationsStr}&mode=driving&departure_time=now&traffic_model=best_guess&key=${GOOGLE_MAPS_API_KEY}`;

    const matrixResponse = await fetch(matrixUrl);
    const matrixData = await matrixResponse.json();

    if (matrixData.status !== 'OK') {
      throw new Error(`Distance Matrix API error: ${matrixData.status}`);
    }

    // Use nearest neighbor algorithm for optimization
    const unvisited = destinations.map((_, index) => index);
    const optimizedOrder = [];
    let currentPoint = origin;
    let totalDistance = 0;
    let totalDuration = 0;

    while (unvisited.length > 0) {
      let nearestIndex = -1;
      let shortestDistance = Infinity;
      let shortestDuration = 0;

      // Get distances from current point to all unvisited destinations
      const fromCurrentUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${currentPoint.latitude},${currentPoint.longitude}&destinations=${unvisited.map(i => `${destinations[i].latitude},${destinations[i].longitude}`).join('|')}&mode=driving&departure_time=now&traffic_model=best_guess&key=${GOOGLE_MAPS_API_KEY}`;

      const currentResponse = await fetch(fromCurrentUrl);
      const currentData = await currentResponse.json();

      if (currentData.status === 'OK' && currentData.rows[0]) {
        const elements = currentData.rows[0].elements;
        
        elements.forEach((element, idx) => {
          if (element.status === 'OK') {
            const distance = element.distance.value; // in meters
            const duration = element.duration_in_traffic?.value || element.duration.value; // in seconds
            
            if (distance < shortestDistance) {
              shortestDistance = distance;
              shortestDuration = duration;
              nearestIndex = idx;
            }
          }
        });
      }

      if (nearestIndex !== -1) {
        const actualIndex = unvisited[nearestIndex];
        optimizedOrder.push(actualIndex);
        currentPoint = destinations[actualIndex];
        totalDistance += shortestDistance;
        totalDuration += shortestDuration;
        unvisited.splice(nearestIndex, 1);
      } else {
        // If we can't find nearest, just add remaining in order
        optimizedOrder.push(...unvisited);
        break;
      }
    }

    // Reorder destinations according to optimized order
    const optimizedDestinations = optimizedOrder.map(index => destinations[index]);

    return {
      success: true,
      optimizedOrder,
      optimizedDestinations,
      totalDistance, // in meters
      totalDuration, // in seconds
    };
  } catch (error) {
    console.error('Route optimization error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get detailed route with polylines (route paths on streets)
 */
export const getDetailedRoute = async (origin, destinations) => {
  try {
    if (!destinations || destinations.length === 0) {
      return { success: false, error: 'No hay destinos' };
    }

    // Build waypoints string (all destinations except the last one)
    let waypointsStr = '';
    if (destinations.length > 1) {
      const waypoints = destinations.slice(0, -1);
      waypointsStr = `&waypoints=${waypoints.map(dest => `${dest.latitude},${dest.longitude}`).join('|')}`;
    }

    const lastDestination = destinations[destinations.length - 1];
    
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${lastDestination.latitude},${lastDestination.longitude}${waypointsStr}&mode=driving&departure_time=now&traffic_model=best_guess&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      
      // Extract polyline points for drawing route on map
      const coordinates = [];
      route.legs.forEach(leg => {
        leg.steps.forEach(step => {
          const points = decodePolyline(step.polyline.points);
          coordinates.push(...points);
        });
      });

      // Calculate total distance and duration
      const totalDistance = route.legs.reduce((sum, leg) => sum + leg.distance.value, 0);
      const totalDuration = route.legs.reduce((sum, leg) => sum + (leg.duration_in_traffic?.value || leg.duration.value), 0);

      return {
        success: true,
        coordinates, // Array of {latitude, longitude} for drawing route
        totalDistance, // in meters
        totalDuration, // in seconds
        legs: route.legs, // Detailed leg information
      };
    }

    return { success: false, error: `Directions API error: ${data.status}` };
  } catch (error) {
    console.error('Get detailed route error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Decode Google Maps polyline string to coordinates
 */
const decodePolyline = (encoded) => {
  const coordinates = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const deltaLat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const deltaLng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return coordinates;
};

// ==================== Additional Delivery Functions ====================

/**
 * Get a single delivery by ID with its destinations
 */
export const getDeliveryById = async (deliveryId) => {
  try {
    const { data: delivery, error: deliveryError } = await supabase
      .from('deliveries')
      .select('*')
      .eq('id', deliveryId)
      .single();

    if (deliveryError) throw deliveryError;

    // Get destinations for this delivery
    const { data: destinations, error: destError } = await supabase
      .from('delivery_destinations')
      .select('*')
      .eq('delivery_id', deliveryId)
      .order('order_number', { ascending: true });

    if (destError) throw destError;

    return {
      ...delivery,
      destinations: destinations || [],
    };
  } catch (error) {
    console.error('Get delivery by ID error:', error);
    return null;
  }
};

/**
 * Update delivery status
 */
export const updateDeliveryStatus = async (deliveryId, status) => {
  try {
    const updateData = { status, updated_at: new Date().toISOString() };
    
    // If status is completed, add completed_at timestamp
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('deliveries')
      .update(updateData)
      .eq('id', deliveryId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Update delivery status error:', error);
    return null;
  }
};

/**
 * Update destination status
 */
export const updateDestinationStatus = async (destinationId, status) => {
  try {
    const updateData = { status };
    
    // If status is completed, add completed_at timestamp
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('delivery_destinations')
      .update(updateData)
      .eq('id', destinationId)
      .select()
      .single();

    if (error) throw error;

    // Check if all destinations are completed, then mark delivery as completed
    const { data: allDestinations } = await supabase
      .from('delivery_destinations')
      .select('id, status, delivery_id')
      .eq('delivery_id', data.delivery_id);

    if (allDestinations && allDestinations.every(dest => dest.status === 'completed')) {
      await updateDeliveryStatus(data.delivery_id, 'completed');
    }

    return data;
  } catch (error) {
    console.error('Update destination status error:', error);
    return null;
  }
};

// ==================== Gemini AI Chatbot Service ====================

/**
 * Send a message to Gemini AI and get a response
 * The AI has context about the LogisticsRoute app
 */
export const sendMessageToAI = async (userMessage, userContext = {}) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Build context prompt with user's delivery data
    const contextPrompt = `Eres un asistente inteligente de la aplicación LogisticsRoute, una app de optimización de rutas de entrega.

Contexto del usuario:
- Entregas hoy: ${userContext.todayDeliveries || 0}
- Entregas pendientes: ${userContext.pendingDeliveries || 0}
- Entregas completadas: ${userContext.completedDeliveries || 0}
- Combustible ahorrado: ${userContext.fuelSaved || 0}L

Tu objetivo es:
1. Dar consejos sobre optimización de rutas de entrega
2. Responder preguntas sobre cómo usar la app
3. Sugerir mejores prácticas para ahorrar combustible
4. Analizar estadísticas del usuario y dar recomendaciones
5. Ser amigable, conciso y útil

Responde en español de manera breve y práctica.

Pregunta del usuario: ${userMessage}`;

    const result = await model.generateContent(contextPrompt);
    const response = await result.response;
    const text = response.text();

    return {
      success: true,
      message: text
    };
  } catch (error) {
    console.error('Gemini AI error:', error);
    return {
      success: false,
      message: 'Lo siento, no pude procesar tu mensaje en este momento. Intenta nuevamente.'
    };
  }
};

/**
 * Get AI suggestions based on user's delivery data
 */
export const getAISuggestions = async (dashboardData) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `Analiza estos datos de un conductor de entregas y dame 3 consejos breves:

- Entregas hoy: ${dashboardData.todayDeliveries}
- Pendientes: ${dashboardData.pendingDeliveries}
- Completadas: ${dashboardData.completedDeliveries}
- Combustible ahorrado: ${dashboardData.fuelSaved}L

Dame 3 consejos cortos (máximo 15 palabras cada uno) para mejorar eficiencia.
Formato: solo los 3 consejos, uno por línea, sin numeración ni símbolos.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Split suggestions by line
    const suggestions = text
      .split('\n')
      .filter(line => line.trim().length > 0)
      .slice(0, 3);

    return {
      success: true,
      suggestions
    };
  } catch (error) {
    console.error('Get AI suggestions error:', error);
    return {
      success: false,
      suggestions: []
    };
  }
};
