import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { adminAuth, adminDb } from '../lib/firebase.js';
import { normalizeEmail, normalizePhone, nowIso, requireAuth } from '../lib/helpers.js';
import { bootstrapProfileSchema, updateLocaleSchema } from '../schemas.js';

type UserProfileRole = 'passenger' | 'driver' | 'admin';

function sanitizeRole(value: unknown): UserProfileRole {
  if (value === 'driver' || value === 'admin' || value === 'passenger') {
    return value;
  }

  return 'passenger';
}

function deriveFullName(candidate: unknown, email: string) {
  if (typeof candidate === 'string' && candidate.trim().length >= 2) {
    return candidate.trim();
  }

  const localPart = email.split('@')[0] ?? 'utilisateur';
  const cleaned = localPart.replace(/[._-]+/g, ' ').trim();
  if (cleaned.length >= 2) {
    return cleaned.replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  return 'Utilisateur Volta';
}

function deriveCity(candidate: unknown) {
  if (typeof candidate === 'string' && candidate.trim().length >= 2) {
    return candidate.trim();
  }

  return 'Tunis';
}

export const bootstrapUserProfile = onCall(async (request) => {
  const auth = requireAuth(request);
  const input = bootstrapProfileSchema.parse(request.data);
  const userRecord = await adminAuth.getUser(auth.uid);
  const role = input.role;

  const existing = await adminDb.collection('users').doc(auth.uid).get();
  const createdAt = existing.exists ? String(existing.data()?.createdAt ?? nowIso()) : nowIso();
  const userProfile = {
    id: auth.uid,
    role,
    email: normalizeEmail(userRecord.email ?? input.email),
    phone: input.phone ? normalizePhone(input.phone) : '',
    fullName: input.fullName.trim(),
    city: input.city.trim(),
    locale: 'fr-TN',
    createdAt,
    dateOfBirth: existing.data()?.dateOfBirth ?? '',
    gender: existing.data()?.gender ?? '',
    phoneVerified: Boolean(input.phone),
    verificationStatus: role === 'driver' ? 'not_started' : 'not_started',
    driverLineId: existing.data()?.driverLineId ?? '',
    avatarColor: existing.data()?.avatarColor ?? '#0040a1',
  };

  await adminDb.collection('users').doc(auth.uid).set(userProfile, { merge: true });
  await adminAuth.setCustomUserClaims(auth.uid, { role });

  return userProfile;
});

export const ensureUserProfile = onCall(async (request) => {
  const auth = requireAuth(request);
  const userRecord = await adminAuth.getUser(auth.uid);
  const existing = await adminDb.collection('users').doc(auth.uid).get();

  if (existing.exists) {
    const existingData = existing.data() ?? {};
    const role = sanitizeRole(existingData.role ?? auth.token.role);
    await adminAuth.setCustomUserClaims(auth.uid, { role });
    return {
      id: auth.uid,
      ...existingData,
      role,
    };
  }

  const data = (request.data ?? {}) as Record<string, unknown>;
  const email = normalizeEmail(userRecord.email ?? String(data.email ?? ''));
  if (!email) {
    throw new HttpsError('failed-precondition', 'A verified email is required to create a profile.');
  }

  const role = sanitizeRole(data.role ?? auth.token.role);
  const userProfile = {
    id: auth.uid,
    role,
    email,
    phone: typeof data.phone === 'string' && data.phone.trim().length > 0 ? normalizePhone(data.phone) : '',
    fullName: deriveFullName(data.fullName ?? userRecord.displayName, email),
    city: deriveCity(data.city),
    locale: 'fr-TN',
    createdAt: nowIso(),
    dateOfBirth: '',
    gender: '',
    phoneVerified: Boolean(data.phone),
    verificationStatus: 'not_started',
    driverLineId: '',
    avatarColor: '#0040a1',
  };

  await adminDb.collection('users').doc(auth.uid).set(userProfile, { merge: true });
  await adminAuth.setCustomUserClaims(auth.uid, { role });

  return userProfile;
});

export const updateUserLocale = onCall(async (request) => {
  const auth = requireAuth(request);
  const input = updateLocaleSchema.parse(request.data);

  await adminDb.collection('users').doc(auth.uid).set(
    {
      locale: input.locale,
    },
    { merge: true },
  );

  return { locale: input.locale };
});
