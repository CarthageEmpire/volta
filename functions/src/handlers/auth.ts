import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { adminAuth, adminDb } from '../lib/firebase.js';
import { normalizeEmail, normalizePhone, nowIso, requireAuth } from '../lib/helpers.js';
import { bootstrapProfileSchema, updateLocaleSchema } from '../schemas.js';

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
