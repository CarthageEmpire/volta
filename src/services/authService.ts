import { AppState } from '../types';
import { normalizeEmail, normalizePhone } from './validationService';

interface AuthRecord {
  userId: string;
  email: string;
  phone?: string;
  passwordHash: string;
  salt: string;
}

interface SeedCredential {
  userId: string;
  email: string;
  phone?: string;
  password: string;
}

const AUTH_STORAGE_KEY = 'volta-auth-state-v1';

const DEFAULT_CREDENTIALS: SeedCredential[] = [
  {
    userId: 'admin-1',
    email: 'admin@volta.tn',
    password: 'admin123',
  },
  {
    userId: 'passenger-1',
    email: 'imen@volta.tn',
    phone: '+21622111222',
    password: 'volta123',
  },
  {
    userId: 'driver-1',
    email: 'hamed@volta.tn',
    phone: '+21655123456',
    password: 'volta123',
  },
  {
    userId: 'driver-2',
    email: 'salma.driver@volta.tn',
    phone: '+21699123456',
    password: 'volta123',
  },
];

function hasWindow() {
  return typeof window !== 'undefined';
}

function bufferToHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}

function normalizeRecord(record: AuthRecord): AuthRecord | null {
  if (
    typeof record.userId !== 'string' ||
    typeof record.email !== 'string' ||
    typeof record.passwordHash !== 'string' ||
    typeof record.salt !== 'string'
  ) {
    return null;
  }

  return {
    userId: record.userId,
    email: normalizeEmail(record.email),
    phone: record.phone ? normalizePhone(record.phone) : undefined,
    passwordHash: record.passwordHash,
    salt: record.salt,
  };
}

function readLegacyCredentialsFromState() {
  if (!hasWindow()) {
    return [];
  }

  const rawState = window.localStorage.getItem('volta-app-state-v2');
  if (!rawState) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawState) as { users?: Array<Record<string, unknown>> };
    if (!Array.isArray(parsed.users)) {
      return [];
    }

    return parsed.users
      .filter((user) => typeof user.password === 'string' && typeof user.email === 'string')
      .map((user) => ({
        userId: String(user.id),
        email: String(user.email),
        phone: typeof user.phone === 'string' ? String(user.phone) : undefined,
        password: String(user.password),
      }));
  } catch {
    return [];
  }
}

function createSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashPassword(password: string, salt: string) {
  const payload = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', payload);
  return bufferToHex(digest);
}

export function loadAuthStore() {
  if (!hasWindow()) {
    return [] as AuthRecord[];
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return [] as AuthRecord[];
  }

  try {
    const parsed = JSON.parse(raw) as AuthRecord[];
    if (!Array.isArray(parsed)) {
      return [] as AuthRecord[];
    }

    return parsed
      .map((record) => normalizeRecord(record))
      .filter((record): record is AuthRecord => record !== null);
  } catch {
    return [] as AuthRecord[];
  }
}

export function clearAuthStore() {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function saveAuthStore(records: AuthRecord[]) {
  if (!hasWindow()) {
    return;
  }

  const normalized = records
    .map((record) => normalizeRecord(record))
    .filter((record): record is AuthRecord => record !== null);

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalized));
}

async function createAuthRecord(credential: SeedCredential) {
  const salt = createSalt();
  const passwordHash = await hashPassword(credential.password, salt);

  return {
    userId: credential.userId,
    email: normalizeEmail(credential.email),
    phone: credential.phone ? normalizePhone(credential.phone) : undefined,
    passwordHash,
    salt,
  } satisfies AuthRecord;
}

export async function ensureAuthStore(state: AppState) {
  const existing = loadAuthStore();
  if (existing.length > 0) {
    return existing;
  }

  const legacyCredentials = readLegacyCredentialsFromState();
  const seedSource =
    legacyCredentials.length > 0
      ? legacyCredentials
      : DEFAULT_CREDENTIALS.filter((credential) =>
          state.users.some((user) => user.id === credential.userId),
        );

  const records = await Promise.all(seedSource.map((credential) => createAuthRecord(credential)));
  saveAuthStore(records);
  return records;
}

export async function createAuthRecordForUser(params: {
  userId: string;
  email: string;
  phone?: string;
  password: string;
}) {
  return createAuthRecord({
    userId: params.userId,
    email: params.email,
    phone: params.phone,
    password: params.password,
  });
}

export function findAuthRecord(records: AuthRecord[], identifier: { email?: string; phone?: string }) {
  const email = identifier.email ? normalizeEmail(identifier.email) : undefined;
  const phone = identifier.phone ? normalizePhone(identifier.phone) : undefined;

  return records.find(
    (record) =>
      (email && record.email === email) ||
      (phone && record.phone && record.phone === phone),
  );
}
