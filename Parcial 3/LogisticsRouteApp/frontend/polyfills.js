// Polyfill para crypto (necesario para bcrypt en React Native)
import * as Crypto from 'expo-crypto';

// Configurar bcrypt para usar expo-crypto
import * as bcrypt from 'bcryptjs';

bcrypt.setRandomFallback((len) => {
  // Generar bytes aleatorios usando expo-crypto
  const randomBytes = Crypto.getRandomBytes(len);
  return new Uint8Array(randomBytes);
});

// Polyfill para URL.canParse que falta en Node.js < 19
if (!URL.canParse) {
  URL.canParse = function(url, base) {
    try {
      new URL(url, base);
      return true;
    } catch {
      return false;
    }
  };
}
