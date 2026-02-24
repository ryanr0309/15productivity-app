// app.config.js
const BUNDLE_ID = 'com.ryan.fifteen';
const TEAM_ID   = 'YW69L3H994';
const APP_GROUP = `group.${BUNDLE_ID}`;

/* eslint-disable no-undef */

module.exports = {
  expo: {
    name: 'Ember',
    slug: 'fifteen',
    scheme: 'fifteen',
    version: '1.0.0',
    platforms: ['ios'],
    ios: {
      bundleIdentifier: BUNDLE_ID,
      buildNumber: '15',
      deploymentTarget: '16.2',
      appleTeamId: TEAM_ID,
      icon: './assets/images/ember.png',
      infoPlist: {
        NSFamilyControlsUsageDescription:
          'Ember uses Screen Time to block distracting apps during your focus sessions.',
        CFBundleURLTypes: [{ CFBundleURLSchemes: ['fifteen'] }],
        CFBundleURLName: BUNDLE_ID,
        ITSAppUsesNonExemptEncryption: false,
        NSSupportsLiveActivities: true,
        NSSupportsLiveActivitiesFrequentUpdates: true,
      },
      entitlements: {
        'com.apple.developer.family-controls': true,
        'com.apple.security.application-groups': [APP_GROUP],
        'com.apple.developer.live-activity': true,
      },
      supportsTablet: true,
    },

    plugins: [
      ['expo-build-properties', {}],

      // Screen Time
      [
        'react-native-device-activity',
        {
          appleTeamId: TEAM_ID,
          appGroup:    APP_GROUP,
        },
      ],

      // Live Activities — reads from targets/EmberLiveActivity/expo-target.config.js
      // '@bacons/apple-targets',

      // Entitlement + Info.plist keys for the main app target
      // './plugins/withLiveActivityMainApp',
    ],

    extra: {
      eas: {
        projectId: '4f8eb1c1-4947-4a21-9cbf-7118c8cd3c00',
      },
    },
  },
};
