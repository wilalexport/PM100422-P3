import './polyfills';
import 'react-native-url-polyfill/auto';
// Cargar polyfills PRIMERO
import './polyfills';
import 'react-native-url-polyfill/auto';

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { DefaultTheme, Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';

// Import screens
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import OtpVerificationScreen from './src/screens/OtpVerificationScreen';
import HomeScreen from './src/screens/HomeScreen';
import RouteOptimizationScreen from './src/screens/RouteOptimizationScreen';
import RouteDetailsScreen from './src/screens/RouteDetailsScreen';
// @ts-ignore
import AIChatScreen from './src/screens/AIChatScreen.js';
// @ts-ignore
import ProfileScreen from './src/screens/ProfileScreen.js';
// @ts-ignore
import DeliveryHistoryScreen from './src/screens/DeliveryHistoryScreen.js';

const Stack = createStackNavigator();

// Custom theme with blue, white and red color scheme
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#0047AB', // Strong blue
    accent: '#E63946',  // Red accent
    background: '#FFFFFF', // White
    text: '#1B263B',    // Dark blue for text
    secondary: '#415A77', // Medium blue for secondary elements
    surface: '#FFFFFF',
    error: '#D90429',
  },
};

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Splash"
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Splash" 
            component={SplashScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen} 
            options={{ title: 'Registro' }}
          />
          <Stack.Screen 
            name="OtpVerification" 
            component={OtpVerificationScreen} 
            options={{ title: 'Verificar Código' }}
          />
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{ title: 'LogisticRoute', headerLeft: null }}
          />
          <Stack.Screen 
            name="RouteOptimization" 
            component={RouteOptimizationScreen}
            options={{ title: 'Optimizar Ruta' }}
          />
          <Stack.Screen 
            name="RouteDetails" 
            component={RouteDetailsScreen}
            options={{ title: 'Detalles de Ruta' }}
          />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen}
            options={{ title: 'Mi Perfil' }}
          />
          <Stack.Screen 
            name="DeliveryHistory" 
            component={DeliveryHistoryScreen}
            options={{ title: 'Historial de Entregas' }}
          />
          <Stack.Screen 
            name="AIChat" 
            component={AIChatScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </PaperProvider>
  );
}
