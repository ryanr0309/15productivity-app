// targets/shield/expo-target.config.js
// Tells react-native-device-activity / expo-apple-targets what kind of
// extension this target is and what entitlements it needs.

/* eslint-disable */

/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'shield-configuration',   // maps to ShieldConfigurationExtension

  // Mirror the same App Group from the main target so the extension
  // can read shields/actions written by the JS layer via UserDefaults.
  entitlements: {
    'com.apple.developer.family-controls': true,
    'com.apple.security.application-groups':
      config.ios.entitlements['com.apple.security.application-groups'],
  },
});
