import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { createEmptyState } from '../constants';
import {
  AppState,
  CheckoutIntent,
  CreateRideInput,
  DriverVerificationInput,
  Locale,
  LoginInput,
  PaymentProvider,
  Screen,
  SearchFilters,
  SignupInput,
  UserAccount,
} from '../types';
import { getSearchResults } from '../services/voltaService';
import {
  cancelDriverRideRemote,
  cancelPassengerBookingRemote,
  confirmCheckout,
  confirmRideCompletionRemote,
  createCheckoutForLine,
  createCheckoutForRide,
  createRideListing,
  fetchUserProfileOnce,
  loginWithFirebase,
  logoutFromFirebase,
  markBookingAwaitingConfirmationRemote,
  reportNoShowRemote,
  reviewVerificationRequest,
  signupWithFirebase,
  submitVerificationRequest,
  subscribeToAllUsersForAdmin,
  subscribeToBookings,
  subscribeToFavorites,
  subscribeToLines,
  subscribeToLiveVehicles,
  subscribeToNearbyTransport,
  subscribeToPayments,
  subscribeToRides,
  subscribeToSession,
  subscribeToTickets,
  subscribeToUserProfile,
  subscribeToVerificationRequests,
  toggleLiveSharing as toggleLiveSharingRemote,
  updateLocalePreference,
} from '../services/firebaseVoltaService';
import {
  validateCreateRideInput,
  validateDriverVerificationInput,
  validateLoginInput,
  validateSignupInput,
} from '../services/validationService';

const SELECTED_LINE_STORAGE_KEY = 'volta-selected-line-id';
const LOCATION_STORAGE_KEY = 'volta-location-enabled';

function hasWindow() {
  return typeof window !== 'undefined';
}

function loadStoredLineId() {
  if (!hasWindow()) {
    return 'metro-m1';
  }

  return window.localStorage.getItem(SELECTED_LINE_STORAGE_KEY) ?? 'metro-m1';
}

function loadStoredLocationEnabled() {
  if (!hasWindow()) {
    return true;
  }

  const value = window.localStorage.getItem(LOCATION_STORAGE_KEY);
  return value === null ? true : value === 'true';
}

interface VoltaContextValue {
  state: AppState;
  currentUser: UserAccount | null;
  checkout: CheckoutIntent | null;
  setCheckout: (checkout: CheckoutIntent | null) => void;
  loginWithEmail: (input: LoginInput) => Promise<{ ok: boolean; message?: string; nextScreen?: Screen }>;
  signupAccount: (input: SignupInput) => Promise<{ ok: boolean; message?: string; nextScreen?: Screen }>;
  logoutSession: () => void;
  resetDemo: () => void;
  submitVerification: (input: DriverVerificationInput) => Promise<{ ok: boolean; message?: string }>;
  reviewDriverRequest: (
    requestId: string,
    decision: 'approved' | 'rejected',
    rejectionReason?: string,
  ) => Promise<{ ok: boolean; message?: string }>;
  setLine: (lineId: string) => void;
  setAppLocale: (locale: Locale) => void;
  toggleNearbyLocation: () => void;
  toggleLiveSharing: (enabled: boolean) => Promise<{ ok: boolean; message?: string }>;
  createDriverRide: (input: CreateRideInput) => Promise<{ ok: boolean; message?: string }>;
  startLinePayment: (lineId: string) => Promise<{ ok: boolean; message?: string }>;
  startLouagePayment: (rideId: string) => Promise<{ ok: boolean; message?: string }>;
  confirmCheckoutPayment: (provider: PaymentProvider) => Promise<{ ok: boolean; message?: string }>;
  searchTransport: (filters: SearchFilters) => ReturnType<typeof getSearchResults>;
  cancelBooking: (bookingId: string) => Promise<{ ok: boolean; message?: string }>;
  cancelRide: (rideId: string) => Promise<{ ok: boolean; message?: string }>;
  markBookingAwaitingConfirmation: (bookingId: string) => Promise<{ ok: boolean; message?: string }>;
  confirmBookingCompletion: (bookingId: string) => Promise<{ ok: boolean; message?: string }>;
  reportBookingNoShow: (bookingId: string) => Promise<{ ok: boolean; message?: string }>;
}

const VoltaContext = createContext<VoltaContextValue | undefined>(undefined);

export function VoltaProvider({ children }: { children: ReactNode }) {
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [selfUser, setSelfUser] = useState<UserAccount | null>(null);
  const [adminUsers, setAdminUsers] = useState<UserAccount[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<AppState['verificationRequests']>([]);
  const [lines, setLines] = useState<AppState['lines']>([]);
  const [liveVehicles, setLiveVehicles] = useState<AppState['liveVehicles']>([]);
  const [louageRides, setLouageRides] = useState<AppState['louageRides']>([]);
  const [bookings, setBookings] = useState<AppState['bookings']>([]);
  const [tickets, setTickets] = useState<AppState['tickets']>([]);
  const [payments, setPayments] = useState<AppState['payments']>([]);
  const [favorites, setFavorites] = useState<AppState['favorites']>([]);
  const [nearbyTransport, setNearbyTransport] = useState<AppState['nearbyTransport']>([]);
  const [selectedLineId, setSelectedLineId] = useState(loadStoredLineId);
  const [locationEnabled, setLocationEnabled] = useState(loadStoredLocationEnabled);
  const [checkout, setCheckout] = useState<CheckoutIntent | null>(null);

  useEffect(() => {
    return subscribeToSession((user) => {
      setSessionUserId(user?.uid ?? null);
    });
  }, []);

  useEffect(() => {
    if (!sessionUserId) {
      setSelfUser(null);
      setAdminUsers([]);
      setVerificationRequests([]);
      setBookings([]);
      setTickets([]);
      setPayments([]);
      setFavorites([]);
      return;
    }

    return subscribeToUserProfile(sessionUserId, setSelfUser);
  }, [sessionUserId]);

  useEffect(() => {
    if (selfUser?.role !== 'admin') {
      setAdminUsers([]);
      return;
    }

    return subscribeToAllUsersForAdmin((users) => {
      setAdminUsers(users);
    });
  }, [selfUser?.role]);

  useEffect(() => {
    if (!sessionUserId) {
      setLines([]);
      setLiveVehicles([]);
      setLouageRides([]);
      setNearbyTransport([]);
      return;
    }

    const unsubscribers = [
      subscribeToLines(setLines),
      subscribeToLiveVehicles(setLiveVehicles),
      subscribeToRides(setLouageRides),
      subscribeToNearbyTransport(setNearbyTransport),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [sessionUserId]);

  useEffect(() => {
    if (!sessionUserId || !selfUser) {
      setVerificationRequests([]);
      setBookings([]);
      setTickets([]);
      setPayments([]);
      setFavorites([]);
      return;
    }

    const unsubscribers = [
      subscribeToVerificationRequests(sessionUserId, selfUser.role, setVerificationRequests),
      subscribeToBookings(sessionUserId, selfUser.role, setBookings),
      subscribeToTickets(sessionUserId, setTickets),
      subscribeToPayments(sessionUserId, selfUser.role, setPayments),
      subscribeToFavorites(sessionUserId, setFavorites),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [sessionUserId, selfUser]);

  useEffect(() => {
    if (!hasWindow()) {
      return;
    }

    window.localStorage.setItem(SELECTED_LINE_STORAGE_KEY, selectedLineId);
  }, [selectedLineId]);

  useEffect(() => {
    if (!hasWindow()) {
      return;
    }

    window.localStorage.setItem(LOCATION_STORAGE_KEY, String(locationEnabled));
  }, [locationEnabled]);

  const users = useMemo(() => {
    if (!selfUser) {
      return [];
    }

    if (selfUser.role !== 'admin') {
      return [selfUser];
    }

    const unique = new Map<string, UserAccount>();
    for (const user of [selfUser, ...adminUsers]) {
      unique.set(user.id, user);
    }

    return Array.from(unique.values());
  }, [adminUsers, selfUser]);

  const state = useMemo<AppState>(
    () => ({
      ...createEmptyState(),
      users,
      sessionUserId,
      verificationRequests,
      lines,
      liveVehicles,
      louageRides,
      bookings,
      tickets,
      payments,
      favorites,
      nearbyTransport,
      selectedLineId,
      locationEnabled,
      locale: selfUser?.locale ?? 'fr-TN',
    }),
    [
      bookings,
      favorites,
      lines,
      liveVehicles,
      locationEnabled,
      louageRides,
      nearbyTransport,
      payments,
      selectedLineId,
      selfUser?.locale,
      sessionUserId,
      tickets,
      users,
      verificationRequests,
    ],
  );

  const value: VoltaContextValue = {
    state,
    currentUser: selfUser,
    checkout,
    setCheckout,
    async loginWithEmail(input) {
      const validationError = validateLoginInput(input);
      if (validationError) {
        return { ok: false, message: validationError };
      }

      const result = await loginWithFirebase(input);
      if (!result.ok) {
        return result;
      }

      const profile = result.userId ? await fetchUserProfileOnce(result.userId) : null;
      const role = profile?.role;
      return {
        ok: true,
        nextScreen:
          role === 'driver' ? 'driver-dashboard' : role === 'admin' ? 'admin-review' : 'explore',
      };
    },
    async signupAccount(input) {
      const validationError = validateSignupInput(input);
      if (validationError) {
        return { ok: false, message: validationError };
      }

      const result = await signupWithFirebase(input);
      if (!result.ok) {
        return result;
      }

      return {
        ok: true,
        nextScreen: input.role === 'driver' ? 'driver-verification' : 'explore',
      };
    },
    logoutSession() {
      setCheckout(null);
      void logoutFromFirebase();
    },
    resetDemo() {
      setCheckout(null);
      setSelectedLineId('metro-m1');
      setLocationEnabled(true);
      if (hasWindow()) {
        window.localStorage.removeItem(SELECTED_LINE_STORAGE_KEY);
        window.localStorage.removeItem(LOCATION_STORAGE_KEY);
      }
      void logoutFromFirebase();
    },
    async submitVerification(input) {
      if (!selfUser) {
        return { ok: false, message: 'Connexion requise.' };
      }

      const validationError = validateDriverVerificationInput(input);
      if (validationError) {
        return { ok: false, message: validationError };
      }

      try {
        await submitVerificationRequest(selfUser.id, input);
        return { ok: true, message: 'Dossier envoye a l equipe de verification.' };
      } catch (error) {
        return {
          ok: false,
          message: error instanceof Error ? error.message : 'Impossible d envoyer le dossier.',
        };
      }
    },
    async reviewDriverRequest(requestId, decision, rejectionReason) {
      if (!selfUser) {
        return { ok: false, message: 'Connexion admin requise.' };
      }

      try {
        await reviewVerificationRequest(requestId, decision, rejectionReason);
        return {
          ok: true,
          message: `Dossier ${decision === 'approved' ? 'approuve' : 'rejete'}.`,
        };
      } catch (error) {
        return {
          ok: false,
          message: error instanceof Error ? error.message : 'Impossible de revoir ce dossier.',
        };
      }
    },
    setLine(lineId) {
      setSelectedLineId(lineId);
    },
    setAppLocale(locale) {
      if (!selfUser) {
        return;
      }

      setSelfUser({ ...selfUser, locale });
      void updateLocalePreference(locale).catch(() => {
        setSelfUser(selfUser);
      });
    },
    toggleNearbyLocation() {
      setLocationEnabled((current) => !current);
    },
    async toggleLiveSharing(enabled) {
      if (!selfUser) {
        return { ok: false, message: 'Connexion requise.' };
      }

      try {
        await toggleLiveSharingRemote(enabled);
        return { ok: true, message: 'Statut live mis a jour.' };
      } catch (error) {
        return {
          ok: false,
          message: error instanceof Error ? error.message : 'Impossible de mettre a jour le live.',
        };
      }
    },
    async createDriverRide(input) {
      if (!selfUser) {
        return { ok: false, message: 'Connexion requise.' };
      }

      const validationError = validateCreateRideInput(input);
      if (validationError) {
        return { ok: false, message: validationError };
      }

      try {
        await createRideListing(selfUser.id, input);
        return { ok: true, message: 'Annonce louage publiee.' };
      } catch (error) {
        return {
          ok: false,
          message: error instanceof Error ? error.message : 'Impossible de publier ce trajet.',
        };
      }
    },
    async startLinePayment(lineId) {
      if (!selfUser) {
        return { ok: false, message: 'Connexion requise pour acheter un ticket.' };
      }

      try {
        const nextCheckout = await createCheckoutForLine(lineId);
        setCheckout(nextCheckout);
        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          message: error instanceof Error ? error.message : 'Ligne introuvable.',
        };
      }
    },
    async startLouagePayment(rideId) {
      if (!selfUser) {
        return { ok: false, message: 'Connexion requise pour reserver.' };
      }

      try {
        const nextCheckout = await createCheckoutForRide(rideId);
        setCheckout(nextCheckout);
        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          message: error instanceof Error ? error.message : 'Trajet indisponible.',
        };
      }
    },
    async confirmCheckoutPayment(provider) {
      if (!checkout) {
        return { ok: false, message: 'Aucune commande en cours.' };
      }

      try {
        await confirmCheckout(checkout, provider);
        setCheckout(null);
        return { ok: true, message: 'Paiement confirme et ticket genere.' };
      } catch (error) {
        return {
          ok: false,
          message: error instanceof Error ? error.message : 'Impossible de confirmer le paiement.',
        };
      }
    },
    searchTransport(filters) {
      return getSearchResults(state, filters);
    },
    async cancelBooking(bookingId) {
      if (!selfUser) {
        return { ok: false, message: 'Connexion requise.' };
      }

      try {
        await cancelPassengerBookingRemote(bookingId);
        return { ok: true, message: 'Reservation mise a jour.' };
      } catch (error) {
        return {
          ok: false,
          message: error instanceof Error ? error.message : 'Impossible d annuler cette reservation.',
        };
      }
    },
    async cancelRide(rideId) {
      if (!selfUser) {
        return { ok: false, message: 'Connexion requise.' };
      }

      try {
        await cancelDriverRideRemote(rideId);
        return { ok: true, message: 'Annonce annulee et remboursements appliques.' };
      } catch (error) {
        return {
          ok: false,
          message: error instanceof Error ? error.message : 'Impossible d annuler cette annonce.',
        };
      }
    },
    async markBookingAwaitingConfirmation(bookingId) {
      try {
        await markBookingAwaitingConfirmationRemote(bookingId);
        return { ok: true, message: 'Reservation en attente de confirmation passager.' };
      } catch (error) {
        return {
          ok: false,
          message:
            error instanceof Error
              ? error.message
              : 'Impossible de mettre a jour le statut de cette reservation.',
        };
      }
    },
    async confirmBookingCompletion(bookingId) {
      try {
        await confirmRideCompletionRemote(bookingId);
        return { ok: true, message: 'Trajet confirme.' };
      } catch (error) {
        return {
          ok: false,
          message: error instanceof Error ? error.message : 'Impossible de confirmer ce trajet.',
        };
      }
    },
    async reportBookingNoShow(bookingId) {
      if (!selfUser) {
        return { ok: false, message: 'Connexion requise.' };
      }

      try {
        await reportNoShowRemote(bookingId);
        return { ok: true, message: 'Absence signalee avec statut de preuve mis a jour.' };
      } catch (error) {
        return {
          ok: false,
          message: error instanceof Error ? error.message : 'Impossible de signaler ce no-show.',
        };
      }
    },
  };

  return <VoltaContext.Provider value={value}>{children}</VoltaContext.Provider>;
}

export function useVolta() {
  const context = useContext(VoltaContext);

  if (!context) {
    throw new Error('useVolta must be used within VoltaProvider');
  }

  return context;
}
