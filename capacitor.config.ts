import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kineticsanctuary.app',
  appName: 'Volta',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
  },
};

export default config;
