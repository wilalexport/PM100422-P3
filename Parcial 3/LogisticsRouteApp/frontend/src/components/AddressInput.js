import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { TextInput, IconButton } from 'react-native-paper';
import * as Location from 'expo-location';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

const AddressInput = ({ index, value, onAddressSelected, onRemove, showRemoveButton = true }) => {
  const [address, setAddress] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Debounce function to limit API calls
  const debounce = (func, delay) => {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(this, args), delay);
    };
  };
  
  // Debounced function for getting address suggestions
  const getSuggestions = debounce(async (text) => {
    if (!text || text.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    try {
      setLoading(true);
      // Call Google Places Autocomplete API with better parameters
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${GOOGLE_MAPS_API_KEY}&language=es&components=country:sv`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.predictions && data.predictions.length > 0) {
        setSuggestions(data.predictions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error getting address suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  }, 300); // Reduced delay for faster response
  
  const handleTextChange = (text) => {
    setAddress(text);
    if (text.length >= 3) {
      getSuggestions(text);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };
  
  const handleSelectSuggestion = async (suggestion) => {
    setAddress(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);
    
    try {
      // Get coordinates for the selected address using place_id for better accuracy
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?place_id=${suggestion.place_id}&key=${GOOGLE_MAPS_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        onAddressSelected(suggestion.description, { latitude: lat, longitude: lng });
      }
    } catch (error) {
      console.error('Error getting coordinates:', error);
    }
  };

  return (
    <View style={[styles.container, showSuggestions && styles.containerActive]}>
      <View style={styles.inputContainer}>
        <TextInput
          mode="outlined"
          label={`Destino ${index + 1}`}
          value={address}
          onChangeText={handleTextChange}
          style={styles.input}
          right={<TextInput.Icon icon={loading ? "loading" : "map-marker"} color="#0047AB" />}
          blurOnSubmit={false}
          returnKeyType="done"
        />
        
        {showRemoveButton && (
          <IconButton
            icon="close"
            size={20}
            onPress={onRemove}
            style={styles.removeButton}
          />
        )}
      </View>
      
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((suggestion) => (
            <TouchableOpacity
              key={suggestion.place_id}
              style={styles.suggestionItem}
              onPress={() => handleSelectSuggestion(suggestion)}
            >
              <Text numberOfLines={1}>{suggestion.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1,
    marginBottom: 8,
  },
  containerActive: {
    zIndex: 9999,
    elevation: 9999,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  removeButton: {
    marginLeft: 8,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 65,
    left: 0,
    right: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0047AB',
    zIndex: 10000,
    elevation: 10,
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  suggestionItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
});

export default AddressInput;
