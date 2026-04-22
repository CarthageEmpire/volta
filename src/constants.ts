import {
  AppState,
  FavoritePlace,
  LouageRide,
  UserAccount,
} from './types';
import {
  TRANSIT_CITIES,
  TRANSIT_LINES,
  TRANSIT_LIVE_VEHICLES,
  TRANSIT_NEARBY,
} from './data/transitCatalog';

export const TUNISIAN_CITIES = TRANSIT_CITIES;

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

export const LINES = TRANSIT_LINES;

export const LIVE_VEHICLES = TRANSIT_LIVE_VEHICLES;

function futureDepartureIso(daysFromNow: number, hourUtc: number, minuteUtc: number) {
  const departure = new Date();
  departure.setUTCDate(departure.getUTCDate() + daysFromNow);
  departure.setUTCHours(hourUtc, minuteUtc, 0, 0);
  return departure.toISOString();
}

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
    city: 'Tunis',
    locale: 'fr-TN',
    createdAt: '2026-04-02T07:00:00.000Z',
    dateOfBirth: '1988-09-14',
    gender: 'homme',
    phoneVerified: true,
    verificationStatus: 'approved',
    driverLineId: 'bus-104',
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
    departureAt: futureDepartureIso(1, 14, 30),
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
    departureAt: futureDepartureIso(1, 18, 15),
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

export const NEARBY_TRANSPORT = TRANSIT_NEARBY;

export function createEmptyState(): AppState {
  return {
    users: [],
    sessionUserId: null,
    verificationRequests: [],
    lines: [],
    liveVehicles: [],
    louageRides: [],
    bookings: [],
    tickets: [],
    payments: [],
    favorites: [],
    nearbyTransport: [],
    selectedLineId: 'metro-m1',
    locationEnabled: true,
    locale: 'fr-TN',
  };
}

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
    selectedLineId: 'metro-m1',
    locationEnabled: true,
    locale: 'fr-TN',
  };
}
