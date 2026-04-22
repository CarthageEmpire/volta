import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { adminDb } from '../lib/firebase.js';
import { calculateAge, normalizePhone, nowIso, requireRole } from '../lib/helpers.js';
import { reviewVerificationSchema, verificationSubmissionSchema } from '../schemas.js';

export const submitDriverVerification = onCall(async (request) => {
  const actor = requireRole(request, ['driver']);
  const input = verificationSubmissionSchema.parse(request.data);
  const userRef = adminDb.collection('users').doc(actor.uid);
  const userSnapshot = await userRef.get();
  const user = userSnapshot.data();

  if (!user || user.role !== 'driver') {
    throw new HttpsError('failed-precondition', 'Only drivers can submit verification.');
  }

  if (calculateAge(input.dateOfBirth) < 21) {
    throw new HttpsError('failed-precondition', 'Driver must be at least 21 years old.');
  }

  const requestId = `verification-${actor.uid}`;
  const submittedAt = nowIso();
  const verificationRequest = {
    id: requestId,
    userId: actor.uid,
    status: 'pending',
    submittedAt,
    reviewedAt: '',
    reviewedBy: '',
    rejectionReason: '',
    cityOfResidence: input.cityOfResidence.trim(),
    documents: input.documents,
    applicantName: input.fullName.trim(),
    applicantEmail: user.email,
    applicantPhone: normalizePhone(input.phone),
  };

  await userRef.set(
    {
      fullName: input.fullName.trim(),
      dateOfBirth: input.dateOfBirth,
      gender: input.gender,
      city: input.cityOfResidence.trim(),
      phone: normalizePhone(input.phone),
      phoneVerified: input.phoneVerified,
      verificationStatus: 'pending',
    },
    { merge: true },
  );

  await adminDb.collection('verificationRequests').doc(requestId).set(verificationRequest, {
    merge: true,
  });

  return verificationRequest;
});

export const reviewDriverVerification = onCall(async (request) => {
  const actor = requireRole(request, ['admin']);
  const input = reviewVerificationSchema.parse(request.data);
  const requestRef = adminDb.collection('verificationRequests').doc(input.requestId);
  const requestSnapshot = await requestRef.get();
  const verification = requestSnapshot.data();

  if (!verification) {
    throw new HttpsError('not-found', 'Verification request not found.');
  }

  if (input.decision === 'approved') {
    const documents = Array.isArray(verification.documents) ? verification.documents : [];
    const documentTypes = new Set(
      documents.map((document) => String((document as { type?: string }).type ?? '')),
    );

    if (documentTypes.size !== 4) {
      throw new HttpsError('failed-precondition', 'All required driver documents must be present before approval.');
    }
  }

  const reviewedAt = nowIso();

  await requestRef.set(
    {
      status: input.decision,
      reviewedAt,
      reviewedBy: actor.uid,
      rejectionReason: input.decision === 'rejected' ? input.rejectionReason ?? '' : '',
    },
    { merge: true },
  );

  await adminDb.collection('users').doc(String(verification.userId)).set(
    {
      verificationStatus: input.decision,
    },
    { merge: true },
  );

  return {
    requestId: input.requestId,
    status: input.decision,
    reviewedAt,
  };
});
