import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Mobile IDE',
  slug: 'mobile-ide',
  version: '1.0.0',
  orientation: 'default',
  icon: './src/assets/icon.png',
  userInterfaceStyle: 'dark',
  splash: {
    image: './src/assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#1a1a2e',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.mobileide.app',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './src/assets/adaptive-icon.png',
      backgroundColor: '#1a1a2e',
    },
    package: 'com.mobileide.app',
    permissions: [
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'MANAGE_EXTERNAL_STORAGE',
    ],
  },
  web: {
    favicon: './src/assets/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    'expo-file-system',
    [
      'expo-document-picker',
      {
        iCloudContainerEnvironment: 'Production',
      },
    ],
  ],
  scheme: 'mobileide',
};

export default config;
