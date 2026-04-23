import { Capacitor } from '@capacitor/core';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

const env = import.meta.env;
const demoFirebaseConfig = {
  apiKey: 'volta-demo-api-key',
  authDomain: 'demo-volta-local.firebaseapp.com',
  projectId: 'demo-volta-local',
  storageBucket: 'demo-volta-local.appspot.com',
  messagingSenderId: '1234567890',
  appId: '1:1234567890:web:demo-volta-local',
};

function isNativeCapacitorRuntime() {
  if (Capacitor.isNativePlatform()) {
    return true;
  }

  const platform = Capacitor.getPlatform();
  return platform === 'android' || platform === 'ios';
}

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
    !isNativeCapacitorRuntime() &&
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname));

const firebaseConfig = shouldUseEmulators
  ? demoFirebaseConfig
  : {
      apiKey: env.VITE_FIREBASE_API_KEY ?? demoFirebaseConfig.apiKey,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? demoFirebaseConfig.authDomain,
      projectId: env.VITE_FIREBASE_PROJECT_ID ?? demoFirebaseConfig.projectId,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET ?? demoFirebaseConfig.storageBucket,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? demoFirebaseConfig.messagingSenderId,
      appId: env.VITE_FIREBASE_APP_ID ?? demoFirebaseConfig.appId,
    };

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');
const functionsPreference = env.VITE_FIREBASE_USE_FUNCTIONS;
export const firebaseRuntimeMode = {
  shouldUseEmulators,
  emulatorHost: shouldUseEmulators ? resolveEmulatorHost() : null,
  isNativeRuntime: isNativeCapacitorRuntime(),
  functionsEnabled: functionsPreference !== 'false',
};

const usingDemoFirebaseConfig = Object.entries(demoFirebaseConfig).every(
  ([key, value]) => firebaseConfig[key as keyof typeof firebaseConfig] === value,
);

export const firebaseSetupIssue =
  !shouldUseEmulators && usingDemoFirebaseConfig
    ? 'Firebase n est pas configure pour cette build. Ajoutez vos variables VITE_FIREBASE_* dans .env.local, ou activez explicitement les emulateurs avec VITE_USE_FIREBASE_EMULATORS=true.'
    : null;

if (shouldUseEmulators && !(globalThis as { __voltaFirebaseEmulatorsConnected?: boolean }).__voltaFirebaseEmulatorsConnected) {
  const emulatorHost = firebaseRuntimeMode.emulatorHost ?? resolveEmulatorHost();

  connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, emulatorHost, 8080);
  connectFunctionsEmulator(functions, emulatorHost, 5001);
  connectStorageEmulator(storage, emulatorHost, 9199);
  (globalThis as { __voltaFirebaseEmulatorsConnected?: boolean }).__voltaFirebaseEmulatorsConnected = true;
}
