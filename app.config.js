// app.config.js
// Replace YOUR_TEAM_ID with your 10-char Apple Team ID (find it at
// developer.apple.com → Membership → Team ID, e.g. "AB12CD34EF")
// Replace com.yourcompany.ember with your actual bundle ID everywhere.

const BUNDLE_ID  = 'com.ryan.fifteen';
const TEAM_ID    = 'YW69L3H994';
const APP_GROUP  = `group.${BUNDLE_ID}`;

export default {
  expo: {
    name: 'Fifteen',
    slug: 'fifteen',
    version: '1.0.0',
    platforms: ['ios'],
    ios: {
      bundleIdentifier: BUNDLE_ID,
      deploymentTarget: '16.0',  // FamilyControls needs 16+ for full feature set
      appleTeamId: TEAM_ID,
      infoPlist: {
        NSFamilyControlsUsageDescription:
          'Ember uses Screen Time to block distracting apps during your focus sessions.',
        CFBundleURLTypes: [{ CFBundleURLSchemes: ['fifteen'] }],
        CFBundleURLName: BUNDLE_ID
      },
      entitlements: {
        // ── The entitlement Apple approved ──
        'com.apple.developer.family-controls': true,
        // ── App Groups: required for main app ↔ extensions to share data ──
        'com.apple.security.application-groups': [APP_GROUP],
      },
      
    },

    plugins: [
      // ── 1. Raise iOS deployment target for all pods ──
      [
        'expo-build-properties',
        {
          ios: { deploymentTarget: '16.0' },
        },
      ],

      // ── 2. react-native-device-activity ──
      // This plugin does the heavy lifting:
      //   • Injects FamilyControls entitlement into the main target
      //   • Creates the DeviceActivityMonitor extension target
      //   • Creates the ShieldConfiguration extension target
      //   • Wires App Groups across all three targets
      [
        'react-native-device-activity',
        {
          appleTeamId: TEAM_ID,
          appGroup:    APP_GROUP,
        },
      ],
    ],

    // ── EAS: tell it about the two extension targets so it generates
    //    credentials for them before the build starts ──
    extra: {
      
  eas: {
    projectId: '4f8eb1c1-4947-4a21-9cbf-7118c8cd3c00'
  }

  },
}};
