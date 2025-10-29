import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const checkUserSession = async () => {
      try {
        const userToken = await AsyncStorage.getItem('userToken');
        const userInfo = await AsyncStorage.getItem('userInfo');
        
        if (userToken && userInfo) {
          setToken(userToken);
          setUser(JSON.parse(userInfo));
        }
      } catch (error) {
        console.error('Error checking user session:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkUserSession();
  }, []);

  const login = async (userToken, userInfo) => {
    try {
      await AsyncStorage.setItem('userToken', userToken);
      await AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));
      
      setToken(userToken);
      setUser(userInfo);
    } catch (error) {
      console.error('Error storing user info:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userInfo');
      
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error removing user info:', error);
    }
  };

  const updateUserInfo = async (updatedInfo) => {
    try {
      const currentUser = { ...user, ...updatedInfo };
      await AsyncStorage.setItem('userInfo', JSON.stringify(currentUser));
      setUser(currentUser);
    } catch (error) {
      console.error('Error updating user info:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUserInfo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
