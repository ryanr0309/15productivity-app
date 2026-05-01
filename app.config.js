
/* eslint-disable no-undef */
const BUNDLE_ID = 'com.ryan.fifteen';
const TEAM_ID   = 'YW69L3H994';
const APP_GROUP = `group.${BUNDLE_ID}`;

const withTikTokXCFramework = require('./plugins/withTikTok');

module.exports = {
  expo: {
    name: 'Ember',
    slug: 'fifteen',
    scheme: 'fifteen',
    version: '1.0.7',
    platforms: ['ios'],
    ios: {
      bundleIdentifier: BUNDLE_ID,
      buildNumber: '15',
      deploymentTarget: '16.2',
      appleTeamId: TEAM_ID,
      icon: './assets/images/appstore.png',
      infoPlist: {
        "CFBundleIcons~ipad": null,
        NSFamilyControlsUsageDescription: 'Ember uses Screen Time to block distracting apps during your focus sessions.',
        CFBundleURLTypes: [{ CFBundleURLSchemes: ['fifteen'] }],
        CFBundleURLName: BUNDLE_ID,
        ITSAppUsesNonExemptEncryption: false,
        NSUserTrackingUsageDescription: 'We use this to measure app performance and improve your experience.',
        SKAdNetworkItems: [
          { SKAdNetworkIdentifier: 'v9wttpbfk9.skadnetwork' },
          { SKAdNetworkIdentifier: '238da6jt44.skadnetwork' },
          { SKAdNetworkIdentifier: '22mmun2rq5.skadnetwork' },
          { SKAdNetworkIdentifier: 'c6k4g5qg8m.skadnetwork' },
          { SKAdNetworkIdentifier: '2u9pt9hc89.skadnetwork' },
          { SKAdNetworkIdentifier: '8s468mfl3y.skadnetwork' },
          { SKAdNetworkIdentifier: 'klf5c3l5u5.skadnetwork' },
        ],
      },
      entitlements: {
        'com.apple.developer.family-controls': true,
        'com.apple.security.application-groups': [APP_GROUP],
      },
      supportsTablet: true,
    },

    plugins: [
      withTikTokXCFramework,
      ['expo-build-properties', {
        ios: {
          extraLinkerFlags: ['-ObjC', '-lc++'],
        },
      }],
      ['expo-notifications', {
        icon: './assets/images/ember.png',
        color: '#ffffff',
      }],
      ['react-native-device-activity', {
        appleTeamId: TEAM_ID,
        appGroup: APP_GROUP,
      }],
      ['expo-localization'],
    ],

    extra: {
      eas: {
        projectId: '4f8eb1c1-4947-4a21-9cbf-7118c8cd3c00',
      },
    },
  },
};