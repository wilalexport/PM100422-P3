const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Encryption key from environment variable (should be 32 bytes for AES-256)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex').slice(0, 32);
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Encrypt sensitive data using AES-256-CBC
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted text in format: iv:encryptedData
 */
exports.encrypt = (text) => {
  if (!text) return null;
  
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return IV and encrypted data separated by ':'
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt encrypted data
 * @param {string} encryptedText - Encrypted text in format: iv:encryptedData
 * @returns {string} - Decrypted plain text
 */
exports.decrypt = (encryptedText) => {
  if (!encryptedText) return null;
  
  try {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedData = parts.join(':');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Hash a value using bcrypt (for OTPs, etc.)
 * @param {string} value - Value to hash
 * @returns {Promise<string>} - Hashed value
 */
exports.hash = async (value) => {
  if (!value) return null;
  
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(value.toString(), salt);
  } catch (error) {
    console.error('Hashing error:', error);
    throw new Error('Failed to hash value');
  }
};

/**
 * Compare a plain value with a hashed value
 * @param {string} plainValue - Plain value to compare
 * @param {string} hashedValue - Hashed value to compare against
 * @returns {Promise<boolean>} - True if values match
 */
exports.compareHash = async (plainValue, hashedValue) => {
  if (!plainValue || !hashedValue) return false;
  
  try {
    return await bcrypt.compare(plainValue.toString(), hashedValue);
  } catch (error) {
    console.error('Hash comparison error:', error);
    return false;
  }
};

/**
 * Generate a strong random secret key
 * @param {number} length - Length of the key (default: 64)
 * @returns {string} - Random secret key
 */
exports.generateSecretKey = (length = 64) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Sanitize sensitive data for logging
 * @param {string} data - Data to sanitize
 * @param {number} visibleChars - Number of characters to show (default: 4)
 * @returns {string} - Sanitized data
 */
exports.sanitizeForLog = (data, visibleChars = 4) => {
  if (!data) return '';
  
  const str = data.toString();
  if (str.length <= visibleChars) {
    return '*'.repeat(str.length);
  }
  
  return str.substring(0, visibleChars) + '*'.repeat(str.length - visibleChars);
};
