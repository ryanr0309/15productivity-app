/**
 * plugins/withLiveActivityMainApp.js
 *
 * Slim plugin — only adds the live-activity entitlement and Info.plist
 * keys to the MAIN APP target. The widget target itself is handled by
 * @bacons/apple-targets reading targets/EmberLiveActivity/expo-target.config.js
 */

/* eslint-disable no-undef */


const { withInfoPlist, withEntitlementsPlist } = require('@expo/config-plugins');

function withLiveActivityMainApp(config) {
  // Info.plist
  config = withInfoPlist(config, (cfg) => {
    cfg.modResults.NSSupportsLiveActivities = true;
    cfg.modResults.NSSupportsLiveActivitiesFrequentUpdates = true;
    return cfg;
  });

  // Entitlement
  config = withEntitlementsPlist(config, (cfg) => {
    cfg.modResults['com.apple.developer.live-activity'] = true;
    return cfg;
  });

  return config;
}

module.exports = withLiveActivityMainApp;
