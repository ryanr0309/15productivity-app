// targets/monitor/expo-target.config.js
/* eslint-disable */

/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'device-activity-monitor',   // maps to DeviceActivityMonitorExtension

  entitlements: {
    'com.apple.developer.family-controls': true,
    'com.apple.security.application-groups':
      config.ios.entitlements['com.apple.security.application-groups'],
  },
});
