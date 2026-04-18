import {
  AppState,
  FavoritePlace,
  LiveVehicle,
  LouageRide,
  NearbyTransport,
  TransportLine,
  UserAccount,
} from './types';

export const TUNISIAN_CITIES = [
  'Tunis',
  'Tunis Marine',
  'Place Barcelone',
  'Ariana',
  'La Marsa',
  'Bardo',
  'Ben Arous',
  'Sousse',
  'Sfax',
  'Nabeul',
  'Monastir',
  'Gabes',
  'Bizerte',
  'Kairouan',
] as const;

export const DRIVER_DOCUMENT_LABELS = {
  driving_license: 'Permis de conduire',
  national_id: 'Carte d’identite nationale',
  vehicle_insurance: 'Assurance vehicule',
  vehicle_registration: 'Carte grise',
} as const;

export const PAYMENT_METHODS = [
  {
    id: 'bank_card',
    label: 'Carte bancaire',
    subtitle: 'Visa / Mastercard / carte locale',
  },
  {
    id: 'konnect',
    label: 'Konnect',
    subtitle: 'Passerelle tunisienne compatible web',
  },
  {
    id: 'flooss',
    label: 'Flooss',
    subtitle: 'Paiement mobile et wallet',
  },
  {
    id: 'sps',
    label: 'SPS',
    subtitle: 'Paiement securise marchand',
  },
  {
    id: 'd17',
    label: 'D17',
    subtitle: 'Paiement QR et mobile',
  },
] as const;

export const LINES: TransportLine[] = [
  {
    id: 'metro-m4',
    mode: 'metro',
    code: 'M4',
    name: 'Metro Ligne 4',
    color: '#006d36',
    fareTnd: 0.8,
    origin: 'Tunis Marine',
    destination: 'Den Den',
    durationMinutes: 22,
    intervalMinutes: 5,
    routeLabel: 'Tunis Marine - Place Barcelone - Bardo - Den Den',
    stops: [
      { id: 'marine', name: 'Tunis Marine', plannedTime: '10:05', etaMinutes: 0, isMajor: true },
      { id: 'barcelone', name: 'Place Barcelone', plannedTime: '10:09', etaMinutes: 4, isMajor: true },
      { id: 'bardo', name: 'Bardo', plannedTime: '10:15', etaMinutes: 10, isMajor: true },
      { id: 'denden', name: 'Den Den', plannedTime: '10:22', etaMinutes: 17, isMajor: true },
    ],
  },
  {
    id: 'bus-32',
    mode: 'bus',
    code: 'B32',
    name: 'Bus 32',
    color: '#0040a1',
    fareTnd: 1.2,
    origin: 'Passage',
    destination: 'Ariana',
    durationMinutes: 28,
    intervalMinutes: 8,
    routeLabel: 'Passage - Lafayette - El Menzah - Ariana',
    stops: [
      { id: 'passage', name: 'Passage', plannedTime: '10:10', etaMinutes: 0, isMajor: true },
      { id: 'lafayette', name: 'Lafayette', plannedTime: '10:15', etaMinutes: 5 },
      { id: 'menzah', name: 'El Menzah', plannedTime: '10:24', etaMinutes: 14 },
      { id: 'ariana', name: 'Ariana', plannedTime: '10:38', etaMinutes: 28, isMajor: true },
    ],
  },
  {
    id: 'bus-15',
    mode: 'bus',
    code: 'B15',
    name: 'Bus 15',
    color: '#0f766e',
    fareTnd: 1,
    origin: 'Bab Alioua',
    destination: 'La Goulette',
    durationMinutes: 30,
    intervalMinutes: 10,
    routeLabel: 'Bab Alioua - Barcelone - Tunis Marine - La Goulette',
    stops: [
      { id: 'bab-alioua', name: 'Bab Alioua', plannedTime: '10:00', etaMinutes: 0 },
      { id: 'b15-barcelone', name: 'Place Barcelone', plannedTime: '10:08', etaMinutes: 8, isMajor: true },
      { id: 'b15-marine', name: 'Tunis Marine', plannedTime: '10:18', etaMinutes: 18, isMajor: true },
      { id: 'goulette', name: 'La Goulette', plannedTime: '10:30', etaMinutes: 30, isMajor: true },
    ],
  },
];

export const LIVE_VEHICLES: LiveVehicle[] = [
  {
    id: 'veh-m4-1',
    lineId: 'metro-m4',
    mode: 'metro',
    label: 'Rame M4-201',
    positionIndex: 1,
    nextStopId: 'barcelone',
    etaMinutes: 3,
    sharingEnabled: true,
  },
  {
    id: 'veh-b32-1',
    lineId: 'bus-32',
    mode: 'bus',
    label: 'Bus 32-18',
    positionIndex: 2,
    nextStopId: 'menzah',
    etaMinutes: 5,
    sharingEnabled: true,
  },
];

export const SEED_USERS: UserAccount[] = [
  {
    id: 'admin-1',
    role: 'admin',
    email: 'admin@volta.tn',
    fullName: 'Equipe Admin Volta',
    city: 'Tunis',
    locale: 'fr-TN',
    createdAt: '2026-04-01T08:00:00.000Z',
    phoneVerified: true,
    verificationStatus: 'approved',
    avatarColor: '#0040a1',
  },
  {
    id: 'passenger-1',
    role: 'passenger',
    email: 'imen@volta.tn',
    phone: '+21622111222',
    fullName: 'Imen Gharbi',
    city: 'Tunis',
    locale: 'fr-TN',
    createdAt: '2026-04-07T09:00:00.000Z',
    phoneVerified: true,
    verificationStatus: 'not_started',
    avatarColor: '#006d36',
  },
  {
    id: 'driver-1',
    role: 'driver',
    email: 'hamed@volta.tn',
    phone: '+21655123456',
    fullName: 'Hamed Trabelsi',
    city: 'Sousse',
    locale: 'fr-TN',
    createdAt: '2026-04-02T07:00:00.000Z',
    dateOfBirth: '1988-09-14',
    gender: 'homme',
    phoneVerified: true,
    verificationStatus: 'approved',
    driverLineId: 'bus-32',
    avatarColor: '#0891b2',
  },
  {
    id: 'driver-2',
    role: 'driver',
    email: 'salma.driver@volta.tn',
    phone: '+21699123456',
    fullName: 'Salma Ben Ali',
    city: 'Sfax',
    locale: 'fr-TN',
    createdAt: '2026-04-09T12:00:00.000Z',
    phoneVerified: true,
    verificationStatus: 'pending',
    avatarColor: '#7c3aed',
  },
];

export const SEED_RIDES: LouageRide[] = [
  {
    id: 'ride-1',
    driverUserId: 'driver-1',
    departureCity: 'Tunis',
    destinationCity: 'Sousse',
    departureAt: '2026-04-18T14:30:00.000Z',
    availableSeats: 3,
    totalSeats: 4,
    priceTnd: 18,
    vehicleModel: 'Toyota Hiace',
    plateNumber: '226 TUN 194',
    vehiclePhotoName: 'hiace-sousse.jpg',
    status: 'scheduled',
    liveProofEnabled: true,
  },
  {
    id: 'ride-2',
    driverUserId: 'driver-1',
    departureCity: 'Sousse',
    destinationCity: 'Sfax',
    departureAt: '2026-04-18T18:15:00.000Z',
    availableSeats: 2,
    totalSeats: 4,
    priceTnd: 22,
    vehicleModel: 'Peugeot Boxer',
    plateNumber: '144 TUN 508',
    vehiclePhotoName: 'boxer-sfax.jpg',
    status: 'scheduled',
    liveProofEnabled: true,
  },
];

export const SEED_FAVORITES: FavoritePlace[] = [
  {
    id: 'fav-1',
    userId: 'passenger-1',
    label: 'Maison',
    city: 'Bardo',
    hint: 'Rue Habib Maazoun',
  },
  {
    id: 'fav-2',
    userId: 'passenger-1',
    label: 'Travail',
    city: 'Lac II',
    hint: 'Pole technologique',
  },
];

export const NEARBY_TRANSPORT: NearbyTransport[] = [
  {
    id: 'near-1',
    mode: 'metro',
    title: 'Metro M4 - Place Barcelone',
    subtitle: 'Arrive dans 3 min',
    distanceMeters: 280,
  },
  {
    id: 'near-2',
    mode: 'bus',
    title: 'Bus 32 - Passage',
    subtitle: 'Ariana en 28 min',
    distanceMeters: 430,
  },
  {
    id: 'near-3',
    mode: 'louage',
    title: 'Depart Louage Tunis > Sousse',
    subtitle: 'Prochain depart a 14:30',
    distanceMeters: 490,
  },
];

export function createInitialState(): AppState {
  return {
    users: SEED_USERS,
    sessionUserId: null,
    verificationRequests: [
      {
        id: 'verif-1',
        userId: 'driver-2',
        status: 'pending',
        submittedAt: '2026-04-17T10:00:00.000Z',
        cityOfResidence: 'Sfax',
        documents: [
          { type: 'driving_license', name: 'permis_salma.pdf', uploadedAt: '2026-04-17T10:05:00.000Z' },
          { type: 'national_id', name: 'cin_salma.jpg', uploadedAt: '2026-04-17T10:06:00.000Z' },
          { type: 'vehicle_insurance', name: 'assurance_salma.pdf', uploadedAt: '2026-04-17T10:07:00.000Z' },
          { type: 'vehicle_registration', name: 'carte_grise_salma.pdf', uploadedAt: '2026-04-17T10:08:00.000Z' },
        ],
      },
    ],
    lines: LINES,
    liveVehicles: LIVE_VEHICLES,
    louageRides: SEED_RIDES,
    bookings: [],
    tickets: [],
    payments: [],
    favorites: SEED_FAVORITES,
    nearbyTransport: NEARBY_TRANSPORT,
    selectedLineId: 'metro-m4',
    locationEnabled: true,
    locale: 'fr-TN',
  };
}
