// targets/EmberLiveActivity/expo-target.config.js
/* eslint-disable no-undef */

/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'widget',
  deploymentTarget: '16.2',
  frameworks: ['SwiftUI', 'ActivityKit'],
  entitlements: {
    'com.apple.security.application-groups': [
      `group.${config.ios.bundleIdentifier}`,
    ],
  },
  buildSettings: {
    SWIFT_VERSION: '5.0',
    SKIP_INSTALL: 'YES',
  },
});
