import { Capacitor, registerPlugin } from '@capacitor/core';

export interface NativeGoogleAuthSignInOptions {
  webClientId: string;
  forcePrompt?: boolean;
}

export interface NativeGoogleAuthSignInResult {
  idToken: string;
  email?: string;
  displayName?: string;
  familyName?: string;
  givenName?: string;
  photoUrl?: string;
}

export interface NativeGoogleAuthPlugin {
  signIn(options: NativeGoogleAuthSignInOptions): Promise<NativeGoogleAuthSignInResult>;
  signOut(): Promise<void>;
}

export const NativeGoogleAuth = registerPlugin<NativeGoogleAuthPlugin>('NativeGoogleAuth', {
  web: async () => ({
    async signIn() {
      throw new Error('Native Google Auth is only available in Android or iOS native builds.');
    },
    async signOut() {
      return;
    },
  }),
});

export function canUseNativeGoogleAuth() {
  return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('NativeGoogleAuth');
}
