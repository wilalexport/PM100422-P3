import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';

const DashboardSummary = ({ data }) => {
  // Safe fallback values
  const safeData = {
    todayDeliveries: data?.todayDeliveries || 0,
    pendingDeliveries: data?.pendingDeliveries || 0,
    completedDeliveries: data?.completedDeliveries || 0,
    fuelSaved: typeof data?.fuelSaved === 'number' ? data.fuelSaved : 0,
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.value}>{safeData.todayDeliveries}</Text>
            <Text style={styles.label}>Entregas hoy</Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.value}>{safeData.pendingDeliveries}</Text>
            <Text style={styles.label}>Pendientes</Text>
          </Card.Content>
        </Card>
      </View>
      
      <View style={styles.row}>
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.value}>{safeData.completedDeliveries}</Text>
            <Text style={styles.label}>Completadas</Text>
          </Card.Content>
        </Card>
        
        <Card style={[styles.card, styles.savingsCard]}>
          <Card.Content style={styles.cardContent}>
            <Text style={[styles.value, styles.savingsValue]}>{safeData.fuelSaved.toFixed(1)}L</Text>
            <Text style={styles.label}>Combustible ahorrado</Text>
          </Card.Content>
        </Card>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: -40,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    flex: 1,
    marginHorizontal: 4,
    elevation: 4,
  },
  cardContent: {
    alignItems: 'center',
    padding: 12,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0047AB',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: '#666666',
  },
  savingsCard: {
    backgroundColor: '#E8F5E9',
  },
  savingsValue: {
    color: '#2E7D32',
  },
});

export default DashboardSummary;
