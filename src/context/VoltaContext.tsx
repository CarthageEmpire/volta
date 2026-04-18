import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
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
} from '../types';
import {
  advanceLiveVehicles,
  cancelDriverRide,
  cancelPassengerBooking,
  confirmPayment,
  confirmRideCompletion,
  createLineCheckout,
  createRide,
  createRideCheckout,
  getCurrentUser,
  getSearchResults,
  loadState,
  login,
  logout,
  markRideAwaitingConfirmation,
  reportNoShow,
  resetState,
  reviewVerification,
  saveState,
  setLocale,
  setSelectedLine,
  signup,
  submitDriverVerification,
  toggleDriverLiveSharing,
  toggleLocation,
} from '../services/voltaService';

interface VoltaContextValue {
  state: AppState;
  currentUser: ReturnType<typeof getCurrentUser>;
  checkout: CheckoutIntent | null;
  setCheckout: (checkout: CheckoutIntent | null) => void;
  loginWithEmail: (input: LoginInput) => Promise<{ ok: boolean; message?: string; nextScreen?: Screen }>;
  signupAccount: (input: SignupInput) => Promise<{ ok: boolean; message?: string; nextScreen?: Screen }>;
  logoutSession: () => void;
  resetDemo: () => void;
  submitVerification: (input: DriverVerificationInput) => { ok: boolean; message?: string };
  reviewDriverRequest: (
    requestId: string,
    decision: 'approved' | 'rejected',
    rejectionReason?: string,
  ) => { ok: boolean; message?: string };
  setLine: (lineId: string) => void;
  setAppLocale: (locale: Locale) => void;
  toggleNearbyLocation: () => void;
  toggleLiveSharing: (enabled: boolean) => { ok: boolean; message?: string };
  createDriverRide: (input: CreateRideInput) => { ok: boolean; message?: string };
  startLinePayment: (lineId: string) => { ok: boolean; message?: string };
  startLouagePayment: (rideId: string) => { ok: boolean; message?: string };
  confirmCheckoutPayment: (provider: PaymentProvider) => { ok: boolean; message?: string };
  searchTransport: (filters: SearchFilters) => ReturnType<typeof getSearchResults>;
  cancelBooking: (bookingId: string) => { ok: boolean; message?: string };
  cancelRide: (rideId: string) => { ok: boolean; message?: string };
  markBookingAwaitingConfirmation: (bookingId: string) => void;
  confirmBookingCompletion: (bookingId: string) => void;
  reportBookingNoShow: (bookingId: string) => { ok: boolean; message?: string };
}

const VoltaContext = createContext<VoltaContextValue | undefined>(undefined);

export function VoltaProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());
  const [checkout, setCheckout] = useState<CheckoutIntent | null>(null);
  const advancedRef = useRef(false);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setState((current) => advanceLiveVehicles(current));
    }, 12000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (advancedRef.current) {
      return;
    }

    const demoState = loadState();
    if (
      demoState.bookings.length === 0 &&
      demoState.tickets.length === 0 &&
      demoState.payments.length === 0
    ) {
      const lineCheckout = createLineCheckout(demoState, 'passenger-1', 'metro-m4');
      if (lineCheckout) {
        const lineResult = confirmPayment(demoState, lineCheckout, 'bank_card');
        if ('state' in lineResult) {
          const louageCheckout = createRideCheckout(lineResult.state, 'passenger-1', 'ride-1');
          if (louageCheckout) {
            const louageResult = confirmPayment(lineResult.state, louageCheckout, 'konnect');
            if ('state' in louageResult) {
              const marked = markRideAwaitingConfirmation(
                louageResult.state,
                louageResult.bookingId,
                'driver-1',
              );
              setState('state' in marked ? marked.state : louageResult.state);
              advancedRef.current = true;
              return;
            }
          }
          setState(lineResult.state);
        }
      }
    }
    advancedRef.current = true;
  }, []);

  const currentUser = getCurrentUser(state);

  const value: VoltaContextValue = {
    state,
    currentUser,
    checkout,
    setCheckout,
    async loginWithEmail(input) {
      try {
        const result = await login(state, input);
        if (!result.state || !result.user) {
          return { ok: false, message: result.error };
        }
        setState(result.state);
        return {
          ok: true,
          nextScreen:
            result.user.role === 'driver'
              ? 'driver-dashboard'
              : result.user.role === 'admin'
                ? 'admin-review'
                : 'explore',
        };
      } catch {
        return { ok: false, message: 'Impossible de se connecter pour le moment.' };
      }
    },
    async signupAccount(input) {
      try {
        const result = await signup(state, input);
        if (!result.state || !result.user) {
          return { ok: false, message: result.error };
        }
        setState(result.state);
        return {
          ok: true,
          nextScreen: result.user.role === 'driver' ? 'driver-verification' : 'explore',
        };
      } catch {
        return { ok: false, message: 'Impossible de creer le compte pour le moment.' };
      }
    },
    logoutSession() {
      setCheckout(null);
      setState((current) => logout(current));
    },
    resetDemo() {
      setCheckout(null);
      setState(resetState());
    },
    submitVerification(input) {
      if (!currentUser) {
        return { ok: false, message: 'Connexion requise.' };
      }
      const result = submitDriverVerification(state, currentUser.id, input);
      if (!result.state) {
        return { ok: false, message: result.error };
      }
      setState(result.state);
      return { ok: true, message: 'Dossier envoye a l’equipe de verification.' };
    },
    reviewDriverRequest(requestId, decision, rejectionReason) {
      if (!currentUser) {
        return { ok: false, message: 'Connexion admin requise.' };
      }
      const result = reviewVerification(state, requestId, currentUser.id, decision, rejectionReason);
      if (!result.state) {
        return { ok: false, message: result.error };
      }
      setState(result.state);
      return { ok: true, message: `Dossier ${decision === 'approved' ? 'approuve' : 'rejete'}.` };
    },
    setLine(lineId) {
      setState((current) => setSelectedLine(current, lineId));
    },
    setAppLocale(locale) {
      setState((current) => setLocale(current, locale));
    },
    toggleNearbyLocation() {
      setState((current) => toggleLocation(current));
    },
    toggleLiveSharing(enabled) {
      if (!currentUser) {
        return { ok: false, message: 'Connexion requise.' };
      }
      const result = toggleDriverLiveSharing(state, currentUser.id, enabled);
      if (!result.state) {
        return { ok: false, message: result.error };
      }
      setState(result.state);
      return { ok: true };
    },
    createDriverRide(input) {
      if (!currentUser) {
        return { ok: false, message: 'Connexion requise.' };
      }
      const result = createRide(state, currentUser.id, input);
      if (!result.state) {
        return { ok: false, message: result.error };
      }
      setState(result.state);
      return { ok: true, message: 'Annonce louage publiee.' };
    },
    startLinePayment(lineId) {
      if (!currentUser) {
        return { ok: false, message: 'Connexion requise pour acheter un ticket.' };
      }
      const nextCheckout = createLineCheckout(state, currentUser.id, lineId);
      if (!nextCheckout) {
        return { ok: false, message: 'Ligne introuvable.' };
      }
      setCheckout(nextCheckout);
      return { ok: true };
    },
    startLouagePayment(rideId) {
      if (!currentUser) {
        return { ok: false, message: 'Connexion requise pour reserver.' };
      }
      const nextCheckout = createRideCheckout(state, currentUser.id, rideId);
      if (!nextCheckout) {
        return { ok: false, message: 'Trajet indisponible.' };
      }
      setCheckout(nextCheckout);
      return { ok: true };
    },
    confirmCheckoutPayment(provider) {
      if (!checkout) {
        return { ok: false, message: 'Aucune commande en cours.' };
      }
      const result = confirmPayment(state, checkout, provider);
      if (!('state' in result)) {
        return { ok: false, message: result.error };
      }
      setState(result.state);
      setCheckout(null);
      return { ok: true, message: 'Paiement confirme et ticket genere.' };
    },
    searchTransport(filters) {
      return getSearchResults(state, filters);
    },
    cancelBooking(bookingId) {
      if (!currentUser) {
        return { ok: false, message: 'Connexion requise.' };
      }
      const result = cancelPassengerBooking(state, bookingId, currentUser.id);
      if (!result.state) {
        return { ok: false, message: result.error };
      }
      setState(result.state);
      return { ok: true, message: 'Reservation mise a jour.' };
    },
    cancelRide(rideId) {
      if (!currentUser) {
        return { ok: false, message: 'Connexion requise.' };
      }
      const result = cancelDriverRide(state, rideId, currentUser.id);
      if (!result.state) {
        return { ok: false, message: result.error };
      }
      setState(result.state);
      return { ok: true, message: 'Annonce annulee et remboursements appliques.' };
    },
    markBookingAwaitingConfirmation(bookingId) {
      if (!currentUser) {
        return;
      }
      setState((current) => {
        const result = markRideAwaitingConfirmation(current, bookingId, currentUser.id);
        return 'state' in result ? result.state : current;
      });
    },
    confirmBookingCompletion(bookingId) {
      if (!currentUser) {
        return;
      }
      setState((current) => {
        const result = confirmRideCompletion(current, bookingId, currentUser.id);
        return 'state' in result ? result.state : current;
      });
    },
    reportBookingNoShow(bookingId) {
      if (!currentUser) {
        return { ok: false, message: 'Connexion requise.' };
      }
      const result = reportNoShow(state, bookingId, currentUser.id);
      if (!result.state) {
        return { ok: false, message: result.error };
      }
      setState(result.state);
      return { ok: true, message: 'Absence signalee avec statut de preuve mis a jour.' };
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
