import assert from 'node:assert/strict';
import test from 'node:test';
import searchTransportModule from '../functions/src/lib/searchTransport.ts';
import { createInitialState } from '../src/constants';
import {
  createLineCheckout,
  createRide,
  createRideCheckout,
  confirmPayment,
  login,
  loadState,
  reviewVerification,
  signup,
  cancelPassengerBooking,
} from '../src/services/voltaService';
import { resolveHashRoute } from '../src/services/routingService';

const { buildTransportSearchResults } = searchTransportModule;

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear() {
    this.store.clear();
  }

  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
}

function installWindow() {
  const localStorage = new MemoryStorage();
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage },
  });
  return localStorage;
}

test('login with valid credentials returns the passenger session', async () => {
  installWindow();
  const result = await login(createInitialState(), {
    email: 'imen@volta.tn',
    password: 'volta123',
  });

  assert.ok('state' in result);
  assert.equal(result.user.id, 'passenger-1');
  assert.equal(result.state.sessionUserId, 'passenger-1');
});

test('login rejects invalid password with a human-readable error', async () => {
  installWindow();
  const result = await login(createInitialState(), {
    email: 'imen@volta.tn',
    password: 'wrong-password',
  });

  assert.deepEqual(result, { error: 'Mot de passe incorrect.' });
});

test('login rejects an unknown account cleanly', async () => {
  installWindow();
  const result = await login(createInitialState(), {
    email: 'nobody@volta.tn',
    password: 'volta123',
  });

  assert.deepEqual(result, { error: 'Aucun compte correspondant a cet email.' });
});

test('signup prevents duplicate email registration', async () => {
  installWindow();
  const result = await signup(createInitialState(), {
    role: 'passenger',
    fullName: 'Imen Bis',
    email: 'imen@volta.tn',
    phone: '',
    password: 'volta123',
    city: 'Tunis',
  });

  assert.deepEqual(result, { error: 'Un compte existe deja avec cet email.' });
});

test('signup persists a new account and starts a session', async () => {
  installWindow();
  const result = await signup(createInitialState(), {
    role: 'passenger',
    fullName: 'Nadia Test',
    email: 'nadia@volta.tn',
    phone: '+21622333444',
    password: 'motdepasse123',
    city: 'Tunis',
  });

  assert.ok('state' in result);
  assert.equal(result.user.email, 'nadia@volta.tn');
  assert.equal(result.state.sessionUserId, result.user.id);
});

test('loadState falls back to a valid state when storage is corrupted', () => {
  const localStorage = installWindow();
  localStorage.setItem('volta-app-state-v2', '{"users":"oops"}');

  const state = loadState();

  assert.equal(state.users.length, createInitialState().users.length);
  assert.equal(state.selectedLineId, createInitialState().selectedLineId);
});

test('non-admin users cannot review driver verification requests', () => {
  installWindow();
  const state = createInitialState();
  const result = reviewVerification(state, 'verif-1', 'passenger-1', 'approved');

  assert.deepEqual(result, { error: 'Seul un administrateur peut valider un dossier.' });
});

test('passengers can only cancel their own louage booking', () => {
  installWindow();
  const baseState = createInitialState();
  const checkout = createRideCheckout(baseState, 'passenger-1', 'ride-1');
  assert.ok(checkout);
  const payment = confirmPayment(baseState, checkout, 'bank_card');
  assert.ok('state' in payment);

  const result = cancelPassengerBooking(payment.state, payment.bookingId, 'driver-1');

  assert.deepEqual(result, { error: 'Reservation louage introuvable.' });
});

test('duplicate ride creation is blocked at the service layer', () => {
  installWindow();
  const initialState = createInitialState();
  const firstRide = createRide(initialState, 'driver-1', {
    departureCity: 'Gabes',
    destinationCity: 'Sfax',
    departureAt: '2030-04-18T14:30:00.000Z',
    availableSeats: 4,
    priceTnd: 18,
    vehicleModel: 'Toyota Hiace',
    plateNumber: '226 TUN 194',
    vehiclePhotoName: '',
  });
  assert.ok('state' in firstRide);

  const result = createRide(firstRide.state, 'driver-1', {
    departureCity: 'Gabes',
    destinationCity: 'Sfax',
    departureAt: '2030-04-18T14:30:00.000Z',
    availableSeats: 4,
    priceTnd: 18,
    vehicleModel: 'Toyota Hiace',
    plateNumber: '226 TUN 194',
    vehiclePhotoName: '',
  });

  assert.deepEqual(result, { error: 'Une annonce identique existe deja pour ce depart.' });
});

test('routing sends logged-out users to welcome with redirectAfterLogin', () => {
  const result = resolveHashRoute('#/create-trip', null);

  assert.equal(result.screen, 'welcome');
  assert.equal(result.canonicalHash, '#/welcome?redirectAfterLogin=create-trip');
});

test('routing restores redirectAfterLogin for an authorized role', () => {
  const result = resolveHashRoute('#/welcome?redirectAfterLogin=create-trip', 'driver');

  assert.equal(result.screen, 'create-trip');
  assert.equal(result.canonicalHash, '#/create-trip');
});

test('routing returns a friendly not-found state for unknown hashes', () => {
  const result = resolveHashRoute('#/unknown-screen', 'passenger');

  assert.equal(result.screen, 'not-found');
  assert.equal(result.canonicalHash, '#/not-found');
});

test('line checkout only succeeds for existing users and lines', () => {
  installWindow();
  const checkout = createLineCheckout(createInitialState(), 'passenger-1', 'metro-m4');

  assert.ok(checkout);
  assert.equal(checkout.mode, 'metro');
});

function getSearchFixtures() {
  const state = createInitialState();
  const lines = state.lines.map((line) => ({
    id: line.id,
    mode: line.mode,
    code: line.code,
    name: line.name,
    origin: line.origin,
    destination: line.destination,
    durationMinutes: line.durationMinutes,
    intervalMinutes: line.intervalMinutes,
    routeLabel: line.routeLabel,
    fareTnd: line.fareTnd,
    operatorName: line.operatorName,
    servicePattern: line.servicePattern,
    stops: line.stops.map((stop) => ({
      name: stop.name,
    })),
  }));
  const rides = state.louageRides.map((ride) => ({
    id: ride.id,
    departureCity: ride.departureCity,
    destinationCity: ride.destinationCity,
    departureAt: ride.departureAt,
    availableSeats: ride.availableSeats,
    priceTnd: ride.priceTnd,
    vehicleModel: ride.vehicleModel,
    status: ride.status,
  }));

  return {
    lines,
    rides,
    state,
  };
}

test('transport search waits for a real matching route instead of inventing a fallback', () => {
  const { lines, rides } = getSearchFixtures();
  const results = buildTransportSearchResults({
    lines,
    rides,
    filters: {
      departure: 'Bizerte',
      destination: 'Kairouan',
      date: '2030-04-18',
      sortBy: 'cheapest',
    },
  });

  assert.deepEqual(results, []);
});

test('transport search finds deterministic direct results for a valid city pair', () => {
  const { lines, rides, state } = getSearchFixtures();
  const requestedDate = state.louageRides.find((ride) => ride.id === 'ride-1')!.departureAt.slice(0, 10);

  const firstRun = buildTransportSearchResults({
    lines,
    rides,
    filters: {
      departure: 'Tunis',
      destination: 'Sousse',
      date: requestedDate,
      sortBy: 'cheapest',
    },
  });
  const secondRun = buildTransportSearchResults({
    lines,
    rides,
    filters: {
      departure: 'Tunis',
      destination: 'Sousse',
      date: requestedDate,
      sortBy: 'cheapest',
    },
  });

  assert.deepEqual(firstRun, secondRun);
  assert.ok(firstRun.some((result) => result.sourceId === 'ride-1'));
  assert.ok(firstRun.every((result) => result.departure !== result.destination));
  assert.ok(firstRun.every((result) => !['Mannouba', 'Bizerte', 'Gabes'].includes(result.destination)));
});

test('transport search can match a metro segment by ordered stops', () => {
  const { lines, rides } = getSearchFixtures();
  const results = buildTransportSearchResults({
    lines,
    rides,
    filters: {
      departure: 'Place Barcelone Sud',
      destination: 'Ben Arous',
      date: '2030-04-18',
      sortBy: 'departure',
    },
  });

  assert.ok(results.length > 0);
  assert.ok(
    results.some(
      (result) =>
        result.mode === 'metro' &&
        result.matchType === 'direct' &&
        result.departure === 'Place Barcelone Sud' &&
        result.destination === 'Ben Arous',
    ),
  );
});

test('transport search can match a regional bus corridor by ordered stops', () => {
  const { lines, rides } = getSearchFixtures();
  const results = buildTransportSearchResults({
    lines,
    rides,
    filters: {
      departure: 'Beja',
      destination: 'Le Kef',
      date: '2030-04-18',
      sortBy: 'duration',
    },
  });

  assert.ok(
    results.some(
      (result) =>
        result.mode === 'bus' &&
        result.sourceId === 'bus-northwest-link' &&
        result.matchType === 'direct',
    ),
  );
});

test('transport search can resolve Cap Bon to a matching louage route', () => {
  const { lines, rides, state } = getSearchFixtures();
  const requestedDate = state.louageRides.find((ride) => ride.id === 'ride-7')!.departureAt.slice(0, 10);

  const results = buildTransportSearchResults({
    lines,
    rides,
    filters: {
      departure: 'Cap Bon',
      destination: 'Tunis',
      date: requestedDate,
      sortBy: 'cheapest',
    },
  });

  assert.ok(
    results.some(
      (result) =>
        result.mode === 'louage' &&
        result.sourceId === 'ride-7' &&
        result.matchType === 'departure_area',
    ),
  );
});

test('transport search can resolve Sud to a matching south route', () => {
  const { lines, rides, state } = getSearchFixtures();
  const requestedDate = state.louageRides.find((ride) => ride.id === 'ride-8')!.departureAt.slice(0, 10);

  const results = buildTransportSearchResults({
    lines,
    rides,
    filters: {
      departure: 'Sud',
      destination: 'Sfax',
      date: requestedDate,
      sortBy: 'cheapest',
    },
  });

  assert.ok(
    results.some(
      (result) =>
        result.mode === 'louage' &&
        result.sourceId === 'ride-8' &&
        result.matchType === 'departure_area',
    ),
  );
});

test('transport search rejects same departure and destination', () => {
  const { lines, rides } = getSearchFixtures();
  const results = buildTransportSearchResults({
    lines,
    rides,
    filters: {
      departure: 'Tunis',
      destination: 'Tunis',
      date: '2030-04-18',
      sortBy: 'duration',
    },
  });

  assert.deepEqual(results, []);
});
