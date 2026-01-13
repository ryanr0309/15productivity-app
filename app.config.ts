import 'dotenv/config';

export default {
  expo: {
    owner: 'productivity-15',
    name: 'Fifteen',
    slug: 'fifteen',
    version: '1.0.0',
    newArchEnabled: true,

    scheme: 'fifteen', // required for google + apple callback

    orientation: 'portrait',
    userInterfaceStyle: 'light',

    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },

    ios: {
      bundleIdentifier: 'com.ryan.fifteen',   // MUST match Google Cloud iOS OAuth bundle
      usesAppleSignIn: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },

    android: {
      package: 'com.ryan.fifteen',
      edgeToEdgeEnabled: true,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
    },

    web: {
      favicon: './assets/favicon.png',
    },

    extra: {
      EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,

      eas: {
        projectId: '4f8eb1c1-4947-4a21-9cbf-7118c8cd3c00',
      },
    },

    plugins: [
      'expo-router',
      'expo-font',
      'expo-web-browser',
      'expo-apple-authentication',
    ],
  },
};
