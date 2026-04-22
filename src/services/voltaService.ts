import { createInitialState } from '../constants';
import {
  AppState,
  Booking,
  BookingStatus,
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
} from '../types';
import {
  clearAuthStore,
  createAuthRecordForUser,
  ensureAuthStore,
  findAuthRecord,
  hashPassword,
  saveAuthStore,
} from './authService';
import {
  normalizeEmail,
  normalizePhone,
  sanitizeText,
  validateCreateRideInput,
  validateDriverVerificationInput,
  validateLoginInput,
  validateSignupInput,
} from './validationService';
import { normalizeText } from './normalizeText';

const STORAGE_KEY = 'volta-app-state-v2';

type MutationResult<T> = { state: AppState } & T;

function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function calculateAge(dateOfBirth: string) {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age;
}

function findUser(state: AppState, userId: string | null) {
  return state.users.find((user) => user.id === userId) ?? null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : null;
}

function asNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asBoolean(value: unknown) {
  return typeof value === 'boolean' ? value : null;
}

function sanitizeUsers(raw: unknown, fallback: UserAccount[]) {
  if (!Array.isArray(raw)) {
    return fallback;
  }

  const users: Array<UserAccount | null> = raw
    .filter(isRecord)
    .map((candidate): UserAccount | null => {
      const id = asString(candidate.id);
      const role = asString(candidate.role);
      const email = asString(candidate.email);
      const fullName = asString(candidate.fullName);
      const city = asString(candidate.city);
      const locale = asString(candidate.locale);
      const createdAt = asString(candidate.createdAt);
      const phoneVerified = asBoolean(candidate.phoneVerified);
      const verificationStatus = asString(candidate.verificationStatus);

      if (
        !id ||
        !role ||
        !email ||
        !fullName ||
        !city ||
        !locale ||
        !createdAt ||
        phoneVerified === null ||
        !verificationStatus
      ) {
        return null;
      }

      return {
        id,
        role: role as UserAccount['role'],
        email: normalizeEmail(email),
        phone: asString(candidate.phone) ?? undefined,
        fullName: sanitizeText(fullName),
        city: sanitizeText(city),
        locale: locale as Locale,
        createdAt,
        dateOfBirth: asString(candidate.dateOfBirth) ?? undefined,
        gender: asString(candidate.gender) as UserAccount['gender'] | undefined,
        phoneVerified,
        verificationStatus: verificationStatus as UserAccount['verificationStatus'],
        driverLineId: asString(candidate.driverLineId) ?? undefined,
        avatarColor: asString(candidate.avatarColor) ?? undefined,
      } satisfies UserAccount;
    })
    .filter((candidate): candidate is UserAccount => candidate !== null);

  return users.length > 0 ? users : fallback;
}

function sanitizeVerificationRequests(
  raw: unknown,
  fallback: DriverVerificationRequest[],
) {
  if (!Array.isArray(raw)) {
    return fallback;
  }

  const requests: Array<DriverVerificationRequest | null> = raw
    .filter(isRecord)
    .map((candidate): DriverVerificationRequest | null => {
      const id = asString(candidate.id);
      const userId = asString(candidate.userId);
      const status = asString(candidate.status);
      const submittedAt = asString(candidate.submittedAt);
      const cityOfResidence = asString(candidate.cityOfResidence);
      const documents: DriverVerificationRequest['documents'] = Array.isArray(candidate.documents)
        ? candidate.documents
            .filter(isRecord)
            .map((document): DriverVerificationRequest['documents'][number] | null => {
              const type = asString(document.type);
              const name = asString(document.name);
              const uploadedAt = asString(document.uploadedAt);

              if (!type || !name || !uploadedAt) {
                return null;
              }

              return { type: type as DriverVerificationRequest['documents'][number]['type'], name, uploadedAt };
            })
            .filter((document): document is DriverVerificationRequest['documents'][number] => document !== null)
        : [];

      if (!id || !userId || !status || !submittedAt || !cityOfResidence) {
        return null;
      }

      return {
        id,
        userId,
        status: status as DriverVerificationRequest['status'],
        submittedAt,
        reviewedAt: asString(candidate.reviewedAt) ?? undefined,
        reviewedBy: asString(candidate.reviewedBy) ?? undefined,
        rejectionReason: asString(candidate.rejectionReason) ?? undefined,
        cityOfResidence,
        documents,
      } satisfies DriverVerificationRequest;
    })
    .filter((candidate): candidate is DriverVerificationRequest => candidate !== null);

  return requests.length > 0 ? requests : fallback;
}

function sanitizeLines(raw: unknown, fallback: TransportLine[]) {
  if (!Array.isArray(raw)) {
    return fallback;
  }

  const lines: Array<TransportLine | null> = raw
    .filter(isRecord)
    .map((candidate): TransportLine | null => {
      const stops: TransportLine['stops'] = Array.isArray(candidate.stops)
        ? candidate.stops
            .filter(isRecord)
            .map((stop): TransportLine['stops'][number] | null => {
              const id = asString(stop.id);
              const name = asString(stop.name);
              const plannedTime = asString(stop.plannedTime);
              const etaMinutes = asNumber(stop.etaMinutes);

              if (!id || !name || !plannedTime || etaMinutes === null) {
                return null;
              }

              return {
                id,
                name,
                plannedTime,
                etaMinutes,
                isMajor: asBoolean(stop.isMajor) ?? undefined,
              };
            })
            .filter((stop): stop is TransportLine['stops'][number] => stop !== null)
        : [];

      const id = asString(candidate.id);
      const mode = asString(candidate.mode);
      const code = asString(candidate.code);
      const name = asString(candidate.name);
      const color = asString(candidate.color);
      const fareTnd = asNumber(candidate.fareTnd);
      const origin = asString(candidate.origin);
      const destination = asString(candidate.destination);
      const durationMinutes = asNumber(candidate.durationMinutes);
      const intervalMinutes = asNumber(candidate.intervalMinutes);
      const routeLabel = asString(candidate.routeLabel);

      if (
        !id ||
        !mode ||
        !code ||
        !name ||
        !color ||
        fareTnd === null ||
        !origin ||
        !destination ||
        durationMinutes === null ||
        intervalMinutes === null ||
        !routeLabel ||
        stops.length === 0
      ) {
        return null;
      }

      return {
        id,
        mode: mode as TransportLine['mode'],
        code,
        name,
        color,
        fareTnd,
        origin,
        destination,
        durationMinutes,
        intervalMinutes,
        routeLabel,
        stops,
      } satisfies TransportLine;
    })
    .filter((candidate): candidate is TransportLine => candidate !== null);

  return lines.length > 0 ? lines : fallback;
}

function sanitizeLiveVehicles(raw: unknown, fallback: LiveVehicle[]) {
  if (!Array.isArray(raw)) {
    return fallback;
  }

  const vehicles: Array<LiveVehicle | null> = raw
    .filter(isRecord)
    .map((candidate): LiveVehicle | null => {
      const id = asString(candidate.id);
      const lineId = asString(candidate.lineId);
      const mode = asString(candidate.mode);
      const label = asString(candidate.label);
      const positionIndex = asNumber(candidate.positionIndex);
      const nextStopId = asString(candidate.nextStopId);
      const etaMinutes = asNumber(candidate.etaMinutes);
      const sharingEnabled = asBoolean(candidate.sharingEnabled);

      if (
        !id ||
        !lineId ||
        !mode ||
        !label ||
        positionIndex === null ||
        !nextStopId ||
        etaMinutes === null ||
        sharingEnabled === null
      ) {
        return null;
      }

      return {
        id,
        lineId,
        mode: mode as LiveVehicle['mode'],
        label,
        positionIndex,
        nextStopId,
        etaMinutes,
        sharingEnabled,
        operatorUserId: asString(candidate.operatorUserId) ?? undefined,
      } satisfies LiveVehicle;
    })
    .filter((candidate): candidate is LiveVehicle => candidate !== null);

  return vehicles.length > 0 ? vehicles : fallback;
}

function sanitizeLouageRides(raw: unknown, fallback: LouageRide[]) {
  if (!Array.isArray(raw)) {
    return fallback;
  }

  const rides: Array<LouageRide | null> = raw
    .filter(isRecord)
    .map((candidate): LouageRide | null => {
      const id = asString(candidate.id);
      const driverUserId = asString(candidate.driverUserId);
      const departureCity = asString(candidate.departureCity);
      const destinationCity = asString(candidate.destinationCity);
      const departureAt = asString(candidate.departureAt);
      const availableSeats = asNumber(candidate.availableSeats);
      const totalSeats = asNumber(candidate.totalSeats);
      const priceTnd = asNumber(candidate.priceTnd);
      const vehicleModel = asString(candidate.vehicleModel);
      const plateNumber = asString(candidate.plateNumber);
      const status = asString(candidate.status);
      const liveProofEnabled = asBoolean(candidate.liveProofEnabled);

      if (
        !id ||
        !driverUserId ||
        !departureCity ||
        !destinationCity ||
        !departureAt ||
        availableSeats === null ||
        totalSeats === null ||
        priceTnd === null ||
        !vehicleModel ||
        !plateNumber ||
        !status ||
        liveProofEnabled === null
      ) {
        return null;
      }

      return {
        id,
        driverUserId,
        departureCity,
        destinationCity,
        departureAt,
        availableSeats,
        totalSeats,
        priceTnd,
        vehicleModel,
        plateNumber,
        vehiclePhotoName: asString(candidate.vehiclePhotoName) ?? undefined,
        status: status as LouageRide['status'],
        liveProofEnabled,
      } satisfies LouageRide;
    })
    .filter((candidate): candidate is LouageRide => candidate !== null);

  return rides.length > 0 ? rides : fallback;
}

function sanitizeBookings(raw: unknown, fallback: Booking[]) {
  if (!Array.isArray(raw)) {
    return fallback;
  }

  const bookings: Array<Booking | null> = raw
    .filter(isRecord)
    .map((candidate): Booking | null => {
      const id = asString(candidate.id);
      const type = asString(candidate.type);
      const mode = asString(candidate.mode);
      const passengerUserId = asString(candidate.passengerUserId);
      const createdAt = asString(candidate.createdAt);
      const departureAt = asString(candidate.departureAt);
      const origin = asString(candidate.origin);
      const destination = asString(candidate.destination);
      const seatsBooked = asNumber(candidate.seatsBooked);
      const amountTnd = asNumber(candidate.amountTnd);
      const status = asString(candidate.status);
      const payoutStatus = asString(candidate.payoutStatus);

      if (
        !id ||
        !type ||
        !mode ||
        !passengerUserId ||
        !createdAt ||
        !departureAt ||
        !origin ||
        !destination ||
        seatsBooked === null ||
        amountTnd === null ||
        !status ||
        !payoutStatus
      ) {
        return null;
      }

      return {
        id,
        type: type as Booking['type'],
        mode: mode as Booking['mode'],
        passengerUserId,
        driverUserId: asString(candidate.driverUserId) ?? undefined,
        lineId: asString(candidate.lineId) ?? undefined,
        rideId: asString(candidate.rideId) ?? undefined,
        createdAt,
        departureAt,
        origin,
        destination,
        seatsBooked,
        amountTnd,
        status: status as Booking['status'],
        paymentId: asString(candidate.paymentId) ?? undefined,
        ticketId: asString(candidate.ticketId) ?? undefined,
        payoutStatus: payoutStatus as Booking['payoutStatus'],
        refundStatus: asString(candidate.refundStatus) as Booking['refundStatus'] | undefined,
        penaltyPercent: asNumber(candidate.penaltyPercent) ?? undefined,
        note: asString(candidate.note) ?? undefined,
      } satisfies Booking;
    })
    .filter((candidate): candidate is Booking => candidate !== null);

  return bookings;
}

function sanitizeTickets(raw: unknown, fallback: Ticket[]) {
  if (!Array.isArray(raw)) {
    return fallback;
  }

  const tickets: Array<Ticket | null> = raw
    .filter(isRecord)
    .map((candidate): Ticket | null => {
      const id = asString(candidate.id);
      const userId = asString(candidate.userId);
      const bookingId = asString(candidate.bookingId);
      const mode = asString(candidate.mode);
      const title = asString(candidate.title);
      const validFrom = asString(candidate.validFrom);
      const validUntil = asString(candidate.validUntil);
      const priceTnd = asNumber(candidate.priceTnd);
      const zones = asString(candidate.zones);
      const qrPayload = asString(candidate.qrPayload);
      const status = asString(candidate.status);

      if (
        !id ||
        !userId ||
        !bookingId ||
        !mode ||
        !title ||
        !validFrom ||
        !validUntil ||
        priceTnd === null ||
        !zones ||
        !qrPayload ||
        !status
      ) {
        return null;
      }

      return {
        id,
        userId,
        bookingId,
        mode: mode as Ticket['mode'],
        title,
        validFrom,
        validUntil,
        priceTnd,
        zones,
        qrPayload,
        status: status as Ticket['status'],
      } satisfies Ticket;
    })
    .filter((candidate): candidate is Ticket => candidate !== null);

  return tickets;
}

function sanitizePayments(raw: unknown, fallback: Payment[]) {
  if (!Array.isArray(raw)) {
    return fallback;
  }

  const payments: Array<Payment | null> = raw
    .filter(isRecord)
    .map((candidate): Payment | null => {
      const id = asString(candidate.id);
      const userId = asString(candidate.userId);
      const bookingId = asString(candidate.bookingId);
      const provider = asString(candidate.provider);
      const amountTnd = asNumber(candidate.amountTnd);
      const createdAt = asString(candidate.createdAt);
      const status = asString(candidate.status);
      const payoutStatus = asString(candidate.payoutStatus);
      const summary = asString(candidate.summary);

      if (
        !id ||
        !userId ||
        !bookingId ||
        !provider ||
        amountTnd === null ||
        !createdAt ||
        !status ||
        !payoutStatus ||
        !summary
      ) {
        return null;
      }

      return {
        id,
        userId,
        bookingId,
        provider: provider as Payment['provider'],
        amountTnd,
        createdAt,
        status: status as Payment['status'],
        payoutStatus: payoutStatus as Payment['payoutStatus'],
        summary,
      } satisfies Payment;
    })
    .filter((candidate): candidate is Payment => candidate !== null);

  return payments;
}

function sanitizeFavorites(raw: unknown, fallback: FavoritePlace[]) {
  if (!Array.isArray(raw)) {
    return fallback;
  }

  const favorites: Array<FavoritePlace | null> = raw
    .filter(isRecord)
    .map((candidate): FavoritePlace | null => {
      const id = asString(candidate.id);
      const userId = asString(candidate.userId);
      const label = asString(candidate.label);
      const city = asString(candidate.city);
      const hint = asString(candidate.hint);

      if (!id || !userId || !label || !city || !hint) {
        return null;
      }

      return { id, userId, label, city, hint } satisfies FavoritePlace;
    })
    .filter((candidate): candidate is FavoritePlace => candidate !== null);

  return favorites;
}

function sanitizeNearbyTransport(raw: unknown, fallback: NearbyTransport[]) {
  if (!Array.isArray(raw)) {
    return fallback;
  }

  const nearby: Array<NearbyTransport | null> = raw
    .filter(isRecord)
    .map((candidate): NearbyTransport | null => {
      const id = asString(candidate.id);
      const mode = asString(candidate.mode);
      const title = asString(candidate.title);
      const subtitle = asString(candidate.subtitle);
      const distanceMeters = asNumber(candidate.distanceMeters);

      if (!id || !mode || !title || !subtitle || distanceMeters === null) {
        return null;
      }

      return {
        id,
        mode: mode as NearbyTransport['mode'],
        title,
        subtitle,
        distanceMeters,
      } satisfies NearbyTransport;
    })
    .filter((candidate): candidate is NearbyTransport => candidate !== null);

  return nearby;
}

export function normalizeState(raw: unknown) {
  const initial = createInitialState();

  if (!isRecord(raw)) {
    return initial;
  }

  const users = sanitizeUsers(raw.users, initial.users);
  // Keep the transit catalog authoritative so app updates replace stale local demo data.
  const lines = initial.lines;

  const normalized: AppState = {
    users,
    sessionUserId:
      typeof raw.sessionUserId === 'string' && users.some((user) => user.id === raw.sessionUserId)
        ? raw.sessionUserId
        : null,
    verificationRequests: sanitizeVerificationRequests(
      raw.verificationRequests,
      initial.verificationRequests,
    ),
    lines,
    liveVehicles: sanitizeLiveVehicles(raw.liveVehicles, initial.liveVehicles).filter((vehicle) =>
      lines.some((line) => line.id === vehicle.lineId),
    ),
    louageRides: sanitizeLouageRides(raw.louageRides, initial.louageRides).filter((ride) =>
      users.some((user) => user.id === ride.driverUserId),
    ),
    bookings: sanitizeBookings(raw.bookings, initial.bookings),
    tickets: sanitizeTickets(raw.tickets, initial.tickets),
    payments: sanitizePayments(raw.payments, initial.payments),
    favorites: sanitizeFavorites(raw.favorites, initial.favorites),
    nearbyTransport: initial.nearbyTransport,
    selectedLineId:
      typeof raw.selectedLineId === 'string' && lines.some((line) => line.id === raw.selectedLineId)
        ? raw.selectedLineId
        : initial.selectedLineId,
    locationEnabled:
      typeof raw.locationEnabled === 'boolean' ? raw.locationEnabled : initial.locationEnabled,
    locale:
      raw.locale === 'fr-TN' || raw.locale === 'ar-TN' ? (raw.locale as Locale) : initial.locale,
  };

  return normalized;
}

export function loadState() {
  if (typeof window === 'undefined') {
    return createInitialState();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return createInitialState();
  }

  try {
    return normalizeState(JSON.parse(raw));
  } catch {
    return createInitialState();
  }
}

export function saveState(state: AppState) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeState(state)));
  } catch {
    // Ignore storage failures so the UI stays usable even if persistence is unavailable.
  }
}

export function resetState() {
  const state = createInitialState();
  clearAuthStore();
  saveState(state);
  return state;
}

export async function login(state: AppState, input: LoginInput) {
  const validationError = validateLoginInput(input);
  if (validationError) {
    return { error: validationError };
  }

  const authStore = await ensureAuthStore(state);
  const email = normalizeEmail(input.email);
  const authRecord = findAuthRecord(authStore, { email });

  if (!authRecord) {
    return { error: 'Aucun compte correspondant a cet email.' };
  }

  const passwordHash = await hashPassword(input.password.trim(), authRecord.salt);
  if (passwordHash !== authRecord.passwordHash) {
    return { error: 'Mot de passe incorrect.' };
  }

  const user = state.users.find((candidate) => candidate.id === authRecord.userId);
  if (!user) {
    return { error: 'Compte introuvable.' };
  }

  const nextState = {
    ...state,
    sessionUserId: user.id,
    locale: user.locale,
  };

  return { state: nextState, user };
}

export async function signup(state: AppState, input: SignupInput) {
  const validationError = validateSignupInput(input);
  if (validationError) {
    return { error: validationError };
  }

  const authStore = await ensureAuthStore(state);
  const email = input.email ? normalizeEmail(input.email) : '';
  const phone = input.phone ? normalizePhone(input.phone) : '';

  const emailTaken = email.length > 0 && Boolean(findAuthRecord(authStore, { email }));
  const phoneTaken = phone.length > 0 && Boolean(findAuthRecord(authStore, { phone }));

  if (emailTaken) {
    return { error: 'Un compte existe deja avec cet email.' };
  }

  if (phoneTaken) {
    return { error: 'Un compte existe deja avec ce numero de telephone.' };
  }

  const newUser: UserAccount = {
    id: createId('user'),
    role: input.role,
    email: email || `${phone}@volta.local`,
    phone: phone || undefined,
    fullName: sanitizeText(input.fullName),
    city: sanitizeText(input.city),
    locale: 'fr-TN',
    createdAt: nowIso(),
    phoneVerified: input.role === 'driver' ? false : Boolean(phone),
    verificationStatus: 'not_started',
    avatarColor: input.role === 'driver' ? '#0040a1' : '#006d36',
  };

  const authRecord = await createAuthRecordForUser({
    userId: newUser.id,
    email: newUser.email,
    phone: newUser.phone,
    password: input.password.trim(),
  });
  saveAuthStore([...authStore, authRecord]);

  const nextState = {
    ...state,
    users: [...state.users, newUser],
    sessionUserId: newUser.id,
    locale: newUser.locale,
  };

  return { state: nextState, user: newUser };
}

export function logout(state: AppState) {
  return { ...state, sessionUserId: null };
}

export function setLocale(state: AppState, locale: AppState['locale']) {
  const user = findUser(state, state.sessionUserId);
  return {
    ...state,
    locale,
    users: user
      ? state.users.map((candidate) =>
          candidate.id === user.id ? { ...candidate, locale } : candidate,
        )
      : state.users,
  };
}

export function setSelectedLine(state: AppState, lineId: string) {
  if (!state.lines.some((line) => line.id === lineId)) {
    return state;
  }

  return { ...state, selectedLineId: lineId };
}

export function toggleLocation(state: AppState) {
  return { ...state, locationEnabled: !state.locationEnabled };
}

export function submitDriverVerification(
  state: AppState,
  userId: string,
  input: DriverVerificationInput,
) {
  const user = state.users.find((candidate) => candidate.id === userId);
  if (!user || user.role !== 'driver') {
    return { error: 'Seuls les conducteurs peuvent soumettre un dossier.' };
  }

  const validationError = validateDriverVerificationInput(input);
  if (validationError) {
    return { error: validationError };
  }

  const age = calculateAge(input.dateOfBirth);
  if (age < 21) {
    return { error: 'Le conducteur doit avoir au moins 21 ans.' };
  }

  const existingRequest = state.verificationRequests.find((request) => request.userId === userId);
  const requestId = existingRequest?.id ?? createId('verif');

  const nextRequest: DriverVerificationRequest = {
    id: requestId,
    userId,
    status: 'pending',
    submittedAt: nowIso(),
    cityOfResidence: sanitizeText(input.cityOfResidence),
    documents: input.documents,
  };

  return {
    state: {
      ...state,
      users: state.users.map((candidate) =>
        candidate.id === userId
          ? {
              ...candidate,
              fullName: sanitizeText(input.fullName),
              dateOfBirth: input.dateOfBirth,
              gender: input.gender,
              city: sanitizeText(input.cityOfResidence),
              phone: normalizePhone(input.phone),
              phoneVerified: true,
              verificationStatus: 'pending',
            }
          : candidate,
      ),
      verificationRequests: existingRequest
        ? state.verificationRequests.map((request) =>
            request.id === existingRequest.id ? nextRequest : request,
          )
        : [...state.verificationRequests, nextRequest],
    },
  };
}

export function reviewVerification(
  state: AppState,
  requestId: string,
  reviewerId: string,
  decision: 'approved' | 'rejected',
  rejectionReason?: string,
) {
  const reviewer = state.users.find((candidate) => candidate.id === reviewerId);
  if (!reviewer || reviewer.role !== 'admin') {
    return { error: 'Seul un administrateur peut valider un dossier.' };
  }

  const request = state.verificationRequests.find((candidate) => candidate.id === requestId);

  if (!request) {
    return { error: 'Dossier introuvable.' };
  }

  return {
    state: {
      ...state,
      verificationRequests: state.verificationRequests.map((candidate) =>
        candidate.id === requestId
          ? {
              ...candidate,
              status: decision,
              reviewedAt: nowIso(),
              reviewedBy: reviewerId,
              rejectionReason: decision === 'rejected' ? rejectionReason?.trim() : undefined,
            }
          : candidate,
      ),
      users: state.users.map((user) =>
        user.id === request.userId ? { ...user, verificationStatus: decision } : user,
      ),
    },
  };
}

export function toggleDriverLiveSharing(state: AppState, driverId: string, enabled: boolean) {
  const driver = state.users.find((user) => user.id === driverId);

  if (!driver || driver.role !== 'driver' || driver.verificationStatus !== 'approved') {
    return { error: 'Le conducteur doit etre approuve avant le partage live.' };
  }

  const driverVehicle = state.liveVehicles.find((vehicle) => vehicle.operatorUserId === driverId);

  if (!driverVehicle && !driver.driverLineId) {
    return { error: 'Aucune ligne active n est associee a ce conducteur.' };
  }

  const nextVehicles = driverVehicle
    ? state.liveVehicles.map((vehicle) =>
        vehicle.id === driverVehicle.id ? { ...vehicle, sharingEnabled: enabled } : vehicle,
      )
    : [
        ...state.liveVehicles,
        {
          id: createId('veh'),
          lineId: driver.driverLineId!,
          mode: state.lines.find((line) => line.id === driver.driverLineId)?.mode ?? 'bus',
          label: `${driver.fullName.split(' ')[0]} Live`,
          positionIndex: 0,
          nextStopId:
            state.lines.find((line) => line.id === driver.driverLineId)?.stops[0]?.id ?? '',
          etaMinutes: 2,
          sharingEnabled: enabled,
          operatorUserId: driver.id,
        },
      ];

  return {
    state: {
      ...state,
      liveVehicles: nextVehicles,
    },
  };
}

export function advanceLiveVehicles(state: AppState) {
  return {
    ...state,
    liveVehicles: state.liveVehicles.map((vehicle) => {
      if (!vehicle.sharingEnabled) {
        return vehicle;
      }

      const line = state.lines.find((candidate) => candidate.id === vehicle.lineId);

      if (!line) {
        return vehicle;
      }

      const nextIndex = (vehicle.positionIndex + 1) % line.stops.length;
      const nextStop = line.stops[nextIndex];

      return {
        ...vehicle,
        positionIndex: nextIndex,
        nextStopId: nextStop.id,
        etaMinutes: nextIndex === line.stops.length - 1 ? 1 : nextStop.etaMinutes,
      };
    }),
  };
}

export function createRide(state: AppState, driverId: string, input: CreateRideInput) {
  const driver = state.users.find((user) => user.id === driverId);

  if (!driver || driver.role !== 'driver') {
    return { error: 'Seuls les conducteurs peuvent publier une annonce.' };
  }

  if (driver.verificationStatus !== 'approved') {
    return { error: 'Verification conducteur requise avant publication.' };
  }

  const validationError = validateCreateRideInput(input);
  if (validationError) {
    return { error: validationError };
  }

  const duplicateRide = state.louageRides.some(
    (ride) =>
      ride.driverUserId === driverId &&
      ride.status === 'scheduled' &&
      ride.departureCity.toLowerCase() === input.departureCity.trim().toLowerCase() &&
      ride.destinationCity.toLowerCase() === input.destinationCity.trim().toLowerCase() &&
      ride.departureAt === input.departureAt &&
      ride.plateNumber.toLowerCase() === input.plateNumber.trim().toLowerCase(),
  );

  if (duplicateRide) {
    return { error: 'Une annonce identique existe deja pour ce depart.' };
  }

  const ride: LouageRide = {
    id: createId('ride'),
    driverUserId: driverId,
    departureCity: sanitizeText(input.departureCity),
    destinationCity: sanitizeText(input.destinationCity),
    departureAt: input.departureAt,
    availableSeats: input.availableSeats,
    totalSeats: input.availableSeats,
    priceTnd: input.priceTnd,
    vehicleModel: sanitizeText(input.vehicleModel),
    plateNumber: sanitizeText(input.plateNumber).toUpperCase(),
    vehiclePhotoName: input.vehiclePhotoName?.trim(),
    status: 'scheduled',
    liveProofEnabled: true,
  };

  return {
    state: {
      ...state,
      louageRides: [ride, ...state.louageRides],
    },
    ride,
  };
}

export function createLineCheckout(
  state: AppState,
  passengerUserId: string,
  lineId: string,
): CheckoutIntent | null {
  const line = state.lines.find((candidate) => candidate.id === lineId);

  if (!line || !state.users.some((user) => user.id === passengerUserId)) {
    return null;
  }

  const departureAt = new Date();
  departureAt.setMinutes(departureAt.getMinutes() + 5);

  return {
    kind: 'line_ticket',
    title: `${line.name} ${line.code}`,
    description: `${line.origin} vers ${line.destination}`,
    amountTnd: line.fareTnd,
    mode: line.mode,
    passengerUserId,
    lineId,
    origin: line.origin,
    destination: line.destination,
    departureAt: departureAt.toISOString(),
  };
}

export function createRideCheckout(
  state: AppState,
  passengerUserId: string,
  rideId: string,
): CheckoutIntent | null {
  const ride = state.louageRides.find((candidate) => candidate.id === rideId);

  if (
    !ride ||
    !state.users.some((user) => user.id === passengerUserId) ||
    ride.status !== 'scheduled' ||
    ride.availableSeats < 1
  ) {
    return null;
  }

  return {
    kind: 'louage_booking',
    title: `Louage ${ride.departureCity} -> ${ride.destinationCity}`,
    description: `${ride.vehicleModel} - ${ride.plateNumber}`,
    amountTnd: ride.priceTnd,
    mode: 'louage',
    passengerUserId,
    rideId,
    seats: 1,
    origin: ride.departureCity,
    destination: ride.destinationCity,
    departureAt: ride.departureAt,
  };
}

export function confirmPayment(
  state: AppState,
  checkout: CheckoutIntent,
  provider: PaymentProvider,
): MutationResult<{ bookingId: string; ticketId: string }> | { error: string } {
  if (!state.users.some((user) => user.id === checkout.passengerUserId)) {
    return { error: 'Compte passager introuvable.' };
  }

  if (checkout.kind === 'line_ticket') {
    const line = state.lines.find((candidate) => candidate.id === checkout.lineId);
    if (!line) {
      return { error: 'Ligne introuvable.' };
    }
  }

  if (checkout.kind === 'louage_booking') {
    const ride = state.louageRides.find((candidate) => candidate.id === checkout.rideId);
    if (!ride || ride.status !== 'scheduled' || ride.availableSeats < (checkout.seats ?? 1)) {
      return { error: 'Ce trajet n est plus disponible.' };
    }
  }

  const paymentId = createId('pay');
  const bookingId = createId('booking');

  const booking: Booking = {
    id: bookingId,
    type: checkout.kind === 'louage_booking' ? 'louage' : 'line_ticket',
    mode: checkout.mode,
    passengerUserId: checkout.passengerUserId,
    driverUserId:
      checkout.rideId
        ? state.louageRides.find((ride) => ride.id === checkout.rideId)?.driverUserId
        : undefined,
    lineId: checkout.lineId,
    rideId: checkout.rideId,
    createdAt: nowIso(),
    departureAt: checkout.departureAt,
    origin: checkout.origin,
    destination: checkout.destination,
    seatsBooked: checkout.seats ?? 1,
    amountTnd: checkout.amountTnd,
    status: 'confirmed',
    paymentId,
    payoutStatus: checkout.kind === 'louage_booking' ? 'held' : 'n/a',
    refundStatus: 'none',
  };

  const payment: Payment = {
    id: paymentId,
    userId: checkout.passengerUserId,
    bookingId,
    provider,
    amountTnd: checkout.amountTnd,
    createdAt: nowIso(),
    status: 'paid',
    payoutStatus: checkout.kind === 'louage_booking' ? 'held' : 'n/a',
    summary: checkout.title,
  };

  const validUntil =
    checkout.kind === 'line_ticket'
      ? new Date(Date.now() + 90 * 60 * 1000).toISOString()
      : new Date(new Date(checkout.departureAt).getTime() + 6 * 60 * 60 * 1000).toISOString();

  const ticket: Ticket = {
    id: createId('ticket'),
    userId: checkout.passengerUserId,
    bookingId,
    mode: checkout.mode,
    title: checkout.title,
    validFrom: nowIso(),
    validUntil,
    priceTnd: checkout.amountTnd,
    zones:
      checkout.kind === 'line_ticket'
        ? `${checkout.origin} - ${checkout.destination}`
        : 'Interurbain',
    qrPayload: JSON.stringify({
      ticketId: bookingId,
      bookingId,
      validUntil,
      origin: checkout.origin,
      destination: checkout.destination,
      mode: checkout.mode,
    }),
    status: 'active',
  };

  const nextRides = checkout.rideId
    ? state.louageRides.map((ride) =>
        ride.id === checkout.rideId
          ? { ...ride, availableSeats: Math.max(0, ride.availableSeats - (checkout.seats ?? 1)) }
          : ride,
      )
    : state.louageRides;

  return {
    state: {
      ...state,
      louageRides: nextRides,
      bookings: [{ ...booking, ticketId: ticket.id }, ...state.bookings],
      payments: [payment, ...state.payments],
      tickets: [ticket, ...state.tickets],
    },
    bookingId,
    ticketId: ticket.id,
  };
}

export function getSearchResults(state: AppState, filters: SearchFilters) {
  const departure = normalizeText(filters.departure);
  const destination = normalizeText(filters.destination);
  const searchDate = filters.date;
  const baseDeparture = !Number.isNaN(new Date(searchDate).getTime())
    ? new Date(searchDate)
    : new Date();

  const lineResults: SearchResult[] = state.lines
    .filter((line) => {
      const matchesDeparture =
        departure.length === 0 ||
        normalizeText(line.origin).includes(departure) ||
        line.stops.some((stop) => normalizeText(stop.name).includes(departure));
      const matchesDestination =
        destination.length === 0 ||
        normalizeText(line.destination).includes(destination) ||
        normalizeText(line.routeLabel).includes(destination) ||
        line.stops.some((stop) => normalizeText(stop.name).includes(destination));

      return matchesDeparture && matchesDestination;
    })
    .map((line) => ({
      id: `${line.id}-search`,
      sourceId: line.id,
      mode: line.mode,
      title: `${line.name} ${line.code}`,
      departure: line.origin,
      destination: line.destination,
      departureAt: new Date(baseDeparture.getTime() + 20 * 60 * 1000).toISOString(),
      durationMinutes: line.durationMinutes,
      priceTnd: line.fareTnd,
      lineCode: line.code,
      providerLabel: `${line.operatorName ?? 'Operateur non renseigne'} • ${line.servicePattern ?? `Intervalle ${line.intervalMinutes} min`}`,
      ctaLabel: 'Acheter ticket',
    }));

  const rideResults: SearchResult[] = state.louageRides
    .filter((ride) => {
      if (ride.status !== 'scheduled' || ride.availableSeats < 1) {
        return false;
      }

      const matchesDeparture =
        departure.length === 0 || normalizeText(ride.departureCity).includes(departure);
      const matchesDestination =
        destination.length === 0 || normalizeText(ride.destinationCity).includes(destination);
      const matchesDate =
        searchDate.length === 0 ||
        new Date(ride.departureAt).toISOString().slice(0, 10) === searchDate.slice(0, 10);

      return matchesDeparture && matchesDestination && matchesDate;
    })
    .map((ride) => ({
      id: `${ride.id}-search`,
      sourceId: ride.id,
      mode: 'louage',
      title: `Louage ${ride.departureCity} -> ${ride.destinationCity}`,
      departure: ride.departureCity,
      destination: ride.destinationCity,
      departureAt: ride.departureAt,
      durationMinutes: Math.max(
        120,
        Math.round(Math.abs(new Date(ride.departureAt).getHours() - 11) * 18 + ride.priceTnd * 2),
      ),
      priceTnd: ride.priceTnd,
      remainingSeats: ride.availableSeats,
      providerLabel: ride.vehicleModel,
      ctaLabel: 'Reserver',
    }));

  const results = [...lineResults, ...rideResults];

  if (filters.sortBy === 'cheapest') {
    return results.sort((left, right) => left.priceTnd - right.priceTnd);
  }

  if (filters.sortBy === 'duration') {
    return results.sort((left, right) => left.durationMinutes - right.durationMinutes);
  }

  return results.sort(
    (left, right) => new Date(left.departureAt).getTime() - new Date(right.departureAt).getTime(),
  );
}

export function cancelPassengerBooking(
  state: AppState,
  bookingId: string,
  passengerUserId: string,
  now: Date = new Date(),
) {
  const booking = state.bookings.find((candidate) => candidate.id === bookingId);

  if (!booking || booking.type !== 'louage' || booking.passengerUserId !== passengerUserId) {
    return { error: 'Reservation louage introuvable.' };
  }

  if (!['confirmed', 'awaiting_passenger_confirmation'].includes(booking.status)) {
    return { error: 'Cette reservation ne peut plus etre annulee.' };
  }

  const diffHours =
    (new Date(booking.departureAt).getTime() - now.getTime()) / (1000 * 60 * 60);
  const refundable = diffHours >= 2;

  return {
    state: {
      ...state,
      bookings: state.bookings.map((candidate) =>
        candidate.id === bookingId
          ? {
              ...candidate,
              status: 'cancelled_by_passenger' as BookingStatus,
              refundStatus: refundable ? 'eligible' : 'non_refundable',
              payoutStatus: refundable ? 'refunded' : candidate.payoutStatus,
              note: refundable
                ? 'Annulation dans le delai de grace: remboursement autorise.'
                : 'Annulation apres delai de grace: non remboursable.',
            }
          : candidate,
      ),
      payments: state.payments.map((payment) =>
        payment.bookingId === bookingId && refundable
          ? { ...payment, status: 'refunded', payoutStatus: 'refunded' }
          : payment,
      ),
      louageRides: state.louageRides.map((ride) =>
        ride.id === booking.rideId
          ? { ...ride, availableSeats: ride.availableSeats + booking.seatsBooked }
          : ride,
      ),
    },
  };
}

export function cancelDriverRide(
  state: AppState,
  rideId: string,
  driverId: string,
  now: Date = new Date(),
) {
  const ride = state.louageRides.find((candidate) => candidate.id === rideId);

  if (!ride || ride.driverUserId !== driverId) {
    return { error: 'Annonce introuvable.' };
  }

  if (ride.status !== 'scheduled') {
    return { error: 'Cette annonce ne peut plus etre annulee.' };
  }

  const diffHours =
    (new Date(ride.departureAt).getTime() - now.getTime()) / (1000 * 60 * 60);
  const penalty = diffHours < 1 ? 10 : 0;

  return {
    state: {
      ...state,
      louageRides: state.louageRides.map((candidate) =>
        candidate.id === rideId ? { ...candidate, status: 'cancelled' } : candidate,
      ),
      bookings: state.bookings.map((booking) =>
        booking.rideId === rideId &&
        ['confirmed', 'awaiting_passenger_confirmation'].includes(booking.status)
          ? {
              ...booking,
              status: 'cancelled_by_driver' as BookingStatus,
              refundStatus: 'refunded',
              payoutStatus: 'refunded',
              penaltyPercent: penalty,
              note:
                penalty > 0
                  ? 'Annulation conducteur apres delai: remboursement total voyageur et penalite 10%.'
                  : 'Annulation conducteur: remboursement total voyageur.',
            }
          : booking,
      ),
      payments: state.payments.map((payment) => {
        const impacted = state.bookings.find(
          (booking) => booking.id === payment.bookingId && booking.rideId === rideId,
        );
        return impacted ? { ...payment, status: 'refunded', payoutStatus: 'refunded' } : payment;
      }),
    },
  };
}

export function markRideAwaitingConfirmation(
  state: AppState,
  bookingId: string,
  driverUserId: string,
) {
  const booking = state.bookings.find((candidate) => candidate.id === bookingId);
  if (!booking || booking.driverUserId !== driverUserId) {
    return { error: 'Reservation introuvable.' };
  }

  if (booking.status !== 'confirmed') {
    return { error: 'Cette reservation ne peut pas passer en attente de confirmation.' };
  }

  return {
    state: {
      ...state,
      bookings: state.bookings.map((candidate) =>
        candidate.id === bookingId
          ? { ...candidate, status: 'awaiting_passenger_confirmation' }
          : candidate,
      ),
    },
  };
}

export function confirmRideCompletion(
  state: AppState,
  bookingId: string,
  passengerUserId: string,
) {
  const booking = state.bookings.find((candidate) => candidate.id === bookingId);
  if (!booking || booking.passengerUserId !== passengerUserId) {
    return { error: 'Reservation introuvable.' };
  }

  if (booking.status !== 'awaiting_passenger_confirmation') {
    return { error: 'Aucune confirmation passager n est attendue pour ce trajet.' };
  }

  return {
    state: {
      ...state,
      bookings: state.bookings.map((candidate) =>
        candidate.id === bookingId
          ? {
              ...candidate,
              status: 'completed',
              payoutStatus: 'released',
              note: 'Trajet confirme par le passager.',
            }
          : candidate,
      ),
      payments: state.payments.map((payment) =>
        payment.bookingId === bookingId ? { ...payment, payoutStatus: 'released' } : payment,
      ),
    },
  };
}

export function reportNoShow(state: AppState, bookingId: string, driverUserId: string) {
  const booking = state.bookings.find((candidate) => candidate.id === bookingId);

  if (!booking || booking.driverUserId !== driverUserId) {
    return { error: 'Reservation introuvable.' };
  }

  if (!['confirmed', 'awaiting_passenger_confirmation'].includes(booking.status)) {
    return { error: 'Le statut actuel ne permet pas de signaler un no-show.' };
  }

  const liveProof = state.liveVehicles.some(
    (vehicle) => vehicle.operatorUserId === booking.driverUserId && vehicle.sharingEnabled,
  );

  return {
    state: {
      ...state,
      bookings: state.bookings.map((candidate) =>
        candidate.id === bookingId
          ? {
              ...candidate,
              status: 'no_show_reported',
              payoutStatus: liveProof ? 'eligible_with_proof' : candidate.payoutStatus,
              note: liveProof
                ? 'Absence voyageur signalee avec preuve de presence live.'
                : 'Absence voyageur signalee sans preuve live suffisante.',
            }
          : candidate,
      ),
      payments: state.payments.map((payment) =>
        payment.bookingId === bookingId && liveProof
          ? { ...payment, payoutStatus: 'eligible_with_proof' }
          : payment,
      ),
    },
  };
}

export function getCurrentUser(state: AppState) {
  return findUser(state, state.sessionUserId);
}
