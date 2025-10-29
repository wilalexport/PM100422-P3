import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../Libs/supabase';

interface TestResult {
  test: string;
  status: string;
  success: boolean;
}

/**
 * Componente de prueba para verificar la conexión a Supabase
 * Usar solo para testing, no incluir en producción
 */
export default function SupabaseConnectionTest() {
  const [status, setStatus] = useState<string>('Conectando...');
  const [details, setDetails] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    const results: TestResult[] = [];

    try {
      // Test 1: Verificar que el cliente existe
      results.push({
        test: '1. Cliente Supabase',
        status: supabase ? '✅ Inicializado' : '❌ No inicializado',
        success: !!supabase
      });

      // Test 2: Verificar URL
      const url = (supabase as any).supabaseUrl;
      results.push({
        test: '2. URL de Supabase',
        status: url ? `✅ ${url}` : '❌ No configurada',
        success: !!url
      });

      // Test 3: Intentar contar usuarios (sin autenticación)
      try {
        const { count, error } = await supabase
          .from('Users')
          .select('*', { count: 'exact', head: true });

        if (error) {
          results.push({
            test: '3. Consulta a tabla Users',
            status: `⚠️ ${error.message}`,
            success: false
          });
        } else {
          results.push({
            test: '3. Consulta a tabla Users',
            status: `✅ ${count || 0} usuarios encontrados`,
            success: true
          });
        }
      } catch (err) {
        results.push({
          test: '3. Consulta a tabla Users',
          status: `❌ Error: ${err.message}`,
          success: false
        });
      }

      // Test 4: Verificar tabla OTPs
      try {
        const { count, error } = await supabase
          .from('OTPs')
          .select('*', { count: 'exact', head: true });

        if (error) {
          results.push({
            test: '4. Consulta a tabla OTPs',
            status: `⚠️ ${error.message}`,
            success: false
          });
        } else {
          results.push({
            test: '4. Consulta a tabla OTPs',
            status: `✅ Tabla accesible`,
            success: true
          });
        }
      } catch (err) {
        results.push({
          test: '4. Consulta a tabla OTPs',
          status: `❌ Error: ${err.message}`,
          success: false
        });
      }

      // Test 5: Verificar tabla Deliveries
      try {
        const { count, error } = await supabase
          .from('Deliveries')
          .select('*', { count: 'exact', head: true });

        if (error) {
          results.push({
            test: '5. Consulta a tabla Deliveries',
            status: `⚠️ ${error.message}`,
            success: false
          });
        } else {
          results.push({
            test: '5. Consulta a tabla Deliveries',
            status: `✅ Tabla accesible`,
            success: true
          });
        }
      } catch (err) {
        results.push({
          test: '5. Consulta a tabla Deliveries',
          status: `❌ Error: ${err.message}`,
          success: false
        });
      }

      setDetails(results);
      const allSuccess = results.every(r => r.success);
      setStatus(allSuccess ? '✅ CONEXIÓN EXITOSA' : '⚠️ ALGUNOS TESTS FALLARON');
      
    } catch (error) {
      setStatus('❌ ERROR DE CONEXIÓN');
      results.push({
        test: 'Error general',
        status: error.message,
        success: false
      });
      setDetails(results);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Test de Conexión a Supabase</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#0047AB" />
      ) : (
        <>
          <Text style={[
            styles.status,
            { color: status.includes('✅') ? '#2E7D32' : '#C62828' }
          ]}>
            {status}
          </Text>

          <View style={styles.detailsContainer}>
            {details.map((detail, index) => (
              <View key={index} style={styles.detailRow}>
                <Text style={styles.testName}>{detail.test}</Text>
                <Text style={[
                  styles.testStatus,
                  { color: detail.success ? '#2E7D32' : '#C62828' }
                ]}>
                  {detail.status}
                </Text>
              </View>
            ))}
          </View>

          <Text style={styles.note}>
            💡 Nota: Si ves errores de permisos RLS, es normal.{'\n'}
            Las políticas de seguridad se configuran en Supabase.
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  status: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 20,
    textAlign: 'center',
  },
  detailsContainer: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  detailRow: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  testName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  testStatus: {
    fontSize: 14,
  },
  note: {
    fontSize: 12,
    color: '#757575',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
