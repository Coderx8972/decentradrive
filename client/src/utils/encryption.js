// client/src/utils/encryption.js - Enhanced version

/**
 * Generate a random AES-256-GCM key
 */
export async function generateEncryptionKey() {
    const key = await window.crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
    return key;
}

/**
 * Export key as base64 string
 */
export async function exportKey(key) {
    const exported = await window.crypto.subtle.exportKey("raw", key);
    return arrayBufferToBase64(exported);
}

/**
 * Import key from base64 string
 */
export async function importKey(keyString) {
    const keyData = base64ToArrayBuffer(keyString);
    return await window.crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

/**
 * Encrypt data with AES-256-GCM
 */
export async function encryptData(data, key) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        data
    );

    const result = new Uint8Array(iv.length + encrypted.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(encrypted), iv.length);
    return result;
}

/**
 * Decrypt data with AES-256-GCM
 */
export async function decryptData(encryptedData, key) {
    const iv = encryptedData.slice(0, 12);
    const ciphertext = encryptedData.slice(12);

    const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        ciphertext
    );
    return decrypted;
}

/**
 * Derive encryption key from wallet signature
 */
export async function deriveKeyFromSignature(signature, salt = "") {
    const encoder = new TextEncoder();
    const data = encoder.encode(signature + salt);

    const hash = await window.crypto.subtle.digest("SHA-256", data);
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        hash,
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    const derivedKey = await window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: encoder.encode("decentradrive-salt-v1"),
            iterations: 100000,
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );

    return derivedKey;
}

/**
 * Re-encrypt a key for another user
 */
export async function reEncryptKeyForUser(originalKey, recipientSignature) {
    const exportedKey = await exportKey(originalKey);
    const recipientKey = await deriveKeyFromSignature(recipientSignature);
    const encryptedForRecipient = await encryptData(
        new TextEncoder().encode(exportedKey),
        recipientKey
    );
    return arrayBufferToBase64(encryptedForRecipient);
}

/**
 * Decrypt a re-encrypted key
 */
export async function decryptReEncryptedKey(encryptedKey, userSignature) {
    const userKey = await deriveKeyFromSignature(userSignature);
    const encryptedData = base64ToArrayBuffer(encryptedKey);
    const decrypted = await decryptData(encryptedData, userKey);
    const exportedKey = new TextDecoder().decode(decrypted);
    return await importKey(exportedKey);
}

/**
 * Hash password for password-protected links
 */
export async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await window.crypto.subtle.digest("SHA-256", data);
    return arrayBufferToBase64(hash);
}

/**
 * Generate secure random password
 */
export function generateRandomPassword(length = 12) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    const randomValues = new Uint8Array(length);
    window.crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
        result += chars.charAt(randomValues[i] % chars.length);
    }
    return result;
}

// Helper functions
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Sign message with wallet for key derivation
 */
export async function signMessageForEncryption(signer, message = "Sign to derive encryption key") {
    const address = await signer.getAddress();
    const signature = await signer.signMessage(message);
    return { signature, address };
}
