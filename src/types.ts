export type Screen =
  | 'welcome'
  | 'not-found'
  | 'explore'
  | 'search'
  | 'line-details'
  | 'louage'
  | 'bus'
  | 'metro'
  | 'tickets'
  | 'payment'
  | 'driver-dashboard'
  | 'driver-verification'
  | 'create-trip'
  | 'admin-review';

export type UserRole = 'passenger' | 'driver' | 'admin';
export type Locale = 'fr-TN' | 'ar-TN';
export type Gender = 'femme' | 'homme' | 'autre';
export type TransportMode = 'metro' | 'bus' | 'louage';
export type DriverVerificationStatus = 'not_started' | 'pending' | 'approved' | 'rejected';
export type DocumentType =
  | 'driving_license'
  | 'national_id'
  | 'vehicle_insurance'
  | 'vehicle_registration';
export type RideStatus = 'scheduled' | 'completed' | 'cancelled';
export type BookingStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'awaiting_passenger_confirmation'
  | 'completed'
  | 'cancelled_by_passenger'
  | 'cancelled_by_driver'
  | 'no_show_reported';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentProvider = 'bank_card' | 'konnect' | 'flooss' | 'sps' | 'd17';
export type PayoutStatus = 'n/a' | 'held' | 'released' | 'eligible_with_proof' | 'refunded';
export type TicketStatus = 'active' | 'used' | 'expired' | 'cancelled';
export type SearchSort = 'cheapest' | 'duration' | 'departure';
export type SearchMatchType =
  | 'direct'
  | 'departure_area'
  | 'destination_area'
  | 'network_suggestion';

export interface UserAccount {
  id: string;
  role: UserRole;
  email: string;
  phone?: string;
  fullName: string;
  city: string;
  locale: Locale;
  createdAt: string;
  dateOfBirth?: string;
  gender?: Gender;
  phoneVerified: boolean;
  verificationStatus: DriverVerificationStatus;
  driverLineId?: string;
  avatarColor?: string;
  rating?: number;
  completedTrips?: number;
  penaltyCount?: number;
}

export interface VerificationDocument {
  type: DocumentType;
  name: string;
  uploadedAt: string;
  storagePath?: string;
  downloadURL?: string;
  file?: File | null;
}

export interface DriverVerificationRequest {
  id: string;
  userId: string;
  status: DriverVerificationStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  cityOfResidence: string;
  documents: VerificationDocument[];
  applicantName?: string;
  applicantEmail?: string;
  applicantPhone?: string;
}

export interface LineStop {
  id: string;
  name: string;
  plannedTime: string;
  etaMinutes: number;
  isMajor?: boolean;
}

export interface TransportLine {
  id: string;
  mode: Extract<TransportMode, 'metro' | 'bus'>;
  code: string;
  name: string;
  color: string;
  fareTnd: number;
  origin: string;
  destination: string;
  durationMinutes: number;
  intervalMinutes: number;
  routeLabel: string;
  stops: LineStop[];
  operatorName?: string;
  servicePattern?: string;
  verificationNotes?: string;
  sourceLabel?: string;
}

export interface LiveVehicle {
  id: string;
  lineId: string;
  mode: TransportMode;
  label: string;
  positionIndex: number;
  nextStopId: string;
  etaMinutes: number;
  sharingEnabled: boolean;
  operatorUserId?: string;
  rideId?: string;
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
  updatedAt?: string;
}

export interface LouageRide {
  id: string;
  driverUserId: string;
  driverName?: string;
  departureCity: string;
  destinationCity: string;
  departureAt: string;
  availableSeats: number;
  totalSeats: number;
  priceTnd: number;
  vehicleModel: string;
  plateNumber: string;
  vehiclePhotoName?: string;
  vehiclePhotoPath?: string;
  vehiclePhotoUrl?: string;
  status: RideStatus;
  liveProofEnabled: boolean;
  createdAt?: string;
}

export interface Booking {
  id: string;
  type: 'line_ticket' | 'louage';
  mode: TransportMode;
  passengerUserId: string;
  driverUserId?: string;
  lineId?: string;
  rideId?: string;
  createdAt: string;
  departureAt: string;
  origin: string;
  destination: string;
  seatsBooked: number;
  amountTnd: number;
  status: BookingStatus;
  paymentId?: string;
  ticketId?: string;
  payoutStatus: PayoutStatus;
  refundStatus?: 'none' | 'eligible' | 'non_refundable' | 'refunded';
  penaltyPercent?: number;
  note?: string;
}

export interface Ticket {
  id: string;
  userId: string;
  bookingId: string;
  mode: Exclude<TransportMode, never>;
  title: string;
  validFrom: string;
  validUntil: string;
  priceTnd: number;
  zones: string;
  qrPayload: string;
  status: TicketStatus;
}

export interface Payment {
  id: string;
  userId: string;
  driverUserId?: string;
  bookingId: string;
  provider: PaymentProvider;
  amountTnd: number;
  createdAt: string;
  status: PaymentStatus;
  payoutStatus: PayoutStatus;
  summary: string;
  providerReference?: string;
  processor?: 'internal' | 'gateway';
}

export interface FavoritePlace {
  id: string;
  userId: string;
  label: string;
  city: string;
  hint: string;
}

export interface NearbyTransport {
  id: string;
  mode: TransportMode;
  title: string;
  subtitle: string;
  distanceMeters: number;
}

export interface SearchFilters {
  departure: string;
  destination: string;
  date: string;
  sortBy: SearchSort;
}

export interface SearchResult {
  id: string;
  sourceId: string;
  mode: TransportMode;
  title: string;
  departure: string;
  destination: string;
  departureAt: string;
  durationMinutes: number;
  priceTnd: number;
  remainingSeats?: number;
  lineCode?: string;
  providerLabel: string;
  ctaLabel: string;
  matchType?: SearchMatchType;
  matchExplanation?: string;
}

export interface CheckoutIntent {
  kind: 'line_ticket' | 'louage_booking';
  title: string;
  description: string;
  amountTnd: number;
  mode: TransportMode;
  passengerUserId: string;
  lineId?: string;
  rideId?: string;
  seats?: number;
  origin: string;
  destination: string;
  departureAt: string;
}

export interface AppState {
  users: UserAccount[];
  sessionUserId: string | null;
  verificationRequests: DriverVerificationRequest[];
  lines: TransportLine[];
  liveVehicles: LiveVehicle[];
  louageRides: LouageRide[];
  bookings: Booking[];
  tickets: Ticket[];
  payments: Payment[];
  favorites: FavoritePlace[];
  nearbyTransport: NearbyTransport[];
  selectedLineId: string;
  locationEnabled: boolean;
  locale: Locale;
}

export interface SignupInput {
  role: Extract<UserRole, 'passenger' | 'driver'>;
  email?: string;
  phone?: string;
  password: string;
  fullName: string;
  city: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface DriverVerificationInput {
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  cityOfResidence: string;
  phone: string;
  phoneVerified: boolean;
  documents: VerificationDocument[];
}

export interface CreateRideInput {
  departureCity: string;
  destinationCity: string;
  departureAt: string;
  availableSeats: number;
  priceTnd: number;
  vehicleModel: string;
  plateNumber: string;
  vehiclePhotoName?: string;
  vehiclePhoto?: File | null;
}
