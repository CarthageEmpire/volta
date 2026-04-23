import { createInitialState } from '../constants';
import { AppState } from '../types';

export const SELECTED_LINE_STORAGE_KEY = 'volta-selected-line-id';
export const LOCATION_STORAGE_KEY = 'volta-location-enabled';
export const LOCAL_CACHE_KEY = 'volta-local-cache-v1';

interface LocalCacheEnvelope {
  createdAt: number;
  updatedAt: number;
  state: AppState;
}

function hasWindow() {
  return typeof window !== 'undefined';
}

function sanitizeStateForStorage(state: AppState): AppState {
  return {
    ...state,
    verificationRequests: state.verificationRequests.map((request) => ({
      ...request,
      documents: request.documents.map(({ file: _file, ...document }) => document),
    })),
  };
}

export function loadStoredLineId() {
  if (!hasWindow()) {
    return 'metro-m1';
  }

  return window.localStorage.getItem(SELECTED_LINE_STORAGE_KEY) ?? 'metro-m1';
}

export function loadStoredLocationEnabled() {
  if (!hasWindow()) {
    return true;
  }

  const value = window.localStorage.getItem(LOCATION_STORAGE_KEY);
  return value === null ? true : value === 'true';
}

export function loadLocalCache(): { state: AppState; updatedAt: number } {
  const initial = createInitialState();

  if (!hasWindow()) {
    return {
      state: {
        ...initial,
        selectedLineId: loadStoredLineId(),
        locationEnabled: loadStoredLocationEnabled(),
      },
      updatedAt: 0,
    };
  }

  const raw = window.localStorage.getItem(LOCAL_CACHE_KEY);
  if (!raw) {
    return {
      state: {
        ...initial,
        selectedLineId: loadStoredLineId(),
        locationEnabled: loadStoredLocationEnabled(),
      },
      updatedAt: 0,
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AppState> | Partial<LocalCacheEnvelope>;
    const parsedState = 'state' in parsed ? parsed.state : parsed;
    const updatedAt =
      'updatedAt' in parsed && typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0;

    return {
      state: {
        ...initial,
        users:
          Array.isArray(parsedState?.users) && parsedState.users.length > 0
            ? parsedState.users
            : initial.users,
        sessionUserId:
          typeof parsedState?.sessionUserId === 'string' ? parsedState.sessionUserId : null,
        verificationRequests: Array.isArray(parsedState?.verificationRequests)
          ? parsedState.verificationRequests
          : initial.verificationRequests,
        lines:
          Array.isArray(parsedState?.lines) && parsedState.lines.length > 0
            ? parsedState.lines
            : initial.lines,
        liveVehicles: Array.isArray(parsedState?.liveVehicles)
          ? parsedState.liveVehicles
          : initial.liveVehicles,
        louageRides:
          Array.isArray(parsedState?.louageRides) && parsedState.louageRides.length > 0
            ? parsedState.louageRides
            : initial.louageRides,
        bookings: Array.isArray(parsedState?.bookings) ? parsedState.bookings : initial.bookings,
        tickets: Array.isArray(parsedState?.tickets) ? parsedState.tickets : initial.tickets,
        payments: Array.isArray(parsedState?.payments) ? parsedState.payments : initial.payments,
        favorites: Array.isArray(parsedState?.favorites) ? parsedState.favorites : initial.favorites,
        nearbyTransport:
          Array.isArray(parsedState?.nearbyTransport) && parsedState.nearbyTransport.length > 0
            ? parsedState.nearbyTransport
            : initial.nearbyTransport,
        selectedLineId:
          typeof parsedState?.selectedLineId === 'string'
            ? parsedState.selectedLineId
            : loadStoredLineId(),
        locationEnabled:
          typeof parsedState?.locationEnabled === 'boolean'
            ? parsedState.locationEnabled
            : loadStoredLocationEnabled(),
        locale:
          parsedState?.locale === 'ar-TN' || parsedState?.locale === 'fr-TN'
            ? parsedState.locale
            : initial.locale,
      },
      updatedAt,
    };
  } catch {
    return {
      state: {
        ...initial,
        selectedLineId: loadStoredLineId(),
        locationEnabled: loadStoredLocationEnabled(),
      },
      updatedAt: 0,
    };
  }
}

export function saveLocalCache(state: AppState) {
  if (!hasWindow()) {
    return Date.now();
  }

  const now = Date.now();
  const payload: LocalCacheEnvelope = {
    createdAt: now,
    updatedAt: now,
    state: sanitizeStateForStorage(state),
  };

  try {
    window.localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore cache failures to keep the UI usable.
  }

  return now;
}

export function saveStoredLineId(lineId: string) {
  if (!hasWindow()) {
    return;
  }
  window.localStorage.setItem(SELECTED_LINE_STORAGE_KEY, lineId);
}

export function saveStoredLocationEnabled(enabled: boolean) {
  if (!hasWindow()) {
    return;
  }
  window.localStorage.setItem(LOCATION_STORAGE_KEY, String(enabled));
}

export function clearLocalStorageSettings() {
  if (!hasWindow()) {
    return;
  }
  window.localStorage.removeItem(SELECTED_LINE_STORAGE_KEY);
  window.localStorage.removeItem(LOCATION_STORAGE_KEY);
}
