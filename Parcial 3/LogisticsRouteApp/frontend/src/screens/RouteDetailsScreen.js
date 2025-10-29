import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Alert } from 'react-native';
import { Text, Button, Card, List, Chip, ActivityIndicator, Divider } from 'react-native-paper';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { getDeliveryById, updateDeliveryStatus, updateDestinationStatus } from '../services/supabaseService';

const { width } = Dimensions.get('window');
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

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

const RouteDetailsScreen = ({ route, navigation }) => {
  const { deliveryId } = route.params;
  const [routeDetails, setRouteDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapRegion, setMapRegion] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [completingDestinations, setCompletingDestinations] = useState([]);

  useEffect(() => {
    fetchRouteDetails();
  }, []);

  const fetchRouteDetails = async () => {
    try {
      setLoading(true);
      
      const result = await getDeliveryById(deliveryId);
      
      if (!result) {
        throw new Error('No se encontró la entrega');
      }
      
      setRouteDetails(result);
      
      // Fetch real route from Google Directions API
      if (result.start_latitude && result.start_longitude && result.destinations && result.destinations.length > 0) {
        const orderedDests = [...result.destinations].sort((a, b) => (a.order_number || 0) - (b.order_number || 0));
        
        const waypoints = orderedDests
          .map(dest => `${dest.latitude},${dest.longitude}`)
          .join('|');
        
        const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${result.start_latitude},${result.start_longitude}&destination=${result.start_latitude},${result.start_longitude}&waypoints=${waypoints}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;
        
        try {
          const directionsResponse = await fetch(directionsUrl);
          const directionsData = await directionsResponse.json();
          
          if (directionsData.status === 'OK' && directionsData.routes.length > 0) {
            const polylinePoints = decodePolyline(directionsData.routes[0].overview_polyline.points);
            setRouteCoordinates(polylinePoints);
          }
        } catch (err) {
          console.error('Error fetching route polyline:', err);
          // Fall back to straight lines if API fails
        }
        
        const points = [
          { latitude: result.start_latitude, longitude: result.start_longitude },
          ...orderedDests.map(dest => ({
            latitude: dest.latitude,
            longitude: dest.longitude
          }))
        ];
        updateMapRegion(points);
      }
    } catch (error) {
      console.error('Error fetching route details:', error);
      alert('Error al cargar los detalles de la ruta');
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

  const getOrderedDestinations = () => {
    if (!routeDetails || !routeDetails.destinations) return [];
    
    return [...routeDetails.destinations]
      .sort((a, b) => (a.order_number || 0) - (b.order_number || 0));
  };

  const startDelivery = async () => {
    try {
      const result = await updateDeliveryStatus(deliveryId, 'in_progress');
      
      if (!result) {
        throw new Error('No se pudo iniciar la entrega');
      }
      
      // Refresh route details
      fetchRouteDetails();
    } catch (error) {
      console.error('Error starting delivery:', error);
      alert('Error al iniciar la entrega');
    }
  };

  const cancelRoute = async () => {
    try {
      // Confirmar cancelación
      Alert.alert(
        'Cancelar Ruta',
        '¿Estás seguro de que deseas cancelar esta ruta? Esta acción no se puede deshacer.',
        [
          {
            text: 'No',
            style: 'cancel'
          },
          {
            text: 'Sí, cancelar',
            style: 'destructive',
            onPress: async () => {
              try {
                // Eliminar la ruta
                const { supabase } = require('../Libs/supabase');
                
                // Primero eliminar los destinos
                const { error: destError } = await supabase
                  .from('delivery_destinations')
                  .delete()
                  .eq('delivery_id', deliveryId);
                
                if (destError) throw destError;
                
                // Luego eliminar la entrega
                const { error: deliveryError } = await supabase
                  .from('deliveries')
                  .delete()
                  .eq('id', deliveryId);
                
                if (deliveryError) throw deliveryError;
                
                Alert.alert('Éxito', 'Ruta cancelada exitosamente');
                navigation.goBack();
              } catch (err) {
                console.error('Error canceling route:', err);
                Alert.alert('Error', 'No se pudo cancelar la ruta');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error canceling route:', error);
      Alert.alert('Error', 'No se pudo cancelar la ruta');
    }
  };

  const completeDelivery = async (destinationId) => {
    try {
      // Marcar como "completando" de inmediato
      setCompletingDestinations(prev => [...prev, destinationId]);
      
      // Actualizar UI inmediatamente
      setRouteDetails(prevDetails => ({
        ...prevDetails,
        destinations: prevDetails.destinations.map(dest =>
          dest.id === destinationId ? { ...dest, status: 'completed' } : dest
        )
      }));
      
      // Actualizar en segundo plano sin bloquear UI
      const result = await updateDestinationStatus(destinationId, 'completed');
      
      if (!result) {
        // Si falla, revertir
        setRouteDetails(prevDetails => ({
          ...prevDetails,
          destinations: prevDetails.destinations.map(dest =>
            dest.id === destinationId ? { ...dest, status: 'pending' } : dest
          )
        }));
        throw new Error('No se pudo completar la parada');
      }
      
      // Verificar si todas las paradas están completadas
      const allCompleted = routeDetails.destinations.every(dest => 
        dest.id === destinationId || dest.status === 'completed'
      );
      
      if (allCompleted) {
        // Actualizar estado de la entrega a completada
        await updateDeliveryStatus(deliveryId, 'completed');
        setRouteDetails(prevDetails => ({
          ...prevDetails,
          status: 'completed'
        }));
      }
      
    } catch (error) {
      console.error('Error completing delivery stop:', error);
      alert('Error al completar la parada');
    } finally {
      setCompletingDestinations(prev => prev.filter(id => id !== destinationId));
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0047AB" />
      </View>
    );
  }

  if (!routeDetails) {
    return (
      <View style={styles.errorContainer}>
        <Text>No se pudo cargar los detalles de la ruta</Text>
      </View>
    );
  }

  const orderedDestinations = getOrderedDestinations();

  return (
    <View style={styles.container}>
      {mapRegion && routeDetails && (
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={mapRegion}
            showsUserLocation={true}
          >
            {/* Origin marker */}
            {routeDetails.start_latitude && routeDetails.start_longitude && (
              <Marker
                coordinate={{ latitude: routeDetails.start_latitude, longitude: routeDetails.start_longitude }}
                title="Origen"
                description={routeDetails.start_address || "Punto de partida"}
                pinColor="#0047AB"
              />
            )}
            
            {/* Destination markers */}
            {orderedDestinations.map((dest, index) => (
              dest.latitude && dest.longitude && (
                <Marker
                  key={dest.id}
                  coordinate={{ latitude: dest.latitude, longitude: dest.longitude }}
                  title={`Parada ${index + 1}`}
                  description={dest.address}
                  pinColor={dest.status === 'completed' ? '#4CAF50' : '#E63946'}
                />
              )
            ))}
            
            {/* Real route polyline from Google Directions */}
            {routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeWidth={4}
                strokeColor="#0047AB"
              />
            )}
          </MapView>
        </View>
      )}
      
      <ScrollView style={styles.detailsContainer}>
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>Resumen de ruta</Text>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Estado:</Text>
              <Chip 
                mode="outlined" 
                style={[
                  styles.statusChip,
                  routeDetails.status === 'completed' ? styles.completedChip :
                  routeDetails.status === 'in_progress' ? styles.activeChip :
                  styles.pendingChip
                ]}
              >
                {routeDetails.status === 'pending' ? 'Pendiente' :
                 routeDetails.status === 'in_progress' ? 'En progreso' :
                 'Completada'}
              </Chip>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Distancia total:</Text>
              <Text style={styles.summaryValue}>
                {((routeDetails.total_distance || 0) / 1000).toFixed(1)} km
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Tiempo estimado:</Text>
              <Text style={styles.summaryValue}>
                {Math.round((routeDetails.estimated_duration || 0) / 60)} min
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Ahorro de combustible:</Text>
              <Text style={[styles.summaryValue, styles.savingsValue]}>
                {((routeDetails.total_distance || 0) / 1000 / 10 * 0.2).toFixed(1)} litros
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Fecha de creación:</Text>
              <Text style={styles.summaryValue}>
                {new Date(routeDetails.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </Card.Content>
        </Card>
        
        <Card style={styles.stopsCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>Paradas ({orderedDestinations.length})</Text>
            
            <List.Item
              title="Origen"
              description="Mi ubicación actual"
              left={props => <List.Icon {...props} icon="home" color="#0047AB" />}
            />
            
            <Divider />
            
            {orderedDestinations.map((dest, index) => (
              <View key={dest.id}>
                <List.Item
                  title={`Parada ${index + 1}`}
                  description={dest.address}
                  left={props => (
                    <List.Icon 
                      {...props} 
                      icon={dest.status === 'completed' ? "check-circle" : "map-marker"} 
                      color={dest.status === 'completed' ? "#4CAF50" : "#E63946"} 
                    />
                  )}
                  right={() => (
                    dest.status === 'completed' ? (
                      <Chip 
                        mode="flat" 
                        style={styles.completedChipSmall}
                        textStyle={styles.completedChipText}
                      >
                        Completada
                      </Chip>
                    ) : routeDetails.status === 'in_progress' ? (
                      <Button 
                        mode="contained" 
                        onPress={() => completeDelivery(dest.id)}
                        style={styles.completeButton}
                        loading={completingDestinations.includes(dest.id)}
                        disabled={completingDestinations.includes(dest.id)}
                      >
                        Completar
                      </Button>
                    ) : null
                  )}
                />
                {index < orderedDestinations.length - 1 && <Divider />}
              </View>
            ))}
          </Card.Content>
        </Card>
        
        {routeDetails.status === 'pending' && (
          <View style={styles.actionsContainer}>
            <Button 
              mode="contained" 
              onPress={startDelivery}
              style={styles.startButton}
              icon="play"
            >
              Iniciar Ruta
            </Button>
            
            <Button 
              mode="outlined" 
              onPress={cancelRoute}
              style={styles.cancelButton}
              textColor="#E63946"
              icon="close-circle"
            >
              Cancelar Ruta
            </Button>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mapContainer: {
    height: 250,
    width: '100%',
  },
  map: {
    height: '100%',
    width: '100%',
  },
  detailsContainer: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0047AB',
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
    minHeight: 40,
  },
  summaryLabel: {
    color: '#666666',
    flex: 1,
  },
  summaryValue: {
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  savingsValue: {
    color: '#2E7D32',
  },
  statusChip: {
    height: 32,
    alignSelf: 'flex-start',
  },
  pendingChip: {
    backgroundColor: '#FFF9C4',
    borderColor: '#FBC02D',
  },
  activeChip: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  completedChip: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  completedChipSmall: {
    backgroundColor: '#E8F5E9',
    height: 26,
    marginVertical: 0,
    paddingHorizontal: 8,
  },
  completedChipText: {
    color: '#4CAF50',
    fontSize: 11,
    fontWeight: '600',
    marginVertical: 0,
  },
  stopsCard: {
    marginBottom: 16,
  },
  completeButton: {
    marginVertical: 0,
    backgroundColor: '#0047AB',
    paddingVertical: 0,
    minHeight: 32,
  },
  actionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 8,
  },
  startButton: {
    marginBottom: 12,
    paddingVertical: 8,
    backgroundColor: '#0047AB',
  },
  cancelButton: {
    paddingVertical: 8,
    borderColor: '#E63946',
    borderWidth: 1.5,
  },
});

export default RouteDetailsScreen;
