import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Avatar } from 'react-native-paper';

const DeliveryList = ({ deliveries, onPressItem }) => {
  if (!deliveries || deliveries.length === 0) {
    return (
      <Card style={styles.emptyCard}>
        <Card.Content>
          <Text style={styles.emptyText}>No hay entregas disponibles</Text>
        </Card.Content>
      </Card>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'in_progress':
        return '#2196F3';
      default:
        return '#FBC02D';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completada';
      case 'in_progress':
        return 'En progreso';
      default:
        return 'Pendiente';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha desconocida';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      {deliveries.map((delivery) => {
        // Ensure delivery has required properties with defaults
        const destinations = delivery.delivery_destinations || delivery.destinations || [];
        const totalDistance = delivery.total_distance || 0;
        const createdAt = delivery.created_at || delivery.createdAt || new Date().toISOString();
        
        return (
          <TouchableOpacity
            key={delivery.id}
            onPress={() => onPressItem(delivery)}
            style={styles.cardContainer}
          >
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={styles.dateContainer}>
                    <Text style={styles.date}>{formatDate(createdAt)}</Text>
                    <View 
                      style={[
                        styles.statusIndicator, 
                        { backgroundColor: getStatusColor(delivery.status) }
                      ]}
                    />
                    <Text style={styles.statusText}>
                      {getStatusText(delivery.status)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.infoContainer}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Paradas:</Text>
                    <Text style={styles.infoValue}>{destinations.length}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Distancia:</Text>
                    <Text style={styles.infoValue}>
                      {(totalDistance / 1000).toFixed(1)} km
                    </Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Tiempo estimado:</Text>
                    <Text style={styles.infoValue}>
                      {Math.round((delivery.estimated_duration || 0) / 60)} min
                    </Text>
                  </View>
                </View>
              
                {delivery.status !== 'completed' && (
                  <View style={styles.bottomRow}>
                    <Avatar.Icon 
                      size={24} 
                      icon="chevron-right" 
                      color="#0047AB" 
                      style={styles.chevronIcon} 
                    />
                  </View>
                )}
              </Card.Content>
            </Card>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  cardContainer: {
    marginBottom: 12,
  },
  card: {
    elevation: 2,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 10,
  },
  emptyText: {
    color: '#888888',
    textAlign: 'center',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 14,
    color: '#666666',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#666666',
  },
  infoContainer: {
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoLabel: {
    color: '#666666',
  },
  infoValue: {
    fontWeight: 'bold',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  chevronIcon: {
    backgroundColor: 'transparent',
  },
});

export default DeliveryList;
