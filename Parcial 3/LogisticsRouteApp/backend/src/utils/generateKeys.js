/**
 * Script para generar claves de encriptación seguras
 * Ejecutar con: node src/utils/generateKeys.js
 */

const crypto = require('crypto');

console.log('\n===========================================');
console.log('🔐 GENERADOR DE CLAVES DE SEGURIDAD');
console.log('===========================================\n');

// Generar JWT Secret (64 bytes)
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('JWT_SECRET (64 bytes):');
console.log(jwtSecret);
console.log('');

// Generar Encryption Key para AES-256 (32 bytes = 256 bits)
const encryptionKey = crypto.randomBytes(32).toString('hex').slice(0, 32);
console.log('ENCRYPTION_KEY (32 caracteres para AES-256):');
console.log(encryptionKey);
console.log('');

console.log('===========================================');
console.log('📋 INSTRUCCIONES:');
console.log('===========================================');
console.log('1. Copia estas claves a tu archivo .env');
console.log('2. NUNCA compartas estas claves');
console.log('3. Usa claves diferentes para desarrollo y producción');
console.log('4. Guarda las claves de producción en un lugar seguro');
console.log('===========================================\n');

console.log('Ejemplo de configuración en .env:');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`ENCRYPTION_KEY=${encryptionKey}`);
console.log('');
