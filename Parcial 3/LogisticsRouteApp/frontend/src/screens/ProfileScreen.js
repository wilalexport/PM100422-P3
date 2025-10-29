import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Card, Button, TextInput, Avatar, ActivityIndicator } from 'react-native-paper';
import { getCurrentUser, getUserProfile, updateUserProfile, logout } from '../services/supabaseService';

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    companyName: '',
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const currentUser = await getCurrentUser();
      
      if (currentUser) {
        // Get user profile
        const profile = await getUserProfile(currentUser.id);
        
        if (profile) {
          setUser(profile);
          setFormData({
            fullName: profile.full_name || '',
            phone: profile.phone_number || '',
            companyName: profile.company_name || '',
          });
        } else {
          Alert.alert('Error', 'No se pudo cargar el perfil');
        }
      } else {
        Alert.alert('Error', 'No se encontró el usuario');
        navigation.navigate('Login');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setSaving(true);
      
      // Get current user
      const currentUser = await getCurrentUser();
      
      if (currentUser) {
        // Update profile
        const updateResult = await updateUserProfile(currentUser.id, {
          full_name: formData.fullName,
          phone_number: formData.phone,
          company_name: formData.companyName,
        });
        
        if (updateResult) {
          setUser(updateResult);
          setEditing(false);
          Alert.alert('Éxito', 'Perfil actualizado correctamente');
        } else {
          Alert.alert('Error', 'No se pudo actualizar el perfil');
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              // Logout from Supabase
              await logout();
              
              // Navigate to Login screen
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'No se pudo cerrar sesión');
            }
          },
        },
      ]
    );
  };

  if (loading && !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0047AB" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Avatar.Icon size={80} icon="account" style={styles.avatar} />
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Información Personal</Text>
            
            <TextInput
              label="Nombre completo"
              value={formData.fullName}
              onChangeText={(text) => setFormData({ ...formData, fullName: text })}
              style={styles.input}
              mode="outlined"
              disabled={!editing}
            />
            
            <TextInput
              label="Teléfono"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              style={styles.input}
              mode="outlined"
            disabled={!editing}
            keyboardType="phone-pad"
          />
          
          <TextInput
            label="Nombre de la empresa"
            value={formData.companyName}
            onChangeText={(text) => setFormData({ ...formData, companyName: text })}
            style={styles.input}
            mode="outlined"
            disabled={!editing}
          />
          
          <TextInput
            label="Empresa"
            value={formData.companyName}
            onChangeText={(text) => setFormData({ ...formData, companyName: text })}
            style={styles.input}
            mode="outlined"
            disabled={!editing}
          />
          
          {editing ? (
            <View style={styles.buttonContainer}>
              <Button 
                mode="outlined" 
                onPress={() => {
                  setEditing(false);
                  // Reset form data
                  setFormData({
                    fullName: user?.full_name || '',
                    phone: user?.phone_number || '',
                    companyName: user?.company_name || '',
                  });
                }}
                style={styles.button}
              >
                Cancelar
              </Button>
              <Button 
                mode="contained" 
                onPress={handleUpdate}
                style={styles.button}
                loading={saving}
                disabled={saving}
              >
                Guardar
              </Button>
            </View>
          ) : (
            <Button 
              mode="contained" 
              onPress={() => setEditing(true)}
              style={styles.editButton}
            >
              Editar perfil
            </Button>
          )}
        </Card.Content>
      </Card>

      <Button 
        mode="outlined" 
        onPress={handleLogout}
        style={styles.logoutButton}
        textColor="#E63946"
      >
        Cerrar sesión
      </Button>
      </ScrollView>
    </KeyboardAvoidingView>
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
  header: {
    backgroundColor: '#0047AB',
    padding: 30,
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  email: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  card: {
    margin: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#0047AB',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  editButton: {
    marginTop: 10,
  },
  logoutButton: {
    margin: 16,
    borderColor: '#E63946',
  },
});

export default ProfileScreen;