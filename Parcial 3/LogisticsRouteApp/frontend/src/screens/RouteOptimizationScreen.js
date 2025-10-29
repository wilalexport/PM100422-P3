import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { Text, Button, TextInput, Card, Divider, Portal, Modal, ActivityIndicator, IconButton } from 'react-native-paper';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { optimizeRoute as optimizeRouteService, createDelivery, geocodeAddress } from '../services/supabaseService';

import AddressInput from '../components/AddressInput';
import { calculateFuelSavings } from '../utils/routeCalculations';

const { width, height } = Dimensions.get('window');

// Helper function to decode Google Maps polyline
const decodePolyline = (encoded) => {
  const poly = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    poly.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return poly;
};

const RouteOptimizationScreen = ({ navigation }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [destinations, setDestinations] = useState([{ id: 1, address: '', coordinates: null }]);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mapRegion, setMapRegion] = useState(null);
  const [visibleModal, setVisibleModal] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [routeInfo, setRouteInfo] = useState({
    totalDistance: 0,
    totalDuration: 0,
    fuelSavings: 0,
  });
  const scrollViewRef = useRef(null);

  useEffect(() => {
    requestLocationPermission();
    
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        
        setCurrentLocation({ latitude, longitude });
        setMapRegion({
          latitude,
          longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };
  const addDestination = () => {
    const newId = destinations.length > 0 ? Math.max(...destinations.map(d => d.id)) + 1 : 1;
    setDestinations([...destinations, { id: newId, address: '', coordinates: null }]);
  };

  const removeDestination = (id) => {
    if (destinations.length <= 1) return;
    setDestinations(destinations.filter(dest => dest.id !== id));
  };

  const updateDestination = (id, address, coordinates = null) => {
    setDestinations(destinations.map(dest => {
      if (dest.id === id) {
        return { ...dest, address, coordinates };
      }
      return dest;
    }));
  };

  const optimizeRoute = async () => {
    // Check if all destinations have coordinates
    const hasInvalidDestinations = destinations.some(dest => !dest.coordinates);
    if (!currentLocation || hasInvalidDestinations) {
      alert('Por favor ingrese direcciones válidas para todos los destinos');
      return;
    }

    try {
      setLoading(true);
      
      // Get current user
      const { getCurrentUser } = require('../services/supabaseService');
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        throw new Error('No se encontró el usuario');
      }
      
      // Prepare origin address by geocoding current location
      const originAddress = await geocodeAddress(currentLocation.latitude, currentLocation.longitude);
      
      // Prepare start location object
      const startLocation = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        address: originAddress || 'Ubicación actual',
      };
      
      // Prepare destinations array
      const destinationsArray = destinations.map(dest => ({
        address: dest.address,
        latitude: dest.coordinates.latitude,
        longitude: dest.coordinates.longitude,
      }));
      
      // Call Supabase service to optimize route (uses Google Directions API with optimize:true)
      const result = await optimizeRouteService(
        currentUser.id,
        startLocation,
        destinationsArray
      );
      
      if (!result || !result.success) {
        throw new Error(result?.error || 'No se pudo optimizar la ruta');
      }
      
      // Decode polyline for route visualization
      if (result.delivery.polyline) {
        const polylinePoints = decodePolyline(result.delivery.polyline);
        setRouteCoordinates(polylinePoints);
      }
      
      // Set optimized destinations in the correct order
      setOptimizedRoute(result.optimizedDestinations || destinationsArray);
      
      setRouteInfo({
        totalDistance: result.delivery?.total_distance || 0,
        totalDuration: result.delivery?.estimated_duration || 0,
        fuelSavings: result.savings?.fuel_saved || 0,
      });
      
      // Update map region to fit all points including the route
      const allPoints = [currentLocation, ...destinationsArray.map(point => ({
        latitude: point.latitude,
        longitude: point.longitude
      }))];
      
      updateMapRegion(allPoints);
      
      setVisibleModal(true);
    } catch (error) {
      console.error('Error optimizing route:', error);
      alert('Hubo un error al optimizar la ruta. Inténtelo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const updateMapRegion = (points) => {
    if (!points || points.length === 0) return;
    
    let minLat = points[0].latitude;
    let maxLat = points[0].latitude;
    let minLng = points[0].longitude;
    let maxLng = points[0].longitude;
    
    points.forEach(point => {
      minLat = Math.min(minLat, point.latitude);
      maxLat = Math.max(maxLat, point.latitude);
      minLng = Math.min(minLng, point.longitude);
      maxLng = Math.max(maxLng, point.longitude);
    });
    
    // Add padding
    const latDelta = (maxLat - minLat) * 1.5;
    const lngDelta = (maxLng - minLng) * 1.5;
    
    setMapRegion({
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.05),
      longitudeDelta: Math.max(lngDelta, 0.05),
    });
  };

  const saveRoute = async () => {
    if (!optimizedRoute) return;
    
    try {
      setLoading(true);
      
      // Get current user
      const { getCurrentUser } = require('../services/supabaseService');
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        throw new Error('No se encontró el usuario');
      }
      
      // Prepare origin address
      const originAddress = await geocodeAddress(currentLocation.latitude, currentLocation.longitude);
      
      // Create delivery object with calculated values
      const deliveryData = {
        user_id: currentUser.id,
        start_latitude: currentLocation.latitude,
        start_longitude: currentLocation.longitude,
        start_address: originAddress || 'Ubicación actual',
        total_distance: routeInfo.totalDistance,
        estimated_duration: routeInfo.totalDuration,
        status: 'pending',
      };
      
      // Create delivery in Supabase
      const result = await createDelivery(deliveryData);
      
      if (!result || !result.success || !result.delivery) {
        throw new Error('No se pudo guardar la ruta');
      }
      
      // Prepare destinations with order
      const destinationsArray = optimizedRoute.map((dest, index) => ({
        address: dest.address,
        latitude: dest.latitude,
        longitude: dest.longitude,
        order_number: index + 1,
      }));
      
      // Add destinations to the delivery
      const { addDeliveryDestinations } = require('../services/supabaseService');
      const destResult = await addDeliveryDestinations(result.delivery.id, destinationsArray);
      
      if (!destResult || !destResult.success) {
        throw new Error('No se pudieron guardar los destinos');
      }
      
      setVisibleModal(false);
      
      // Navigate to route details
      navigation.navigate('RouteDetails', { deliveryId: result.delivery.id });
    } catch (error) {
      console.error('Error saving route:', error);
      alert('Hubo un error al guardar la ruta. Inténtelo nuevamente.');
      setVisibleModal(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      {mapRegion && !keyboardVisible && (
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={mapRegion}
            showsUserLocation={true}
          >
            {currentLocation && (
              <Marker
                coordinate={currentLocation}
                title="Origen"
                pinColor="#0047AB"
              />
            )}
            
            {destinations.map((dest, index) => (
              dest.coordinates && (
                <Marker
                  key={dest.id}
                  coordinate={dest.coordinates}
                  title={`Destino ${index + 1}`}
                  pinColor="#E63946"
                />
              )
            ))}
            
            {routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor="#0047AB"
                strokeWidth={3}
              />
            )}
          </MapView>
        </View>
      )}
      
      <ScrollView 
        ref={scrollViewRef}
        style={styles.formContainer}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formHeader}>
          <Text style={styles.title}>Optimizar Ruta</Text>
          <Text style={styles.subtitle}>Ingresa los puntos de entrega para optimizar tu ruta</Text>
        </View>
        
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Punto de Origen</Text>
            <View style={styles.originContainer}>
              <TextInput
                mode="outlined"
                label="Ubicación actual"
                value="Mi ubicación"
                disabled={true}
                style={styles.input}
                right={<TextInput.Icon icon="map-marker" color="#0047AB" />}
              />
            </View>
            
            <Divider style={styles.divider} />
            
            <Text style={styles.sectionTitle}>Puntos de Entrega</Text>
            
            {destinations.map((destination, index) => (
              <View key={destination.id} style={styles.destinationContainer}>
                <AddressInput
                  index={index}
                  value={destination.address}
                  onAddressSelected={(address, coordinates) =>
                    updateDestination(destination.id, address, coordinates)
                  }
                  onRemove={() => removeDestination(destination.id)}
                  showRemoveButton={destinations.length > 1}
                />
              </View>
            ))}
            
            <Button
              mode="outlined"
              icon="plus"
              onPress={addDestination}
              style={styles.addButton}
            >
              Añadir destino
            </Button>
          </Card.Content>
        </Card>
        
        {!keyboardVisible && (
          <Button
            mode="contained"
            onPress={optimizeRoute}
            style={styles.optimizeButton}
            contentStyle={styles.optimizeButtonContent}
            labelStyle={styles.optimizeButtonLabel}
            icon="map-marker-path"
            loading={loading}
            disabled={loading}
          >
            Optimizar Ruta
          </Button>
        )}
      </ScrollView>
      
      <Portal>
        <Modal 
          visible={visibleModal} 
          onDismiss={() => setVisibleModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Ruta Optimizada</Text>
          
          <View style={styles.routeInfoContainer}>
            <View style={styles.routeInfoItem}>
              <Text style={styles.routeInfoLabel}>Distancia total:</Text>
              <Text style={styles.routeInfoValue}>
                {(routeInfo.totalDistance / 1000).toFixed(1)} km
              </Text>
            </View>
            
            <View style={styles.routeInfoItem}>
              <Text style={styles.routeInfoLabel}>Duración estimada:</Text>
              <Text style={styles.routeInfoValue}>
                {Math.round(routeInfo.totalDuration / 60)} min
              </Text>
            </View>
            
            <View style={styles.routeInfoItem}>
              <Text style={styles.routeInfoLabel}>Ahorro de combustible:</Text>
              <Text style={[styles.routeInfoValue, styles.savingsValue]}>
                {routeInfo.fuelSavings.toFixed(1)} litros
              </Text>
            </View>
          </View>
          
          <View style={styles.modalActions}>
            <Button 
              mode="outlined" 
              onPress={() => setVisibleModal(false)}
              style={styles.modalButton}
            >
              Cancelar
            </Button>
            <Button 
              mode="contained" 
              onPress={saveRoute}
              style={styles.modalButton}
              loading={loading}
              disabled={loading}
            >
              Guardar Ruta
            </Button>
          </View>
        </Modal>
      </Portal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  mapContainer: {
    height: 200,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#DDDDDD',
  },
  map: {
    height: '100%',
    width: '100%',
  },
  formContainer: {
    flex: 1,
  },
  formContent: {
    paddingBottom: 100, // Space for button
  },
  formHeader: {
    padding: 16,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0047AB',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  card: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333333',
  },
  originContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  destinationContainer: {
    marginBottom: 12,
  },
  addButton: {
    marginTop: 8,
    borderColor: '#0047AB',
  },
  optimizeButton: {
    margin: 16,
    marginTop: 8,
    marginBottom: 30,
    backgroundColor: '#0047AB',
  },
  optimizeButtonContent: {
    paddingVertical: 8,
  },
  optimizeButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxWidth: 400,
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#0047AB',
    textAlign: 'center',
  },
  routeInfoContainer: {
    marginVertical: 16,
  },
  routeInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  routeInfoLabel: {
    fontSize: 16,
    color: '#555555',
  },
  routeInfoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  savingsValue: {
    color: '#2E7D32',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },
  modalButton: {
    flex: 1,
  },
});

export default RouteOptimizationScreen;
