import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { registerUser } from '../services/supabaseService';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) return 'El nombre es requerido';
    if (!formData.email.includes('@')) return 'Correo electrónico inválido';
    if (!formData.phone.trim()) return 'El teléfono es requerido';
    if (formData.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
    if (formData.password !== formData.confirmPassword) return 'Las contraseñas no coinciden';
    return null;
  };

  const handleRegister = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Register user with Supabase
      const result = await registerUser(
        formData.email,
        formData.password,
        formData.fullName,
        formData.phone
      );
      
      if (result.success) {
        Alert.alert(
          'Registro Exitoso',
          'Hemos enviado un código de verificación a tu correo electrónico.',
          [{ text: 'OK' }]
        );
        
        // Navigate to OTP verification
        navigation.navigate('OtpVerification', { 
          email: formData.email,
          isNewUser: true 
        });
      } else {
        setError(result.error || 'Error al registrar usuario');
      }
    } catch (error) {
      setError('Error al registrar usuario');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Crear nueva cuenta</Text>
        
        <TextInput
          label="Nombre completo"
          value={formData.fullName}
          onChangeText={(value) => handleChange('fullName', value)}
          style={styles.input}
          mode="outlined"
        />
        
        <TextInput
          label="Correo electrónico"
          value={formData.email}
          onChangeText={(value) => handleChange('email', value)}
          style={styles.input}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          label="Teléfono"
          value={formData.phone}
          onChangeText={(value) => handleChange('phone', value)}
          style={styles.input}
          mode="outlined"
          keyboardType="phone-pad"
        />
        
        <TextInput
          label="Contraseña"
          value={formData.password}
          onChangeText={(value) => handleChange('password', value)}
          style={styles.input}
          mode="outlined"
          secureTextEntry
        />
        
        <TextInput
          label="Confirmar contraseña"
          value={formData.confirmPassword}
          onChangeText={(value) => handleChange('confirmPassword', value)}
          style={styles.input}
          mode="outlined"
          secureTextEntry
        />
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        <Button 
          mode="contained" 
          onPress={handleRegister} 
          style={styles.registerButton}
          loading={loading}
          disabled={loading}
        >
          Registrarse
        </Button>
        
        <Button 
          mode="text" 
          onPress={() => navigation.navigate('Login')}
          style={styles.loginLink}
        >
          ¿Ya tienes una cuenta? Inicia sesión
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  formContainer: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#0047AB',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    color: '#E63946',
    marginBottom: 10,
  },
  registerButton: {
    paddingVertical: 6,
    marginTop: 10,
  },
  loginLink: {
    marginTop: 16,
  },
});

export default RegisterScreen;
