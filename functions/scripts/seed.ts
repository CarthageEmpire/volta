import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { createInitialState, NEARBY_TRANSPORT } from '../../src/constants';

process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';

initializeApp({
  projectId: process.env.GCLOUD_PROJECT || 'demo-volta-local',
});

const auth = getAuth();
const db = getFirestore();

async function upsertUser(params: {
  uid: string;
  email: string;
  password: string;
  displayName: string;
  role: 'passenger' | 'driver' | 'admin';
}) {
  try {
    await auth.getUser(params.uid);
    await auth.updateUser(params.uid, {
      email: params.email,
      password: params.password,
      displayName: params.displayName,
    });
  } catch {
    await auth.createUser({
      uid: params.uid,
      email: params.email,
      password: params.password,
      displayName: params.displayName,
    });
  }

  await auth.setCustomUserClaims(params.uid, { role: params.role });
}

async function seed() {
  const initial = createInitialState();
  const credentials = [
    {
      uid: 'admin-1',
      email: 'admin@volta.tn',
      password: 'admin123',
      displayName: 'Equipe Admin Volta',
      role: 'admin' as const,
    },
    {
      uid: 'passenger-1',
      email: 'imen@volta.tn',
      password: 'volta123',
      displayName: 'Imen Gharbi',
      role: 'passenger' as const,
    },
    {
      uid: 'driver-1',
      email: 'hamed@volta.tn',
      password: 'volta123',
      displayName: 'Hamed Trabelsi',
      role: 'driver' as const,
    },
    {
      uid: 'driver-2',
      email: 'salma.driver@volta.tn',
      password: 'volta123',
      displayName: 'Salma Ben Ali',
      role: 'driver' as const,
    },
  ];

  for (const credential of credentials) {
    await upsertUser(credential);
  }

  for (const user of initial.users) {
    await db.collection('users').doc(user.id).set({
      ...user,
      phone: user.phone ?? '',
      dateOfBirth: user.dateOfBirth ?? '',
      gender: user.gender ?? '',
      driverLineId: user.driverLineId ?? '',
      avatarColor: user.avatarColor ?? '#0040a1',
    });
  }

  for (const request of initial.verificationRequests) {
    const applicant = initial.users.find((user) => user.id === request.userId);
    await db.collection('verificationRequests').doc(request.id).set({
      ...request,
      reviewedAt: request.reviewedAt ?? '',
      reviewedBy: request.reviewedBy ?? '',
      rejectionReason: request.rejectionReason ?? '',
      applicantName: applicant?.fullName ?? '',
      applicantEmail: applicant?.email ?? '',
      applicantPhone: applicant?.phone ?? '',
    });
  }

  for (const line of initial.lines) {
    await db.collection('lines').doc(line.id).set(line);
  }

  for (const vehicle of initial.liveVehicles) {
    await db.collection('liveVehicles').doc(vehicle.id).set({
      ...vehicle,
      operatorUserId: vehicle.operatorUserId ?? '',
      updatedAt: new Date().toISOString(),
    });
  }

  for (const ride of initial.louageRides) {
    const driver = initial.users.find((user) => user.id === ride.driverUserId);
    await db.collection('rides').doc(ride.id).set({
      ...ride,
      driverName: driver?.fullName ?? '',
      vehiclePhotoPath: '',
      vehiclePhotoUrl: '',
      createdAt: new Date().toISOString(),
    });
  }

  for (const favorite of initial.favorites) {
    await db.collection('favorites').doc(favorite.id).set(favorite);
  }

  for (const nearby of NEARBY_TRANSPORT) {
    await db.collection('nearbyTransport').doc(nearby.id).set(nearby);
  }

  console.log('Firebase seed complete.');
}

seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
