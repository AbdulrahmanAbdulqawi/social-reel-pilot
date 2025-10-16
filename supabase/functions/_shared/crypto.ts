// Encryption utilities for sensitive data
// Uses AES-GCM encryption with Web Crypto API

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM

/**
 * Derives an encryption key from the master secret
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  const secret = Deno.env.get('ENCRYPTION_SECRET');
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET not configured');
  }

  const encoder = new TextEncoder();
  const keyMaterial = encoder.encode(secret);
  
  // Hash the secret to get consistent 256-bit key
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyMaterial);
  
  return await crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: ALGORITHM },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a string value
 * Returns base64 encoded string in format: iv.ciphertext
 */
export async function encrypt(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  
  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    data
  );
  
  // Combine IV and ciphertext, then base64 encode
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts an encrypted string
 * Expects base64 encoded string in format: iv.ciphertext
 */
export async function decrypt(encrypted: string): Promise<string> {
  const key = await getEncryptionKey();
  
  // Decode base64
  const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  
  // Extract IV and ciphertext
  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}
