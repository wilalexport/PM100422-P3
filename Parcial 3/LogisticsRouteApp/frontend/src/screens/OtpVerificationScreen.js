import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TextInput as RNTextInput, Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, Dimensions } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { verifyOTP, loginWithEmail } from '../services/supabaseService';

const { width } = Dimensions.get('window');

const OtpVerificationScreen = ({ route, navigation }) => {
  const { email, isNewUser = false } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']); // Supabase uses 6-digit OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef([]);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
      clearInterval(interval);
    }
    
    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (text, index) => {
    // Handle paste: if pasting full code, distribute across inputs
    if (text.length === 6) {
      const newOtp = text.split('').slice(0, 6);
      setOtp(newOtp);
      // Focus last input
      inputRefs.current[5]?.focus();
      return;
    }
    
    // Handle single character input
    const newOtp = [...otp];
    newOtp[index] = text.slice(-1); // Only take last character
    setOtp(newOtp);
    
    // Move to next input if value is entered
    if (text !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };
  
  const handleKeyPress = (event, index) => {
    // Move to previous input on backspace if current input is empty
    if (event.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setError('Por favor ingresa el código completo de 6 dígitos');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Verify OTP with Supabase
      const result = await verifyOTP(email, otpCode);
      
      if (result.success) {
        // Show welcome message for new users
        if (isNewUser) {
          Alert.alert(
            '¡Bienvenido!',
            'Tu cuenta ha sido creada exitosamente.',
            [{ text: 'OK' }]
          );
        }
        
        // Navigate to Home screen
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      } else {
        setError(result.error || 'Código inválido. Inténtalo nuevamente.');
      }
    } catch (error) {
      setError('Código inválido. Inténtalo nuevamente.');
      console.error('OTP verification error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Request new OTP
      const result = await loginWithEmail(email);
      
      if (result.success) {
        Alert.alert(
          'Código Enviado',
          'Hemos enviado un nuevo código a tu correo electrónico.',
          [{ text: 'OK' }]
        );
        setTimer(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']); // Clear current OTP
      } else {
        setError(result.error || 'Error al reenviar el código');
      }
    } catch (error) {
      setError('Error al reenviar el código');
      console.error('Resend OTP error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Verificación de Código</Text>
        <Text style={styles.subtitle}>
          Hemos enviado un código de verificación a:
        </Text>
        <Text style={styles.email}>{email}</Text>
        
        <View style={styles.otpContainer}>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <RNTextInput
              key={index}
              ref={el => (inputRefs.current[index] = el)}
              style={styles.otpInput}
              value={otp[index]}
              onChangeText={(text) => handleOtpChange(text, index)}
              onKeyPress={(event) => handleKeyPress(event, index)}
              keyboardType="numeric"
              maxLength={6} // Allow paste of full code
              selectTextOnFocus
              autoFocus={index === 0}
            />
          ))}
        </View>
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        <Button 
          mode="contained" 
          onPress={handleVerifyOtp} 
          style={styles.verifyButton}
          loading={loading}
          disabled={loading || otp.join('').length !== 6}
        >
          Verificar
        </Button>
        
        <View style={styles.resendContainer}>
          <Text>¿No recibiste el código? </Text>
          <Button 
          mode="text" 
          onPress={handleResendOtp}
          disabled={!canResend || loading}
          style={styles.resendButton}
        >
          {canResend ? 'Reenviar código' : `Reenviar en ${timer}s`}
        </Button>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#0047AB',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  email: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
    paddingHorizontal: 8,
  },
  otpInput: {
    width: Math.min(52, (width - 120) / 6), // Ajuste para 6 cuadros
    height: Math.min(60, (width - 120) / 6 + 8),
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    borderWidth: 2,
    borderColor: '#0047AB',
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#F8F9FA',
    paddingVertical: 8,
  },
  errorText: {
    color: '#E63946',
    marginBottom: 16,
    textAlign: 'center',
  },
  verifyButton: {
    width: '100%',
    paddingVertical: 6,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
  },
  resendButton: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
});

export default OtpVerificationScreen;
