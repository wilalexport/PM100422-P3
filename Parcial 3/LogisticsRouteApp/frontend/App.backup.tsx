import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import SupabaseTestScreen from './src/screens/SupabaseTestScreen';

/**
 * App de prueba para verificar conexión a Supabase
 * Para usar: Renombra temporalmente App.js a App.backup.js
 * y este archivo a App.js, luego ejecuta: npm start
 */
export default function App() {
  return (
    <PaperProvider>
      <SupabaseTestScreen />
    </PaperProvider>
  );
}
