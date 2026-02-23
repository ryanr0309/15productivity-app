/**
 * plugins/withLiveActivity.js
 *
 * Expo config plugin that adds a Widget Extension target for Live Activities.
 * Mirrors the same approach as react-native-device-activity.
 *
 * What it does:
 *  1. Copies Swift files into ios/EmberLiveActivity/
 *  2. Creates a Widget Extension target in the Xcode project
 *  3. Adds NSSupportsLiveActivities to main app Info.plist
 *  4. Adds com.apple.developer.live-activity entitlement to main app
 *  5. Sets deployment target to 16.1+ on the widget target (minimum for Live Activities)
 *  6. Adds the widget target to the same App Group as the main app
 */

/* eslint-disable no-undef */

const {
  withXcodeProject,
  withInfoPlist,
  withEntitlementsPlist,

} = require('@expo/config-plugins');
const fs   = require('fs');
const path = require('path');

const WIDGET_TARGET_NAME = 'EmberLiveActivity';
const SWIFT_FILES = [
  'EmberSessionAttributes.swift',
  'EmberLiveActivityWidget.swift',
  'LiveActivityModule.swift',
  'LiveActivityModule.m',
];

// ─── 1. Copy Swift source files into ios/EmberLiveActivity/ ──────────────────
function withLiveActivityFiles(config) {
  return withXcodeProject(config, async (cfg) => {
    const iosRoot      = path.join(cfg.modRequest.projectRoot, 'ios');
    const widgetDir    = path.join(iosRoot, WIDGET_TARGET_NAME);
    const swiftSrcDir  = path.join(cfg.modRequest.projectRoot, 'plugins', 'live-activity-swift');

    if (!fs.existsSync(widgetDir)) fs.mkdirSync(widgetDir, { recursive: true });

    SWIFT_FILES.forEach(filename => {
      const src  = path.join(swiftSrcDir, filename);
      const dest = path.join(widgetDir, filename);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`[withLiveActivity] Copied ${filename} → ios/${WIDGET_TARGET_NAME}/`);
      } else {
        console.warn(`[withLiveActivity] WARNING: Source file not found: ${src}`);
      }
    });

    return cfg;
  });
}

// ─── 2. Add NSSupportsLiveActivities to Info.plist ───────────────────────────
function withLiveActivityInfoPlist(config) {
  return withInfoPlist(config, (cfg) => {
    cfg.modResults.NSSupportsLiveActivities = true;
    cfg.modResults.NSSupportsLiveActivitiesFrequentUpdates = true;
    return cfg;
  });
}

// ─── 3. Add entitlement to main app ──────────────────────────────────────────
function withLiveActivityEntitlement(config) {
  return withEntitlementsPlist(config, (cfg) => {
    cfg.modResults['com.apple.developer.live-activity'] = true;
    return cfg;
  });
}

// ─── 4. Add Widget Extension target to Xcode project ─────────────────────────
function withLiveActivityXcodeTarget(config, { appleTeamId, appGroup }) {
  return withXcodeProject(config, async (cfg) => {
    const xcodeProject = cfg.modResults;
    const bundleId     = cfg.ios?.bundleIdentifier ?? 'com.ryan.fifteen';
    const widgetBundleId = `${bundleId}.${WIDGET_TARGET_NAME}`;
    const iosRoot      = path.join(cfg.modRequest.projectRoot, 'ios');
    const widgetDir    = path.join(iosRoot, WIDGET_TARGET_NAME);

    // Don't add duplicate targets on repeated prebuild runs
    const existingTargets = xcodeProject.pbxNativeTargetSection();
    const alreadyExists   = Object.values(existingTargets).some(
      t => t && t.name === WIDGET_TARGET_NAME
    );
    if (alreadyExists) {
      console.log(`[withLiveActivity] Target ${WIDGET_TARGET_NAME} already exists, skipping.`);
      return cfg;
    }

    // Add a new App Extension target
    const target = xcodeProject.addTarget(
      WIDGET_TARGET_NAME,
      'app_extension',
      WIDGET_TARGET_NAME,
      widgetBundleId
    );

    if (!target) {
      console.error('[withLiveActivity] Failed to create Xcode target');
      return cfg;
    }

    // Add source files to the target
    xcodeProject.addBuildPhase(
      SWIFT_FILES.filter(f => f.endsWith('.swift') || f.endsWith('.m')).map(
        f => `${WIDGET_TARGET_NAME}/${f}`
      ),
      'PBXSourcesBuildPhase',
      'Sources',
      target.uuid
    );

    // Build settings for the widget target
    const configurations = xcodeProject.pbxXCBuildConfigurationSection();
    Object.entries(configurations).forEach(([buildConfig]) => {
      if (
        buildConfig &&
        buildConfig.buildSettings &&
        buildConfig.buildSettings.PRODUCT_NAME === `"${WIDGET_TARGET_NAME}"`
      ) {
        buildConfig.buildSettings.SWIFT_VERSION                    = '5.0';
        buildConfig.buildSettings.IPHONEOS_DEPLOYMENT_TARGET       = '16.2';
        buildConfig.buildSettings.TARGETED_DEVICE_FAMILY           = '"1,2"';
        buildConfig.buildSettings.DEVELOPMENT_TEAM                 = appleTeamId;
        buildConfig.buildSettings.PRODUCT_BUNDLE_IDENTIFIER        = `"${widgetBundleId}"`;
        buildConfig.buildSettings.CODE_SIGN_STYLE                  = 'Automatic';
        buildConfig.buildSettings.CODE_SIGN_ENTITLEMENTS            =
          `"${WIDGET_TARGET_NAME}/${WIDGET_TARGET_NAME}.entitlements"`;
      }
    });

    // Write entitlements file for the widget target
    const entitlementsPath = path.join(widgetDir, `${WIDGET_TARGET_NAME}.entitlements`);
    const entitlementsContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.application-groups</key>
  <array>
    <string>${appGroup}</string>
  </array>
</dict>
</plist>`;
    fs.writeFileSync(entitlementsPath, entitlementsContent);
    console.log(`[withLiveActivity] Wrote ${WIDGET_TARGET_NAME}.entitlements`);

    return cfg;
  });
}

// ─── Main plugin export ───────────────────────────────────────────────────────
module.exports = function withLiveActivity(config, options = {}) {
  const appleTeamId = options.appleTeamId ?? config.ios?.appleTeamId ?? '';
  const bundleId    = config.ios?.bundleIdentifier ?? 'com.ryan.fifteen';
  const appGroup    = options.appGroup ?? `group.${bundleId}`;

  config = withLiveActivityFiles(config);
  config = withLiveActivityInfoPlist(config);
  config = withLiveActivityEntitlement(config);
  config = withLiveActivityXcodeTarget(config, { appleTeamId, appGroup });

  return config;
};
