// app.config.js
const BUNDLE_ID = 'com.ryan.fifteen';
const TEAM_ID   = 'YW69L3H994';
const APP_GROUP = `group.${BUNDLE_ID}`;

export default {
  expo: {
    name: 'Ember',
    slug: 'fifteen',
    scheme: 'fifteen',
    version: '1.0.0',
    platforms: ['ios'],
    ios: {
      bundleIdentifier: BUNDLE_ID,
      buildNumber: '15',
      deploymentTarget: '16.2',   // bumped from 16.0 — Live Activities need 16.2
      appleTeamId: TEAM_ID,
      icon: './assets/images/ember.jpeg',
      infoPlist: {
        NSFamilyControlsUsageDescription:
          'Ember uses Screen Time to block distracting apps during your focus sessions.',
        CFBundleURLTypes: [{ CFBundleURLSchemes: ['fifteen'] }],
        CFBundleURLName: BUNDLE_ID,
        ITSAppUsesNonExemptEncryption: false,
        // Added by withLiveActivity plugin — listed here for visibility only
        // NSSupportsLiveActivities: true,
      },
      entitlements: {
        'com.apple.developer.family-controls': true,
        'com.apple.security.application-groups': [APP_GROUP],
        // Added by withLiveActivity plugin — listed here for visibility only
        // 'com.apple.developer.live-activity': true,
      },
    },

    plugins: [
      ['expo-build-properties', {}],

      // ── Screen Time (unchanged) ──────────────────────────────────────────
      [
        'react-native-device-activity',
        {
          appleTeamId: TEAM_ID,
          appGroup:    APP_GROUP,
        },
      ],

      // ── Live Activities ──────────────────────────────────────────────────
      // Plugin lives at plugins/withLiveActivity.js
      // Swift source files live at plugins/live-activity-swift/*.swift
      [
        './plugins/withLiveActivity',
        {
          appleTeamId: TEAM_ID,
          appGroup:    APP_GROUP,
        },
      ],
    ],

    extra: {
      eas: {
        projectId: '4f8eb1c1-4947-4a21-9cbf-7118c8cd3c00',
      },
    },
  },
};
