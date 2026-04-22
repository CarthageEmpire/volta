import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  type DocumentData,
  type QuerySnapshot,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import {
  AppState,
  Booking,
  CheckoutIntent,
  CreateRideInput,
  DriverVerificationInput,
  DriverVerificationRequest,
  FavoritePlace,
  LiveVehicle,
  Locale,
  LoginInput,
  LouageRide,
  NearbyTransport,
  Payment,
  PaymentProvider,
  SearchFilters,
  SearchResult,
  SignupInput,
  Ticket,
  TransportLine,
  UserAccount,
  VerificationDocument,
} from '../types';
import { auth, db, functions, storage } from './firebaseApp';
import { normalizeEmail, normalizePhone } from './validationService';

function optionalString(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function asUserAccount(data: Record<string, unknown>, id: string): UserAccount {
  return {
    id,
    role: String(data.role) as UserAccount['role'],
    email: String(data.email ?? ''),
    phone: optionalString(data.phone),
    fullName: String(data.fullName ?? ''),
    city: String(data.city ?? ''),
    locale: (optionalString(data.locale) ?? 'fr-TN') as Locale,
    createdAt: String(data.createdAt ?? ''),
    dateOfBirth: optionalString(data.dateOfBirth),
    gender: optionalString(data.gender) as UserAccount['gender'] | undefined,
    phoneVerified: Boolean(data.phoneVerified),
    verificationStatus: String(data.verificationStatus ?? 'not_started') as UserAccount['verificationStatus'],
    driverLineId: optionalString(data.driverLineId),
    avatarColor: optionalString(data.avatarColor),
  };
}

function asVerificationDocument(data: Record<string, unknown>): VerificationDocument {
  return {
    type: String(data.type) as VerificationDocument['type'],
    name: String(data.name ?? ''),
    uploadedAt: String(data.uploadedAt ?? ''),
    storagePath: optionalString(data.storagePath),
    downloadURL: optionalString(data.downloadURL),
  };
}

function asVerificationRequest(data: Record<string, unknown>, id: string): DriverVerificationRequest {
  return {
    id,
    userId: String(data.userId ?? ''),
    status: String(data.status ?? 'not_started') as DriverVerificationRequest['status'],
    submittedAt: String(data.submittedAt ?? ''),
    reviewedAt: optionalString(data.reviewedAt),
    reviewedBy: optionalString(data.reviewedBy),
    rejectionReason: optionalString(data.rejectionReason),
    cityOfResidence: String(data.cityOfResidence ?? ''),
    documents: Array.isArray(data.documents)
      ? data.documents.map((item) => asVerificationDocument(item as Record<string, unknown>))
      : [],
    applicantName: optionalString(data.applicantName),
    applicantEmail: optionalString(data.applicantEmail),
    applicantPhone: optionalString(data.applicantPhone),
  };
}

function asTransportLine(data: Record<string, unknown>, id: string): TransportLine {
  return {
    id,
    mode: String(data.mode) as TransportLine['mode'],
    code: String(data.code ?? ''),
    name: String(data.name ?? ''),
    color: String(data.color ?? ''),
    fareTnd: Number(data.fareTnd ?? 0),
    origin: String(data.origin ?? ''),
    destination: String(data.destination ?? ''),
    durationMinutes: Number(data.durationMinutes ?? 0),
    intervalMinutes: Number(data.intervalMinutes ?? 0),
    routeLabel: String(data.routeLabel ?? ''),
    stops: Array.isArray(data.stops)
      ? data.stops.map((stop) => ({
          id: String((stop as Record<string, unknown>).id ?? ''),
          name: String((stop as Record<string, unknown>).name ?? ''),
          plannedTime: String((stop as Record<string, unknown>).plannedTime ?? ''),
          etaMinutes: Number((stop as Record<string, unknown>).etaMinutes ?? 0),
          isMajor: Boolean((stop as Record<string, unknown>).isMajor),
        }))
      : [],
    operatorName: optionalString(data.operatorName),
    servicePattern: optionalString(data.servicePattern),
    verificationNotes: optionalString(data.verificationNotes),
    sourceLabel: optionalString(data.sourceLabel),
  };
}

function asLiveVehicle(data: Record<string, unknown>, id: string): LiveVehicle {
  return {
    id,
    lineId: String(data.lineId ?? ''),
    mode: String(data.mode) as LiveVehicle['mode'],
    label: String(data.label ?? ''),
    positionIndex: Number(data.positionIndex ?? 0),
    nextStopId: String(data.nextStopId ?? ''),
    etaMinutes: Number(data.etaMinutes ?? 0),
    sharingEnabled: Boolean(data.sharingEnabled),
    operatorUserId: optionalString(data.operatorUserId),
  };
}

function asRide(data: Record<string, unknown>, id: string): LouageRide {
  return {
    id,
    driverUserId: String(data.driverUserId ?? ''),
    driverName: optionalString(data.driverName),
    departureCity: String(data.departureCity ?? ''),
    destinationCity: String(data.destinationCity ?? ''),
    departureAt: String(data.departureAt ?? ''),
    availableSeats: Number(data.availableSeats ?? 0),
    totalSeats: Number(data.totalSeats ?? 0),
    priceTnd: Number(data.priceTnd ?? 0),
    vehicleModel: String(data.vehicleModel ?? ''),
    plateNumber: String(data.plateNumber ?? ''),
    vehiclePhotoName: optionalString(data.vehiclePhotoName),
    vehiclePhotoPath: optionalString(data.vehiclePhotoPath),
    vehiclePhotoUrl: optionalString(data.vehiclePhotoUrl),
    status: String(data.status ?? 'scheduled') as LouageRide['status'],
    liveProofEnabled: Boolean(data.liveProofEnabled),
    createdAt: optionalString(data.createdAt),
  };
}

function asBooking(data: Record<string, unknown>, id: string): Booking {
  return {
    id,
    type: String(data.type) as Booking['type'],
    mode: String(data.mode) as Booking['mode'],
    passengerUserId: String(data.passengerUserId ?? ''),
    driverUserId: optionalString(data.driverUserId),
    lineId: optionalString(data.lineId),
    rideId: optionalString(data.rideId),
    createdAt: String(data.createdAt ?? ''),
    departureAt: String(data.departureAt ?? ''),
    origin: String(data.origin ?? ''),
    destination: String(data.destination ?? ''),
    seatsBooked: Number(data.seatsBooked ?? 1),
    amountTnd: Number(data.amountTnd ?? 0),
    status: String(data.status ?? 'pending_payment') as Booking['status'],
    paymentId: optionalString(data.paymentId),
    ticketId: optionalString(data.ticketId),
    payoutStatus: String(data.payoutStatus ?? 'n/a') as Booking['payoutStatus'],
    refundStatus: optionalString(data.refundStatus) as Booking['refundStatus'] | undefined,
    penaltyPercent: typeof data.penaltyPercent === 'number' ? data.penaltyPercent : undefined,
    note: optionalString(data.note),
  };
}

function asTicket(data: Record<string, unknown>, id: string): Ticket {
  return {
    id,
    userId: String(data.userId ?? ''),
    bookingId: String(data.bookingId ?? ''),
    mode: String(data.mode) as Ticket['mode'],
    title: String(data.title ?? ''),
    validFrom: String(data.validFrom ?? ''),
    validUntil: String(data.validUntil ?? ''),
    priceTnd: Number(data.priceTnd ?? 0),
    zones: String(data.zones ?? ''),
    qrPayload: String(data.qrPayload ?? ''),
    status: String(data.status ?? 'active') as Ticket['status'],
  };
}

function asPayment(data: Record<string, unknown>, id: string): Payment {
  return {
    id,
    userId: String(data.userId ?? ''),
    driverUserId: optionalString(data.driverUserId),
    bookingId: String(data.bookingId ?? ''),
    provider: String(data.provider) as Payment['provider'],
    amountTnd: Number(data.amountTnd ?? 0),
    createdAt: String(data.createdAt ?? ''),
    status: String(data.status ?? 'pending') as Payment['status'],
    payoutStatus: String(data.payoutStatus ?? 'n/a') as Payment['payoutStatus'],
    summary: String(data.summary ?? ''),
  };
}

function asFavorite(data: Record<string, unknown>, id: string): FavoritePlace {
  return {
    id,
    userId: String(data.userId ?? ''),
    label: String(data.label ?? ''),
    city: String(data.city ?? ''),
    hint: String(data.hint ?? ''),
  };
}

function asNearbyTransport(data: Record<string, unknown>, id: string): NearbyTransport {
  return {
    id,
    mode: String(data.mode) as NearbyTransport['mode'],
    title: String(data.title ?? ''),
    subtitle: String(data.subtitle ?? ''),
    distanceMeters: Number(data.distanceMeters ?? 0),
  };
}

function mapSnapshot<T>(
  snapshot: QuerySnapshot<DocumentData>,
  mapper: (data: Record<string, unknown>, id: string) => T,
) {
  return snapshot.docs.map((item) => mapper(item.data() as Record<string, unknown>, item.id));
}

function mapAuthError(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Cet email est deja utilise.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email ou mot de passe incorrect.';
    case 'auth/weak-password':
      return 'Le mot de passe est trop faible.';
    case 'auth/invalid-email':
      return 'Format email invalide.';
    default:
      if (typeof error === 'object' && error && 'message' in error) {
        return String(error.message);
      }
      return 'Une erreur Firebase est survenue.';
  }
}

async function uploadFile(params: {
  path: string;
  file: File;
}) {
  const fileRef = ref(storage, params.path);
  await uploadBytes(fileRef, params.file);
  const downloadURL = await getDownloadURL(fileRef);
  return {
    storagePath: params.path,
    downloadURL,
  };
}

function safeFileSegment(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '-');
}

export function subscribeToSession(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export function subscribeToUserProfile(userId: string, callback: (user: UserAccount | null) => void) {
  return onSnapshot(doc(db, 'users', userId), (snapshot) => {
    callback(snapshot.exists() ? asUserAccount(snapshot.data() as Record<string, unknown>, snapshot.id) : null);
  });
}

export async function fetchUserProfileOnce(userId: string) {
  const snapshot = await getDoc(doc(db, 'users', userId));
  return snapshot.exists() ? asUserAccount(snapshot.data() as Record<string, unknown>, snapshot.id) : null;
}

export function subscribeToAllUsersForAdmin(callback: (users: UserAccount[]) => void) {
  return onSnapshot(collection(db, 'users'), (snapshot) => {
    callback(mapSnapshot(snapshot, asUserAccount));
  });
}

export function subscribeToLines(callback: (lines: TransportLine[]) => void) {
  return onSnapshot(collection(db, 'lines'), (snapshot) => {
    callback(mapSnapshot(snapshot, asTransportLine));
  });
}

export function subscribeToLiveVehicles(callback: (vehicles: LiveVehicle[]) => void) {
  return onSnapshot(collection(db, 'liveVehicles'), (snapshot) => {
    callback(mapSnapshot(snapshot, asLiveVehicle));
  });
}

export function subscribeToRides(callback: (rides: LouageRide[]) => void) {
  return onSnapshot(collection(db, 'rides'), (snapshot) => {
    callback(mapSnapshot(snapshot, asRide));
  });
}

export function subscribeToNearbyTransport(callback: (items: NearbyTransport[]) => void) {
  return onSnapshot(collection(db, 'nearbyTransport'), (snapshot) => {
    callback(mapSnapshot(snapshot, asNearbyTransport));
  });
}

export function subscribeToVerificationRequests(
  userId: string,
  role: UserAccount['role'],
  callback: (requests: DriverVerificationRequest[]) => void,
) {
  const source =
    role === 'admin'
      ? collection(db, 'verificationRequests')
      : query(collection(db, 'verificationRequests'), where('userId', '==', userId));

  return onSnapshot(source, (snapshot) => {
    callback(mapSnapshot(snapshot, asVerificationRequest));
  });
}

export function subscribeToBookings(userId: string, role: UserAccount['role'], callback: (items: Booking[]) => void) {
  const source =
    role === 'driver'
      ? query(collection(db, 'bookings'), where('driverUserId', '==', userId))
      : query(collection(db, 'bookings'), where('passengerUserId', '==', userId));

  return onSnapshot(source, (snapshot) => {
    callback(mapSnapshot(snapshot, asBooking));
  });
}

export function subscribeToTickets(userId: string, callback: (items: Ticket[]) => void) {
  return onSnapshot(query(collection(db, 'tickets'), where('userId', '==', userId)), (snapshot) => {
    callback(mapSnapshot(snapshot, asTicket));
  });
}

export function subscribeToPayments(
  userId: string,
  role: UserAccount['role'],
  callback: (items: Payment[]) => void,
) {
  const source =
    role === 'driver'
      ? query(collection(db, 'payments'), where('driverUserId', '==', userId))
      : query(collection(db, 'payments'), where('userId', '==', userId));

  return onSnapshot(source, (snapshot) => {
    callback(mapSnapshot(snapshot, asPayment));
  });
}

export function subscribeToFavorites(userId: string, callback: (items: FavoritePlace[]) => void) {
  return onSnapshot(query(collection(db, 'favorites'), where('userId', '==', userId)), (snapshot) => {
    callback(mapSnapshot(snapshot, asFavorite));
  });
}

export async function loginWithFirebase(input: LoginInput) {
  try {
    const credential = await signInWithEmailAndPassword(auth, normalizeEmail(input.email), input.password);
    return { ok: true as const, userId: credential.user.uid };
  } catch (error) {
    return { ok: false as const, message: mapAuthError(error) };
  }
}

export async function signupWithFirebase(input: SignupInput) {
  if (!input.email) {
    return { ok: false as const, message: 'Email requis pour creer un compte Firebase.' };
  }

  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      normalizeEmail(input.email ?? ''),
      input.password,
    );
    const bootstrap = httpsCallable<
      Pick<SignupInput, 'role' | 'email' | 'phone' | 'fullName' | 'city'>,
      UserAccount
    >(functions, 'bootstrapUserProfile');
    await bootstrap({
      role: input.role,
      email: normalizeEmail(input.email ?? ''),
      phone: input.phone ? normalizePhone(input.phone) : undefined,
      fullName: input.fullName,
      city: input.city,
    });
    await credential.user.getIdToken(true);
    return { ok: true as const, userId: credential.user.uid };
  } catch (error) {
    return { ok: false as const, message: mapAuthError(error) };
  }
}

export async function logoutFromFirebase() {
  await signOut(auth);
}

export async function updateLocalePreference(locale: Locale) {
  const callable = httpsCallable<{ locale: Locale }, { locale: Locale }>(functions, 'updateUserLocale');
  await callable({ locale });
}

export async function submitVerificationRequest(userId: string, input: DriverVerificationInput) {
  const documents = await Promise.all(
    input.documents.map(async (document) => {
      if (!document.file) {
        return {
          type: document.type,
          name: document.name,
          uploadedAt: document.uploadedAt,
          storagePath: document.storagePath,
          downloadURL: document.downloadURL,
        };
      }

      const storagePath = `verificationDocuments/${userId}/${document.type}-${Date.now()}-${safeFileSegment(document.file.name)}`;
      const uploaded = await uploadFile({
        path: storagePath,
        file: document.file,
      });

      return {
        type: document.type,
        name: document.file.name,
        uploadedAt: document.uploadedAt,
        storagePath: uploaded.storagePath,
        downloadURL: uploaded.downloadURL,
      };
    }),
  );

  const callable = httpsCallable(functions, 'submitDriverVerification');
  await callable({
    ...input,
    documents,
  });
}

export async function reviewVerificationRequest(
  requestId: string,
  decision: 'approved' | 'rejected',
  rejectionReason?: string,
) {
  const callable = httpsCallable(functions, 'reviewDriverVerification');
  await callable({
    requestId,
    decision,
    rejectionReason,
  });
}

export async function toggleLiveSharing(enabled: boolean) {
  const callable = httpsCallable(functions, 'toggleDriverLiveSharing');
  await callable({ enabled });
}

export async function createRideListing(userId: string, input: CreateRideInput) {
  let uploadedPhoto:
    | {
        storagePath: string;
        downloadURL: string;
      }
    | undefined;

  if (input.vehiclePhoto) {
    uploadedPhoto = await uploadFile({
      path: `ridePhotos/${userId}/${Date.now()}-${safeFileSegment(input.vehiclePhoto.name)}`,
      file: input.vehiclePhoto,
    });
  }

  const callable = httpsCallable(functions, 'createRide');
  await callable({
    departureCity: input.departureCity,
    destinationCity: input.destinationCity,
    departureAt: input.departureAt,
    availableSeats: input.availableSeats,
    priceTnd: input.priceTnd,
    vehicleModel: input.vehicleModel,
    plateNumber: input.plateNumber,
    vehiclePhotoName: input.vehiclePhoto?.name ?? optionalString(input.vehiclePhotoName),
    vehiclePhotoPath: optionalString(uploadedPhoto?.storagePath),
    vehiclePhotoUrl: optionalString(uploadedPhoto?.downloadURL),
  });
}

export async function createCheckoutForLine(lineId: string) {
  const callable = httpsCallable<{ kind: 'line_ticket'; lineId: string }, CheckoutIntent>(
    functions,
    'createCheckoutIntent',
  );
  const result = await callable({ kind: 'line_ticket', lineId });
  return result.data;
}

export async function createCheckoutForRide(rideId: string) {
  const callable = httpsCallable<{ kind: 'louage_booking'; rideId: string }, CheckoutIntent>(
    functions,
    'createCheckoutIntent',
  );
  const result = await callable({ kind: 'louage_booking', rideId });
  return result.data;
}

export async function confirmCheckout(checkout: CheckoutIntent, provider: PaymentProvider) {
  const callable = httpsCallable<
    { checkout: CheckoutIntent; provider: PaymentProvider },
    { bookingId: string; ticketId: string }
  >(functions, 'confirmPayment');
  const result = await callable({ checkout, provider });
  return result.data;
}

export async function cancelPassengerBookingRemote(bookingId: string) {
  const callable = httpsCallable<{ bookingId: string }, { bookingId: string }>(
    functions,
    'cancelPassengerBooking',
  );
  await callable({ bookingId });
}

export async function cancelDriverRideRemote(rideId: string) {
  const callable = httpsCallable<{ rideId: string }, { rideId: string }>(functions, 'cancelDriverRide');
  await callable({ rideId });
}

export async function markBookingAwaitingConfirmationRemote(bookingId: string) {
  const callable = httpsCallable<{ bookingId: string }, { bookingId: string }>(
    functions,
    'markRideAwaitingConfirmation',
  );
  await callable({ bookingId });
}

export async function confirmRideCompletionRemote(bookingId: string) {
  const callable = httpsCallable<{ bookingId: string }, { bookingId: string }>(
    functions,
    'confirmRideCompletion',
  );
  await callable({ bookingId });
}

export async function reportNoShowRemote(bookingId: string) {
  const callable = httpsCallable<{ bookingId: string }, { bookingId: string }>(functions, 'reportNoShow');
  await callable({ bookingId });
}

export async function searchTransportRemote(filters: SearchFilters) {
  const callable = httpsCallable<SearchFilters, SearchResult[]>(functions, 'searchTransport');
  const result = await callable(filters);
  return result.data;
}

export function createStateSlicePatch(state: AppState, patch: Partial<AppState>): AppState {
  return {
    ...state,
    ...patch,
  };
}
