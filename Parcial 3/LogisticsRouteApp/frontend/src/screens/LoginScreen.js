import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { loginWithEmail } from '../services/supabaseService';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !email.includes('@')) {
      setError('Por favor ingresa un correo electrónico válido');
      return;
    }

    if (!password || password.length < 6) {
      setError('Por favor ingresa tu contraseña (mínimo 6 caracteres)');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Validate password and request OTP from Supabase
      const result = await loginWithEmail(email, password);
      
      if (result.success) {
        // Show success message
        Alert.alert(
          'Código Enviado',
          'Contraseña correcta. Hemos enviado un código de 6 dígitos a tu correo electrónico.',
          [{ text: 'OK' }]
        );
        // Navigate to OTP verification screen
        navigation.navigate('OtpVerification', { email });
      } else {
        setError(result.error || 'Hubo un error al iniciar sesión');
      }
    } catch (error) {
      setError('Hubo un error al iniciar sesión');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../images/Logo-2.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      
      <View style={styles.formContainer}>
        <TextInput
          label="Correo Electrónico"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          mode="outlined"
          autoCapitalize="none"
          keyboardType="email-address"
          outlineColor="#0047AB"
          activeOutlineColor="#0047AB"
        />
        
        <TextInput
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          mode="outlined"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          outlineColor="#0047AB"
          activeOutlineColor="#0047AB"
          right={
            <TextInput.Icon
              icon={showPassword ? "eye-off" : "eye"}
              onPress={() => setShowPassword(!showPassword)}
            />
          }
        />
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        <Button 
          mode="contained" 
          onPress={handleLogin} 
          style={styles.loginButton}
          buttonColor="#0047AB"
          loading={loading}
          disabled={loading}
        >
          Iniciar Sesión
        </Button>
        
        <TouchableOpacity 
          onPress={() => navigation.navigate('Register')}
          style={styles.registerLink}
        >
          <Text style={styles.registerText}>¿No tienes una cuenta? Regístrate aquí</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 50,
  },
  logo: {
    width: 180,
    height: 180,
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    color: '#E63946',
    marginBottom: 10,
  },
  loginButton: {
    paddingVertical: 6,
    marginTop: 10,
    borderRadius: 8,
  },
  registerLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  registerText: {
    color: '#0047AB',
    fontSize: 16,
  },
});

export default LoginScreen;
