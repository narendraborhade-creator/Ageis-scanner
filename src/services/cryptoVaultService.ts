import { VaultCredential, EncryptedVaultRecord, EncryptedVaultPackage } from '../types';

const VAULT_STORAGE_KEY = 'aegis_encrypted_credentials_vault';
const VERIFIER_MAGIC = 'AEGIS_VAULT_KEY_VALIDATED_2026';
export const DEFAULT_DEMO_PASSPHRASE = 'AegisVault2026!';

// In-memory decrypted session cache (cleared on lock or page reload)
let activeSessionKey: CryptoKey | null = null;
let activeMasterPassphrase: string | null = null;
let activeDecryptedCredentials: VaultCredential[] | null = null;

// Utility functions for Web Crypto ArrayBuffer <-> Base64
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Derive AES-GCM 256-bit key from passphrase and salt using PBKDF2 (100,000 iterations)
async function deriveAesKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passphraseBytes = encoder.encode(passphrase);

  // Import raw passphrase material
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passphraseBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // Derive AES-GCM 256-bit key
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt plaintext string using AES-GCM
async function encryptWithKey(key: CryptoKey, plaintext: string): Promise<{ iv: string; ciphertext: string }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as any,
    },
    key,
    data as any
  );

  return {
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(encryptedBuffer),
  };
}

// Decrypt AES-GCM ciphertext
async function decryptWithKey(key: CryptoKey, ivBase64: string, ciphertextBase64: string): Promise<string> {
  const iv = base64ToBuffer(ivBase64);
  const ciphertext = base64ToBuffer(ciphertextBase64);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as any,
    },
    key,
    ciphertext as any
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

// Calculate Password Strength and Entropy
export function calculatePasswordEntropy(password: string): {
  entropy: number;
  strength: 'weak' | 'fair' | 'strong' | 'military';
  scorePercent: number;
} {
  if (!password) {
    return { entropy: 0, strength: 'weak', scorePercent: 0 };
  }

  let charsetSize = 0;
  if (/[a-z]/.test(password)) charsetSize += 26;
  if (/[A-Z]/.test(password)) charsetSize += 26;
  if (/[0-9]/.test(password)) charsetSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 33;

  const entropy = Math.round(password.length * Math.log2(charsetSize || 1));

  let strength: 'weak' | 'fair' | 'strong' | 'military' = 'weak';
  let scorePercent = Math.min(100, Math.round((entropy / 90) * 100));

  if (entropy >= 80 && password.length >= 14) {
    strength = 'military';
  } else if (entropy >= 60 && password.length >= 11) {
    strength = 'strong';
  } else if (entropy >= 40 && password.length >= 8) {
    strength = 'fair';
  } else {
    strength = 'weak';
  }

  return { entropy, strength, scorePercent };
}

// Password Generator using cryptographically strong random values
export function generateSecurePassword(options: {
  length: number;
  useUpper: boolean;
  useLower: boolean;
  useNumbers: boolean;
  useSymbols: boolean;
}): string {
  const length = Math.max(8, Math.min(64, options.length));
  let chars = '';
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowers = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (options.useUpper) chars += uppers;
  if (options.useLower) chars += lowers;
  if (options.useNumbers) chars += numbers;
  if (options.useSymbols) chars += symbols;

  if (!chars) chars = lowers + numbers;

  // Guarantee at least one character from each selected set
  const requiredPool: string[] = [];
  if (options.useUpper) requiredPool.push(uppers[Math.floor(Math.random() * uppers.length)]);
  if (options.useLower) requiredPool.push(lowers[Math.floor(Math.random() * lowers.length)]);
  if (options.useNumbers) requiredPool.push(numbers[Math.floor(Math.random() * numbers.length)]);
  if (options.useSymbols) requiredPool.push(symbols[Math.floor(Math.random() * symbols.length)]);

  const randomValues = new Uint32Array(length);
  window.crypto.getRandomValues(randomValues);

  let result = '';
  for (let i = 0; i < length - requiredPool.length; i++) {
    result += chars[randomValues[i] % chars.length];
  }

  // Append required characters and shuffle
  result += requiredPool.join('');
  const arr = result.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomValues[i] % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr.join('');
}

// Initial pre-seeded credentials for immediate demo verification (generic security examples)
const SEED_CREDENTIALS: Omit<VaultCredential, 'id' | 'createdAt' | 'updatedAt' | 'strength'>[] = [
  {
    title: 'GitHub Enterprise Portal',
    url: 'https://github.com',
    domain: 'github.com',
    username: 'security-analyst',
    password: 'ghp_AegisSecToken99283#ZeroTrust',
    category: 'Developer',
    notes: 'SSH deployment key & PAT token. Rotated every 90 days.',
  },
  {
    title: 'Cloudflare Zero Trust Dashboard',
    url: 'https://dash.cloudflare.com',
    domain: 'cloudflare.com',
    username: 'ops.auditor@aegis-browser.internal',
    password: 'Cf_Shield*ZeroTrust2026_SecureKey!',
    category: 'Cloud',
    notes: 'DoH gateway configuration, WAF custom rules, and edge worker tokens.',
  },
  {
    title: 'Google Workspace Cloud Bastion',
    url: 'https://admin.google.com',
    domain: 'google.com',
    username: 'admin@aegis-browser.internal',
    password: 'GSuite-Passphrase$AES256GCM#Hardened',
    category: 'Logins',
    notes: 'Primary SAML single sign-on anchor for security testing.',
  },
  {
    title: 'Corporate Kubernetes Bastion',
    url: 'https://bastion.corp.local',
    domain: 'corp.local',
    username: 'cluster-bastion-admin',
    password: 'K8s_Bastion#RootSecret_4096_Key!',
    category: 'Developer',
    notes: 'Internal cluster egress proxy. Protected by Hardware FIDO2 2FA.',
  },
];

const VAULT_CLEAN_MIGRATION_V2 = 'aegis_vault_cleaned_v2';

// Initialize default encrypted vault in localStorage if absent
export async function ensureVaultInitialized(): Promise<boolean> {
  const isMigrated = localStorage.getItem(VAULT_CLEAN_MIGRATION_V2);
  if (!isMigrated) {
    // Purge old seed vault that may have held personal demo records
    localStorage.removeItem(VAULT_STORAGE_KEY);
    localStorage.setItem(VAULT_CLEAN_MIGRATION_V2, 'true');
  }

  const existing = localStorage.getItem(VAULT_STORAGE_KEY);
  if (existing) return true;

  try {
    const saltBytes = window.crypto.getRandomValues(new Uint8Array(16));
    const salt = bufferToBase64(saltBytes);
    const key = await deriveAesKey(DEFAULT_DEMO_PASSPHRASE, saltBytes);

    const verifier = await encryptWithKey(key, VERIFIER_MAGIC);

    const records: EncryptedVaultRecord[] = [];
    for (const seed of SEED_CREDENTIALS) {
      const fullCred: VaultCredential = {
        ...seed,
        id: 'cred-' + Math.random().toString(36).substring(2, 10),
        strength: calculatePasswordEntropy(seed.password).strength,
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const encrypted = await encryptWithKey(key, JSON.stringify(fullCred));
      records.push({
        id: fullCred.id,
        iv: encrypted.iv,
        ciphertext: encrypted.ciphertext,
        domain: fullCred.domain,
        category: fullCred.category,
        updatedAt: fullCred.updatedAt,
      });
    }

    const pkg: EncryptedVaultPackage = {
      version: 1,
      salt: salt,
      verifierIv: verifier.iv,
      verifierCiphertext: verifier.ciphertext,
      records: records,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      autoLockMinutes: 15,
    };

    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(pkg));
    return true;
  } catch (err) {
    console.error('Failed to initialize seed vault:', err);
    return false;
  }
}

// Unlock Vault with Master Passphrase
export async function unlockVault(passphrase: string): Promise<VaultCredential[]> {
  await ensureVaultInitialized();
  const raw = localStorage.getItem(VAULT_STORAGE_KEY);
  if (!raw) throw new Error('Vault storage not found.');

  const pkg: EncryptedVaultPackage = JSON.parse(raw);
  const saltBytes = base64ToBuffer(pkg.salt);

  const derivedKey = await deriveAesKey(passphrase, saltBytes);

  // Validate verifier token
  try {
    const decryptedMagic = await decryptWithKey(derivedKey, pkg.verifierIv, pkg.verifierCiphertext);
    if (decryptedMagic !== VERIFIER_MAGIC) {
      throw new Error('Invalid master passphrase.');
    }
  } catch {
    throw new Error('Invalid master passphrase. Web Crypto AES-GCM authentication tag mismatch.');
  }

  // Decrypt all credential records
  const decryptedList: VaultCredential[] = [];
  for (const record of pkg.records) {
    try {
      const plaintextJson = await decryptWithKey(derivedKey, record.iv, record.ciphertext);
      const parsed: VaultCredential = JSON.parse(plaintextJson);
      decryptedList.push(parsed);
    } catch (err) {
      console.warn(`Could not decrypt record ${record.id}:`, err);
    }
  }

  // Save in active session
  activeSessionKey = derivedKey;
  activeMasterPassphrase = passphrase;
  activeDecryptedCredentials = decryptedList;

  return decryptedList;
}

// Lock the vault immediately
export function lockVault(): void {
  activeSessionKey = null;
  activeMasterPassphrase = null;
  activeDecryptedCredentials = null;
}

// Check if currently unlocked
export function isVaultUnlocked(): boolean {
  return activeSessionKey !== null && activeDecryptedCredentials !== null;
}

// Get cached credentials if unlocked
export function getActiveSessionCredentials(): VaultCredential[] | null {
  return activeDecryptedCredentials;
}

// Add or update a credential
export async function saveCredentialToVault(
  credentialData: Omit<VaultCredential, 'id' | 'createdAt' | 'updatedAt' | 'strength'> & { id?: string }
): Promise<VaultCredential[]> {
  if (!activeSessionKey || !activeMasterPassphrase) {
    throw new Error('Vault is locked. Unlock vault to save credentials.');
  }

  const raw = localStorage.getItem(VAULT_STORAGE_KEY);
  if (!raw) throw new Error('Vault storage missing.');
  const pkg: EncryptedVaultPackage = JSON.parse(raw);

  const id = credentialData.id || 'cred-' + Math.random().toString(36).substring(2, 10);
  const now = new Date().toISOString();

  const cred: VaultCredential = {
    ...credentialData,
    id,
    strength: calculatePasswordEntropy(credentialData.password).strength,
    createdAt: credentialData.id ? (activeDecryptedCredentials?.find((c) => c.id === id)?.createdAt || now) : now,
    updatedAt: now,
  };

  const encrypted = await encryptWithKey(activeSessionKey, JSON.stringify(cred));

  // Update in records array
  const existingIdx = pkg.records.findIndex((r) => r.id === id);
  const newRecord: EncryptedVaultRecord = {
    id,
    iv: encrypted.iv,
    ciphertext: encrypted.ciphertext,
    domain: cred.domain,
    category: cred.category,
    updatedAt: now,
  };

  if (existingIdx >= 0) {
    pkg.records[existingIdx] = newRecord;
  } else {
    pkg.records.unshift(newRecord);
  }

  pkg.updatedAt = now;
  localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(pkg));

  // Update in-memory session
  if (activeDecryptedCredentials) {
    const memIdx = activeDecryptedCredentials.findIndex((c) => c.id === id);
    if (memIdx >= 0) {
      activeDecryptedCredentials[memIdx] = cred;
    } else {
      activeDecryptedCredentials.unshift(cred);
    }
  }

  return activeDecryptedCredentials || [cred];
}

// Delete a credential
export async function deleteCredentialFromVault(id: string): Promise<VaultCredential[]> {
  if (!activeSessionKey) {
    throw new Error('Vault is locked.');
  }

  const raw = localStorage.getItem(VAULT_STORAGE_KEY);
  if (!raw) throw new Error('Vault storage missing.');
  const pkg: EncryptedVaultPackage = JSON.parse(raw);

  pkg.records = pkg.records.filter((r) => r.id !== id);
  pkg.updatedAt = new Date().toISOString();
  localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(pkg));

  if (activeDecryptedCredentials) {
    activeDecryptedCredentials = activeDecryptedCredentials.filter((c) => c.id !== id);
  }

  return activeDecryptedCredentials || [];
}

// Export raw encrypted vault package as JSON (zero plaintext exposed)
export function exportEncryptedVaultFile(): string {
  const raw = localStorage.getItem(VAULT_STORAGE_KEY);
  if (!raw) throw new Error('No vault to export.');
  return raw;
}

// Import encrypted vault package
export function importEncryptedVaultFile(jsonString: string): boolean {
  try {
    const pkg: EncryptedVaultPackage = JSON.parse(jsonString);
    if (!pkg.salt || !pkg.verifierIv || !Array.isArray(pkg.records)) {
      throw new Error('Invalid vault package schema.');
    }
    localStorage.setItem(VAULT_STORAGE_KEY, jsonString);
    lockVault();
    return true;
  } catch (err: any) {
    throw new Error(err.message || 'Corrupted vault file.');
  }
}
