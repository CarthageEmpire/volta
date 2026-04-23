import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createEmptyState, createInitialState } from '../constants';
import {
  AppState,
  CheckoutIntent,
  CreateRideInput,
  DriverVerificationInput,
  Locale,
  LoginInput,
  PaymentProvider,
  Screen,
  SignupInput,
  UserAccount,
} from '../types';
import {
  cancelDriverRideRemote,
  cancelPassengerBookingRemote,
  confirmCheckout,
  confirmRideCompletionRemote,
  createCheckoutForLine,
  createCheckoutForRide,
  createRideListing,
  fetchUserProfileOnce,
  getAuthenticatedUserFallback,
  loginWithFirebase,
  loginWithGoogleFirebase,
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
  backupUserProfileToCloud,
  mergeByLatestUpdatedAt,
  pullCloudState,
  pushLocalStateToCloud,
} from '../services/firestoreSyncService';
import {
  clearLocalStorageSettings,
  loadLocalCache,
  saveLocalCache,
  saveStoredLineId,
  saveStoredLocationEnabled,
} from '../services/localStorageService';
import {
  cancelDriverRide as cancelDriverRideLocal,
  cancelPassengerBooking as cancelPassengerBookingLocal,
  confirmPayment as confirmPaymentLocal,
  confirmRideCompletion as confirmRideCompletionLocal,
  createLineCheckout,
  createRide as createRideLocal,
  createRideCheckout,
  markRideAwaitingConfirmation as markRideAwaitingConfirmationLocal,
  reportNoShow as reportNoShowLocal,
  reviewVerification,
  setLocale as setLocalLocale,
  submitDriverVerification as submitDriverVerificationLocal,
  toggleDriverLiveSharing as toggleDriverLiveSharingLocal,
  toggleLocation as toggleLocationLocal,
} from '../services/voltaService';
import {
  validateCreateRideInput,
  validateDriverVerificationInput,
  validateLoginInput,
  validateSignupInput,
} from '../services/validationService';

interface VoltaContextValue {
  state: AppState;
  currentUser: UserAccount | null;
  checkout: CheckoutIntent | null;
  setCheckout: (checkout: CheckoutIntent | null) => void;
  loginWithEmail: (input: LoginInput) => Promise<{ ok: boolean; message?: string; nextScreen?: Screen }>;
  loginWithGoogle: () => Promise<{ ok: boolean; message?: string; nextScreen?: Screen }>;
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
  toggleLiveSharing: (
    enabled: boolean,
    location?: {
      latitude?: number;
      longitude?: number;
      accuracyMeters?: number;
    },
  ) => Promise<{ ok: boolean; message?: string }>;
  createDriverRide: (input: CreateRideInput) => Promise<{ ok: boolean; message?: string }>;
  startLinePayment: (lineId: string) => Promise<{ ok: boolean; message?: string }>;
  startLouagePayment: (rideId: string) => Promise<{ ok: boolean; message?: string }>;
  confirmCheckoutPayment: (
    provider: PaymentProvider,
  ) => Promise<{ ok: boolean; message?: string; paymentStatus?: AppState['payments'][number]['status'] }>;
  cancelBooking: (bookingId: string) => Promise<{ ok: boolean; message?: string }>;
  cancelRide: (rideId: string) => Promise<{ ok: boolean; message?: string }>;
  markBookingAwaitingConfirmation: (bookingId: string) => Promise<{ ok: boolean; message?: string }>;
  confirmBookingCompletion: (bookingId: string) => Promise<{ ok: boolean; message?: string }>;
  reportBookingNoShow: (bookingId: string) => Promise<{ ok: boolean; message?: string }>;
}

const VoltaContext = createContext<VoltaContextValue | undefined>(undefined);

export function VoltaProvider({ children }: { children: ReactNode }) {
  const [localCacheBundle] = useState(() => loadLocalCache());
  const localCache = localCacheBundle.state;
  const localUpdatedAtRef = useRef(localCacheBundle.updatedAt);
  const initialSyncUserIdRef = useRef<string | null>(null);
  const syncDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sessionUserId, setSessionUserId] = useState<string | null>(localCache.sessionUserId ?? null);
  const [selfUser, setSelfUser] = useState<UserAccount | null>(null);
  const [fallbackUser, setFallbackUser] = useState<UserAccount | null>(null);
  const [adminUsers, setAdminUsers] = useState<UserAccount[]>(localCache.users);
  const [verificationRequests, setVerificationRequests] = useState<AppState['verificationRequests']>(
    localCache.verificationRequests,
  );
  const [lines, setLines] = useState<AppState['lines']>(localCache.lines);
  const [liveVehicles, setLiveVehicles] = useState<AppState['liveVehicles']>(localCache.liveVehicles);
  const [louageRides, setLouageRides] = useState<AppState['louageRides']>(localCache.louageRides);
  const [bookings, setBookings] = useState<AppState['bookings']>(localCache.bookings);
  const [tickets, setTickets] = useState<AppState['tickets']>(localCache.tickets);
  const [payments, setPayments] = useState<AppState['payments']>(localCache.payments);
  const [favorites, setFavorites] = useState<AppState['favorites']>(localCache.favorites);
  const [nearbyTransport, setNearbyTransport] = useState<AppState['nearbyTransport']>(
    localCache.nearbyTransport,
  );
  const [selectedLineId, setSelectedLineId] = useState(localCache.selectedLineId);
  const [locationEnabled, setLocationEnabled] = useState(localCache.locationEnabled);
  const [checkout, setCheckout] = useState<CheckoutIntent | null>(null);

  useEffect(() => {
    return subscribeToSession((user) => {
      setSessionUserId(user?.uid ?? null);
      if (!user) {
        setFallbackUser(null);
      }
    });
  }, []);

  useEffect(() => {
    if (!sessionUserId) {
      setSelfUser(null);
      setFallbackUser(null);
      return;
    }

    return subscribeToUserProfile(sessionUserId, setSelfUser);
  }, [sessionUserId]);

  useEffect(() => {
    if (!sessionUserId || selfUser || fallbackUser?.id === sessionUserId) {
      return;
    }

    let cancelled = false;
    void getAuthenticatedUserFallback().then((user) => {
      if (!cancelled && user?.id === sessionUserId) {
        setFallbackUser(user);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [fallbackUser?.id, selfUser, sessionUserId]);

  useEffect(() => {
    if (selfUser && fallbackUser?.id === selfUser.id) {
      setFallbackUser(null);
    }
  }, [fallbackUser?.id, selfUser]);

  const effectiveUser = selfUser ?? (fallbackUser?.id === sessionUserId ? fallbackUser : null);

  useEffect(() => {
    if (effectiveUser?.role !== 'admin') {
      setAdminUsers([]);
      return;
    }

    return subscribeToAllUsersForAdmin((users) => {
      setAdminUsers(users);
    });
  }, [effectiveUser?.role]);

  useEffect(() => {
    if (!sessionUserId) {
      return;
    }

    const unsubscribers = [
      subscribeToLines((items) => {
        setLines((current) => (items.length > 0 ? items : current));
      }),
      subscribeToLiveVehicles((items) => {
        setLiveVehicles((current) => (items.length > 0 ? items : current));
      }),
      subscribeToRides((items) => {
        setLouageRides((current) => (items.length > 0 ? items : current));
      }),
      subscribeToNearbyTransport((items) => {
        setNearbyTransport((current) => (items.length > 0 ? items : current));
      }),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [sessionUserId]);

  useEffect(() => {
    if (!sessionUserId || !effectiveUser) {
      return;
    }

    const unsubscribers = [
      subscribeToVerificationRequests(sessionUserId, effectiveUser.role, (items) => {
        setVerificationRequests((current) => (items.length > 0 ? items : current));
      }),
      subscribeToBookings(sessionUserId, effectiveUser.role, (items) => {
        setBookings((current) => (items.length > 0 ? items : current));
      }),
      subscribeToTickets(sessionUserId, (items) => {
        setTickets((current) => (items.length > 0 ? items : current));
      }),
      subscribeToPayments(sessionUserId, effectiveUser.role, (items) => {
        setPayments((current) => (items.length > 0 ? items : current));
      }),
      subscribeToFavorites(sessionUserId, (items) => {
        setFavorites((current) => (items.length > 0 ? items : current));
      }),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [effectiveUser, sessionUserId]);

  useEffect(() => {
    saveStoredLineId(selectedLineId);
  }, [selectedLineId]);

  useEffect(() => {
    saveStoredLocationEnabled(locationEnabled);
  }, [locationEnabled]);

  const persistedUsers = useMemo(() => {
    const unique = new Map<string, UserAccount>();
    for (const user of localCache.users) {
      unique.set(user.id, user);
    }
    for (const user of adminUsers) {
      unique.set(user.id, user);
    }
    if (selfUser) {
      unique.set(selfUser.id, selfUser);
    }
    if (fallbackUser) {
      unique.set(fallbackUser.id, fallbackUser);
    }
    return Array.from(unique.values());
  }, [adminUsers, fallbackUser, localCache.users, selfUser]);

  function buildLocalStateSnapshot(): AppState {
    return {
      ...createEmptyState(),
      users: persistedUsers,
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
      locale: effectiveUser?.locale ?? localCache.locale ?? 'fr-TN',
    };
  }

  function applyLocalState(nextState: AppState) {
    setSessionUserId(nextState.sessionUserId);
    setVerificationRequests(nextState.verificationRequests);
    setLines(nextState.lines);
    setLiveVehicles(nextState.liveVehicles);
    setLouageRides(nextState.louageRides);
    setBookings(nextState.bookings);
    setTickets(nextState.tickets);
    setPayments(nextState.payments);
    setFavorites(nextState.favorites);
    setNearbyTransport(nextState.nearbyTransport);
    setSelectedLineId(nextState.selectedLineId);
    setLocationEnabled(nextState.locationEnabled);

    const currentUserId = nextState.sessionUserId ?? effectiveUser?.id ?? null;
    if (currentUserId) {
      const nextCurrentUser = nextState.users.find((user) => user.id === currentUserId) ?? null;
      if (nextCurrentUser) {
        if (selfUser?.id === currentUserId) {
          setSelfUser(nextCurrentUser);
        } else {
          setFallbackUser(nextCurrentUser);
        }
      }
      setAdminUsers(nextState.users.filter((user) => user.id !== currentUserId));
      return;
    }

    setAdminUsers(nextState.users);
  }

  useEffect(() => {
    const nextState = buildLocalStateSnapshot();
    const persistedAt = saveLocalCache(nextState);
    localUpdatedAtRef.current = persistedAt;

    if (!sessionUserId) {
      return;
    }

    if (syncDebounceRef.current) {
      clearTimeout(syncDebounceRef.current);
    }

    syncDebounceRef.current = setTimeout(() => {
      void pushLocalStateToCloud({
        uid: sessionUserId,
        state: nextState,
        localUpdatedAt: localUpdatedAtRef.current,
      });
    }, 250);

    return () => {
      if (syncDebounceRef.current) {
        clearTimeout(syncDebounceRef.current);
      }
    };
  }, [
    persistedUsers,
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
    effectiveUser?.locale,
  ]);

  useEffect(() => {
    if (!sessionUserId || !effectiveUser) {
      return;
    }

    void backupUserProfileToCloud(sessionUserId, effectiveUser);
  }, [effectiveUser, sessionUserId]);

  useEffect(() => {
    if (!sessionUserId) {
      initialSyncUserIdRef.current = null;
      return;
    }

    if (initialSyncUserIdRef.current === sessionUserId) {
      return;
    }

    initialSyncUserIdRef.current = sessionUserId;
    let cancelled = false;

    const runInitialSync = async () => {
      const cloud = await pullCloudState(sessionUserId);
      if (cancelled) {
        return;
      }

      const merged = mergeByLatestUpdatedAt({
        localState: buildLocalStateSnapshot(),
        localUpdatedAt: localUpdatedAtRef.current,
        cloudState: cloud.state,
        cloudUpdatedAt: cloud.updatedAt,
      });

      if (merged.source === 'cloud') {
        applyLocalState(merged.state);
        localUpdatedAtRef.current = saveLocalCache(merged.state);
        return;
      }

      await pushLocalStateToCloud({
        uid: sessionUserId,
        state: merged.state,
        localUpdatedAt: localUpdatedAtRef.current,
      });
    };

    void runInitialSync();

    return () => {
      cancelled = true;
    };
  }, [sessionUserId]);

  const users = useMemo(() => {
    if (!effectiveUser) {
      return [];
    }

    if (effectiveUser.role !== 'admin') {
      return [effectiveUser];
    }

    const unique = new Map<string, UserAccount>();
    for (const user of [effectiveUser, ...adminUsers]) {
      unique.set(user.id, user);
    }

    return Array.from(unique.values());
  }, [adminUsers, effectiveUser]);

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
      locale: effectiveUser?.locale ?? 'fr-TN',
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
      effectiveUser?.locale,
      sessionUserId,
      tickets,
      users,
      verificationRequests,
    ],
  );

  const value: VoltaContextValue = {
    state,
    currentUser: effectiveUser,
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

      if (result.profile) {
        setFallbackUser(result.profile);
      }

      const profile = result.profile ?? (result.userId ? await fetchUserProfileOnce(result.userId) : null);
      if (!profile) {
        await logoutFromFirebase();
        setFallbackUser(null);
        return {
          ok: false,
          message: 'Connexion reussie, mais le profil utilisateur est introuvable. Reessayez dans quelques secondes.',
        };
      }

      const role = profile?.role;
      return {
        ok: true,
        nextScreen:
          role === 'driver' ? 'driver-dashboard' : role === 'admin' ? 'admin-review' : 'explore',
      };
    },
    async loginWithGoogle() {
      const result = await loginWithGoogleFirebase();
      if (!result.ok) {
        return result;
      }

      if ('profile' in result && result.profile) {
        setFallbackUser(result.profile);
      }

      const profile =
        'profile' in result && result.profile
          ? result.profile
          : 'userId' in result && result.userId
            ? await fetchUserProfileOnce(result.userId)
            : null;

      if (!profile) {
        return {
          ok: true,
          message: result.message,
        };
      }

      const role = profile.role;
      return {
        ok: true,
        message: result.message,
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

      if (result.profile) {
        setFallbackUser(result.profile);
      }

      return {
        ok: true,
        nextScreen: input.role === 'driver' ? 'driver-verification' : 'explore',
      };
    },
    logoutSession() {
      setCheckout(null);
      setFallbackUser(null);
      void logoutFromFirebase();
    },
    resetDemo() {
      const resetState = {
        ...createInitialState(),
        sessionUserId: null,
      };
      setCheckout(null);
      setSelfUser(null);
      setFallbackUser(null);
      applyLocalState(resetState);
      clearLocalStorageSettings();
      void logoutFromFirebase();
    },
    async submitVerification(input) {
      if (!effectiveUser) {
        return { ok: false, message: 'Connexion requise.' };
      }

      const validationError = validateDriverVerificationInput(input);
      if (validationError) {
        return { ok: false, message: validationError };
      }

      try {
        await submitVerificationRequest(effectiveUser.id, input);
        return { ok: true, message: 'Dossier envoye a l equipe de verification.' };
      } catch (error) {
        const localResult = submitDriverVerificationLocal(buildLocalStateSnapshot(), effectiveUser.id, input);
        if ('error' in localResult) {
          return {
            ok: false,
            message: error instanceof Error ? error.message : localResult.error,
          };
        }

        applyLocalState(localResult.state as AppState);
        return { ok: true, message: 'Dossier enregistre localement.' };
      }
    },
    async reviewDriverRequest(requestId, decision, rejectionReason) {
      if (!effectiveUser) {
        return { ok: false, message: 'Connexion admin requise.' };
      }

      try {
        await reviewVerificationRequest(requestId, decision, rejectionReason);
        return {
          ok: true,
          message: `Dossier ${decision === 'approved' ? 'approuve' : 'rejete'}.`,
        };
      } catch (error) {
        const localResult = reviewVerification(
          buildLocalStateSnapshot(),
          requestId,
          effectiveUser.id,
          decision,
          rejectionReason,
        );
        if ('error' in localResult) {
          return {
            ok: false,
            message: error instanceof Error ? error.message : localResult.error,
          };
        }

        applyLocalState(localResult.state as AppState);
        return {
          ok: true,
          message: `Dossier ${decision === 'approved' ? 'approuve' : 'rejete'} localement.`,
        };
      }
    },
    setLine(lineId) {
      setSelectedLineId(lineId);
    },
    setAppLocale(locale) {
      if (!effectiveUser) {
        return;
      }

      applyLocalState(setLocalLocale(buildLocalStateSnapshot(), locale) as AppState);
      void updateLocalePreference(locale).catch(() => undefined);
    },
    toggleNearbyLocation() {
      applyLocalState(toggleLocationLocal(buildLocalStateSnapshot()) as AppState);
    },
    async toggleLiveSharing(enabled, location) {
      if (!effectiveUser) {
        return { ok: false, message: 'Connexion requise.' };
      }

      try {
        await toggleLiveSharingRemote(enabled, location);
        return { ok: true, message: 'Statut live mis a jour.' };
      } catch (error) {
        const localResult = toggleDriverLiveSharingLocal(buildLocalStateSnapshot(), effectiveUser.id, enabled);
        if ('error' in localResult) {
          return {
            ok: false,
            message: error instanceof Error ? error.message : localResult.error,
          };
        }

        applyLocalState(localResult.state as AppState);
        return { ok: true, message: 'Statut live mis a jour localement.' };
      }
    },
    async createDriverRide(input) {
      if (!effectiveUser) {
        return { ok: false, message: 'Connexion requise.' };
      }

      const validationError = validateCreateRideInput(input);
      if (validationError) {
        return { ok: false, message: validationError };
      }

      try {
        await createRideListing(effectiveUser.id, input);
        return { ok: true, message: 'Annonce louage publiee.' };
      } catch (error) {
        const localResult = createRideLocal(buildLocalStateSnapshot(), effectiveUser.id, input);
        if ('error' in localResult) {
          return {
            ok: false,
            message: error instanceof Error ? error.message : localResult.error,
          };
        }

        applyLocalState(localResult.state as AppState);
        return { ok: true, message: 'Annonce louage publiee localement.' };
      }
    },
    async startLinePayment(lineId) {
      if (!effectiveUser) {
        return { ok: false, message: 'Connexion requise pour acheter un ticket.' };
      }

      try {
        const nextCheckout = await createCheckoutForLine(lineId);
        setCheckout(nextCheckout);
        return { ok: true };
      } catch (error) {
        const localCheckout = createLineCheckout(buildLocalStateSnapshot(), effectiveUser.id, lineId);
        if (localCheckout) {
          setCheckout(localCheckout);
          return { ok: true, message: 'Paiement prepare depuis le stockage local.' };
        }

        return {
          ok: false,
          message: error instanceof Error ? error.message : 'Ligne introuvable.',
        };
      }
    },
    async startLouagePayment(rideId) {
      if (!effectiveUser) {
        return { ok: false, message: 'Connexion requise pour reserver.' };
      }

      try {
        const nextCheckout = await createCheckoutForRide(rideId);
        setCheckout(nextCheckout);
        return { ok: true };
      } catch (error) {
        const localCheckout = createRideCheckout(buildLocalStateSnapshot(), effectiveUser.id, rideId);
        if (localCheckout) {
          setCheckout(localCheckout);
          return { ok: true, message: 'Reservation preparee depuis le stockage local.' };
        }

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
        const result = await confirmCheckout(checkout, provider);
        setCheckout(null);
        return {
          ok: true,
          message: result.message,
          paymentStatus: result.paymentStatus,
        };
      } catch (error) {
        const localResult = confirmPaymentLocal(buildLocalStateSnapshot(), checkout, provider);
        if ('error' in localResult) {
          return {
            ok: false,
            message: error instanceof Error ? error.message : localResult.error,
          };
        }

        applyLocalState(localResult.state as AppState);
        setCheckout(null);
        return {
          ok: true,
          message: 'Paiement confirme depuis le stockage local.',
          paymentStatus: 'paid',
        };
      }
    },
    async cancelBooking(bookingId) {
      if (!effectiveUser) {
        return { ok: false, message: 'Connexion requise.' };
      }

      try {
        await cancelPassengerBookingRemote(bookingId);
        return { ok: true, message: 'Reservation mise a jour.' };
      } catch (error) {
        const localResult = cancelPassengerBookingLocal(buildLocalStateSnapshot(), bookingId, effectiveUser.id);
        if ('error' in localResult) {
          return {
            ok: false,
            message: error instanceof Error ? error.message : localResult.error,
          };
        }

        applyLocalState(localResult.state as AppState);
        return { ok: true, message: 'Reservation mise a jour localement.' };
      }
    },
    async cancelRide(rideId) {
      if (!effectiveUser) {
        return { ok: false, message: 'Connexion requise.' };
      }

      try {
        await cancelDriverRideRemote(rideId);
        return { ok: true, message: 'Annonce annulee et remboursements appliques.' };
      } catch (error) {
        const localResult = cancelDriverRideLocal(buildLocalStateSnapshot(), rideId, effectiveUser.id);
        if ('error' in localResult) {
          return {
            ok: false,
            message: error instanceof Error ? error.message : localResult.error,
          };
        }

        applyLocalState(localResult.state as AppState);
        return { ok: true, message: 'Annonce annulee localement.' };
      }
    },
    async markBookingAwaitingConfirmation(bookingId) {
      if (!effectiveUser) {
        return { ok: false, message: 'Connexion requise.' };
      }

      try {
        await markBookingAwaitingConfirmationRemote(bookingId);
        return { ok: true, message: 'Reservation en attente de confirmation passager.' };
      } catch (error) {
        const localResult = markRideAwaitingConfirmationLocal(
          buildLocalStateSnapshot(),
          bookingId,
          effectiveUser.id,
        );
        if ('error' in localResult) {
          return {
            ok: false,
            message: error instanceof Error ? error.message : localResult.error,
          };
        }

        applyLocalState(localResult.state as AppState);
        return { ok: true, message: 'Reservation mise en attente localement.' };
      }
    },
    async confirmBookingCompletion(bookingId) {
      if (!effectiveUser) {
        return { ok: false, message: 'Connexion requise.' };
      }

      try {
        await confirmRideCompletionRemote(bookingId);
        return { ok: true, message: 'Trajet confirme.' };
      } catch (error) {
        const localResult = confirmRideCompletionLocal(
          buildLocalStateSnapshot(),
          bookingId,
          effectiveUser.id,
        );
        if ('error' in localResult) {
          return {
            ok: false,
            message: error instanceof Error ? error.message : localResult.error,
          };
        }

        applyLocalState(localResult.state as AppState);
        return { ok: true, message: 'Trajet confirme localement.' };
      }
    },
    async reportBookingNoShow(bookingId) {
      if (!effectiveUser) {
        return { ok: false, message: 'Connexion requise.' };
      }

      try {
        await reportNoShowRemote(bookingId);
        return { ok: true, message: 'Absence signalee avec statut de preuve mis a jour.' };
      } catch (error) {
        const localResult = reportNoShowLocal(buildLocalStateSnapshot(), bookingId, effectiveUser.id);
        if ('error' in localResult) {
          return {
            ok: false,
            message: error instanceof Error ? error.message : localResult.error,
          };
        }

        applyLocalState(localResult.state as AppState);
        return { ok: true, message: 'Absence signalee localement.' };
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
