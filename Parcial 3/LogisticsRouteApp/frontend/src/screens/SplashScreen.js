import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { Text } from 'react-native-paper';

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    console.log('SplashScreen mounted');
    
    // Check if navigation is available
    if (!navigation) {
      console.error('Navigation prop is undefined');
      return;
    }
    
    const timer = setTimeout(() => {
      console.log('Navigating to Login');
      try {
        navigation.replace('Login');
      } catch (error) {
        console.error('Navigation error:', error);
      }
    }, 2500);
    
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../images/Logo-1.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.subtitle}>Optimiza tus entregas</Text>
      <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0047AB',
  },
  logoContainer: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  subtitle: {
    fontSize: 20,
    color: '#FFFFFF',
    marginTop: 8,
    opacity: 0.9,
  },
  loader: {
    marginTop: 40,
  },
});

export default SplashScreen;
