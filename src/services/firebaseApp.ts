import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY ?? 'volta-demo-api-key',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? 'demo-volta-local.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID ?? 'demo-volta-local',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET ?? 'demo-volta-local.appspot.com',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '1234567890',
  appId: env.VITE_FIREBASE_APP_ID ?? '1:1234567890:web:demo-volta-local',
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');

function resolveEmulatorHost() {
  if (env.VITE_FIREBASE_EMULATOR_HOST) {
    return env.VITE_FIREBASE_EMULATOR_HOST;
  }

  if (typeof window !== 'undefined' && /Android/i.test(window.navigator.userAgent)) {
    return '10.0.2.2';
  }

  return '127.0.0.1';
}

const shouldUseEmulators =
  env.VITE_USE_FIREBASE_EMULATORS === 'true' ||
  (env.VITE_USE_FIREBASE_EMULATORS !== 'false' &&
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname));

if (shouldUseEmulators && !(globalThis as { __voltaFirebaseEmulatorsConnected?: boolean }).__voltaFirebaseEmulatorsConnected) {
  const emulatorHost = resolveEmulatorHost();

  connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, emulatorHost, 8080);
  connectFunctionsEmulator(functions, emulatorHost, 5001);
  connectStorageEmulator(storage, emulatorHost, 9199);
  (globalThis as { __voltaFirebaseEmulatorsConnected?: boolean }).__voltaFirebaseEmulatorsConnected = true;
}
