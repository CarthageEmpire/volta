import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { adminDb } from '../lib/firebase.js';
import { createId, normalizeText, nowIso, requireRole } from '../lib/helpers.js';
import { createRideSchema, toggleLiveSharingSchema } from '../schemas.js';

export const createRide = onCall(async (request) => {
  const actor = requireRole(request, ['driver']);
  const input = createRideSchema.parse(request.data);
  const userSnapshot = await adminDb.collection('users').doc(actor.uid).get();
  const user = userSnapshot.data();

  if (!user || user.role !== 'driver') {
    throw new HttpsError('failed-precondition', 'Only drivers can create rides.');
  }

  if (user.verificationStatus !== 'approved') {
    throw new HttpsError('permission-denied', 'Driver verification must be approved first.');
  }

  const duplicateSnapshot = await adminDb
    .collection('rides')
    .where('driverUserId', '==', actor.uid)
    .get();

  const normalizedDeparture = normalizeText(input.departureCity).toLowerCase();
  const normalizedDestination = normalizeText(input.destinationCity).toLowerCase();
  const normalizedPlate = normalizeText(input.plateNumber).toUpperCase();
  const duplicate = duplicateSnapshot.docs.some((doc) => {
    const ride = doc.data();
    return (
      ride.status === 'scheduled' &&
      String(ride.departureCity).toLowerCase() === normalizedDeparture &&
      String(ride.destinationCity).toLowerCase() === normalizedDestination &&
      String(ride.departureAt) === input.departureAt &&
      String(ride.plateNumber).toUpperCase() === normalizedPlate
    );
  });

  if (duplicate) {
    throw new HttpsError('already-exists', 'A duplicate ride already exists for this departure.');
  }

  const rideId = createId('ride');
  const ride = {
    id: rideId,
    driverUserId: actor.uid,
    driverName: user.fullName,
    departureCity: normalizeText(input.departureCity),
    destinationCity: normalizeText(input.destinationCity),
    departureAt: input.departureAt,
    availableSeats: input.availableSeats,
    totalSeats: input.availableSeats,
    priceTnd: input.priceTnd,
    vehicleModel: normalizeText(input.vehicleModel),
    plateNumber: normalizedPlate,
    vehiclePhotoName: input.vehiclePhotoName ?? '',
    vehiclePhotoPath: input.vehiclePhotoPath ?? '',
    vehiclePhotoUrl: input.vehiclePhotoUrl ?? '',
    status: 'scheduled',
    liveProofEnabled: true,
    createdAt: nowIso(),
  };

  await adminDb.collection('rides').doc(rideId).set(ride);
  return ride;
});

export const toggleDriverLiveSharing = onCall(async (request) => {
  const actor = requireRole(request, ['driver']);
  const input = toggleLiveSharingSchema.parse(request.data);
  const userSnapshot = await adminDb.collection('users').doc(actor.uid).get();
  const user = userSnapshot.data();

  if (!user || user.role !== 'driver' || user.verificationStatus !== 'approved') {
    throw new HttpsError('permission-denied', 'Only approved drivers can share live location.');
  }

  const lineId = user.driverLineId;
  const ridesSnapshot = await adminDb
    .collection('rides')
    .where('driverUserId', '==', actor.uid)
    .where('status', '==', 'scheduled')
    .get();
  const nextRide = ridesSnapshot.docs
    .map((doc) => doc.data())
    .sort((left, right) => String(left.departureAt).localeCompare(String(right.departureAt)))[0];
  let mode: 'bus' | 'metro' | 'louage';
  let resolvedLineId = '';
  let nextStopId = '';
  let rideId = '';
  let label = `${String(user.fullName).split(' ')[0]} Live`;
  let etaMinutes = 2;

  if (lineId) {
    const lineSnapshot = await adminDb.collection('lines').doc(lineId).get();
    const line = lineSnapshot.data();
    if (!line) {
      throw new HttpsError('not-found', 'The linked transit line could not be found.');
    }

    const stops = Array.isArray(line.stops) ? line.stops : [];
    mode = line.mode;
    resolvedLineId = lineId;
    nextStopId = stops[0]?.id ?? '';
    etaMinutes = Number(stops[0]?.etaMinutes ?? 2);
  } else if (nextRide) {
    mode = 'louage';
    rideId = String(nextRide.id ?? '');
    label = `${String(user.fullName).split(' ')[0]} Louage Live`;
  } else {
    throw new HttpsError('failed-precondition', 'No active line or scheduled ride is linked to this driver.');
  }

  const vehicleId = `live-${actor.uid}`;
  const existingSnapshot = await adminDb.collection('liveVehicles').doc(vehicleId).get();
  const existing = existingSnapshot.data() ?? {};
  const vehicle = {
    id: vehicleId,
    lineId: resolvedLineId,
    mode,
    label,
    positionIndex: Number(existing.positionIndex ?? 0),
    nextStopId: String(existing.nextStopId ?? nextStopId),
    etaMinutes,
    sharingEnabled: input.enabled,
    operatorUserId: actor.uid,
    rideId,
    latitude: typeof input.latitude === 'number' ? input.latitude : existing.latitude,
    longitude: typeof input.longitude === 'number' ? input.longitude : existing.longitude,
    accuracyMeters:
      typeof input.accuracyMeters === 'number' ? input.accuracyMeters : existing.accuracyMeters,
    updatedAt: nowIso(),
  };

  await adminDb.collection('liveVehicles').doc(vehicleId).set(vehicle, { merge: true });
  return vehicle;
});
