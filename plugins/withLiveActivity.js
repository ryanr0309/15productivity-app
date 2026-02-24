/**
 * plugins/withLiveActivity.js
 *
 * FULL FIX (custom plugin, EAS-detectable):
 * ✅ Creates widget folder + copies Swift/M files
 * ✅ Writes REQUIRED Info.plist for the extension
 * ✅ Writes extension entitlements
 * ✅ Adds/updates Xcode target build settings (INFOPLIST_FILE, CODE_SIGN_ENTITLEMENTS, etc.)
 * ✅ Adds Sources build phase
 * ✅ Adds Product (.appex) to Products group
 * ✅ Embeds the extension into the main app ("Embed App Extensions" Copy Files phase)
 * ✅ Adds target dependency (main app depends on extension)
 *
 * Key: EAS will only list/sign the extension if it is a real embedded app extension target.
 */

/* eslint-disable no-undef */

const { withXcodeProject, withInfoPlist, withEntitlementsPlist } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const WIDGET_TARGET_NAME = "EmberLiveActivity";

const SOURCE_FILES = [
  "EmberSessionAttributes.swift",
  "EmberLiveActivityWidget.swift",
  "LiveActivityModule.swift",
  "LiveActivityModule.m",
];

// ─── Main app Info.plist flags (your main app target) ─────────────────────────
function withLiveActivityInfoPlist(config) {
  return withInfoPlist(config, (cfg) => {
    cfg.modResults.NSSupportsLiveActivities = true;
    cfg.modResults.NSSupportsLiveActivitiesFrequentUpdates = true;
    return cfg;
  });
}

// ─── Main app entitlement (your main app target) ──────────────────────────────
function withLiveActivityEntitlement(config) {
  return withEntitlementsPlist(config, (cfg) => {
    cfg.modResults["com.apple.developer.live-activity"] = true;
    return cfg;
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getMainAppTargetUuid(xcodeProject) {
  const targets = xcodeProject.pbxNativeTargetSection();
  const entries = Object.entries(targets).filter(([k, v]) => !k.endsWith("_comment") && v);

  // Prefer the actual application target (not extensions)
  for (const [, t] of entries) {
    if (t.productType === '"com.apple.product-type.application"' || t.productType === "com.apple.product-type.application") {
      return t.uuid;
    }
  }

  // Fallback: first target
  const first = xcodeProject.getFirstTarget?.();
  return first?.uuid;
}

function findTargetByName(xcodeProject, name) {
  const targets = xcodeProject.pbxNativeTargetSection();
  const entries = Object.entries(targets).filter(([k]) => !k.endsWith("_comment"));

  for (const [, t] of entries) {
    if (!t) continue;
    // node-xcode sometimes stores name with quotes
    const rawName = typeof t.name === "string" ? t.name.replace(/"/g, "") : "";
    if (rawName === name) return t;
  }
  return null;
}

function hasTargetDependency(xcodeProject, mainTargetUuid, extTargetUuid) {
  const deps = xcodeProject.hash.project.objects.PBXTargetDependency || {};
  const entries = Object.entries(deps).filter(([k]) => !k.endsWith("_comment"));

  for (const [, d] of entries) {
    if (!d) continue;
    // PBXTargetDependency has a "target" field pointing to the dependent target
    if (d.target === extTargetUuid) {
      // Also ensure it's attached to main target somewhere (weak check)
      return true;
    }
  }

  // node-xcode maintains dependencies inside PBXNativeTarget.dependencies sometimes
  const nativeTargets = xcodeProject.hash.project.objects.PBXNativeTarget || {};
  const mainTarget = nativeTargets[mainTargetUuid];
  if (!mainTarget || !Array.isArray(mainTarget.dependencies)) return false;

  // If any dependency points to a PBXTargetDependency that points to extTargetUuid, we’d need deeper traversal.
  // Keep it simple: if any target dependency exists for this ext target, it's usually fine.
  return false;
}

function ensureProductsGroupHasAppeX(xcodeProject, appexName) {
  // Add product to Products group (idempotent-ish: addFile will no-op if already there in many cases)
  try {
    const productsGroupKey = xcodeProject.findPBXGroupKey({ name: "Products" });
    if (productsGroupKey) {
      xcodeProject.addFile(appexName, productsGroupKey, { lastKnownFileType: "wrapper.app-extension" });
    }
  } catch (e) {
    console.log(e)
  }
}

// ─── Single Xcode pass ────────────────────────────────────────────────────────
function withLiveActivityXcode(config, { appleTeamId, appGroup }) {
  return withXcodeProject(config, async (cfg) => {
    const projectRoot = cfg.modRequest.projectRoot;
    const iosRoot = path.join(projectRoot, "ios");
    const widgetDir = path.join(iosRoot, WIDGET_TARGET_NAME);
    const swiftSrcDir = path.join(projectRoot, "plugins", "live-activity-swift");
    const xcodeProject = cfg.modResults;

    const bundleId =
      cfg.ios?.bundleIdentifier ??
      config.ios?.bundleIdentifier ??
      "com.ryan.fifteen";

    const widgetBundleId = `${bundleId}.${WIDGET_TARGET_NAME}`;

    // 1) Ensure widget directory exists
    if (!fs.existsSync(widgetDir)) {
      fs.mkdirSync(widgetDir, { recursive: true });
      console.log(`[withLiveActivity] Created ios/${WIDGET_TARGET_NAME}/`);
    }

    // 2) Copy source files
    SOURCE_FILES.forEach((filename) => {
      const src = path.join(swiftSrcDir, filename);
      const dest = path.join(widgetDir, filename);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`[withLiveActivity] Copied ${filename}`);
      } else {
        console.warn(`[withLiveActivity] WARNING: Missing ${src}`);
      }
    });

    // 3) Write REQUIRED Info.plist for the extension target
    const infoPlistPath = path.join(widgetDir, `${WIDGET_TARGET_NAME}-Info.plist`);
    if (!fs.existsSync(infoPlistPath)) {
      fs.writeFileSync(
        infoPlistPath,
        `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
"http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDisplayName</key>
  <string>${WIDGET_TARGET_NAME}</string>
  <key>CFBundleIdentifier</key>
  <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
  <key>CFBundleName</key>
  <string>${WIDGET_TARGET_NAME}</string>
  <key>CFBundlePackageType</key>
  <string>XPC!</string>
  <key>NSExtension</key>
  <dict>
    <key>NSExtensionPointIdentifier</key>
    <string>com.apple.widgetkit-extension</string>
  </dict>
</dict>
</plist>`
      );
      console.log(`[withLiveActivity] Wrote ${WIDGET_TARGET_NAME}-Info.plist`);
    }

    // 4) Write extension entitlements
    const entitlementsPath = path.join(widgetDir, `${WIDGET_TARGET_NAME}.entitlements`);
    fs.writeFileSync(
      entitlementsPath,
      `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.application-groups</key>
  <array>
    <string>${appGroup}</string>
  </array>
</dict>
</plist>`
    );
    console.log(`[withLiveActivity] Wrote ${WIDGET_TARGET_NAME}.entitlements`);

    // 5) Create OR get the extension target
    let extTarget = findTargetByName(xcodeProject, WIDGET_TARGET_NAME);

    if (!extTarget) {
      extTarget = xcodeProject.addTarget(
        WIDGET_TARGET_NAME,
        "app_extension",
        WIDGET_TARGET_NAME,
        widgetBundleId
      );

      if (!extTarget) {
        console.error("[withLiveActivity] Failed to create Xcode target");
        return cfg;
      }

      console.log(`[withLiveActivity] Added target ${WIDGET_TARGET_NAME} (${widgetBundleId})`);
    } else {
      console.log(`[withLiveActivity] Target already exists, updating wiring/settings.`);
    }

    const extTargetUuid = extTarget.uuid;

    // 6) Ensure Sources build phase includes our files
    // node-xcode addBuildPhase will create a Sources phase even if already exists; avoid duplicates by
    // only calling when it doesn't already have PBXSourcesBuildPhase named "Sources" for this target.
    // (Lightweight check)
    const nativeTargets = xcodeProject.hash.project.objects.PBXNativeTarget || {};
    const extNative = nativeTargets[extTargetUuid];
    const buildPhases = extNative?.buildPhases || [];
    const hasSourcesPhase = buildPhases.some((bp) => {
      const phaseId = bp.value;
      const src = xcodeProject.hash.project.objects.PBXSourcesBuildPhase?.[phaseId];
      const comment = xcodeProject.hash.project.objects.PBXSourcesBuildPhase?.[`${phaseId}_comment`] || "";
      const name = (src?.name || comment || "").replace(/"/g, "");
      return name.includes("Sources");
    });

    if (!hasSourcesPhase) {
      xcodeProject.addBuildPhase(
        SOURCE_FILES.map((f) => `${WIDGET_TARGET_NAME}/${f}`),
        "PBXSourcesBuildPhase",
        "Sources",
        extTargetUuid
      );
    }

    // 7) Build settings for the extension (INFOPLIST_FILE is crucial)
    const configs = xcodeProject.pbxXCBuildConfigurationSection();
    Object.values(configs).forEach((bc) => {
      if (!bc?.buildSettings) return;

      const productName = bc.buildSettings.PRODUCT_NAME;
      const cleanProductName = typeof productName === "string" ? productName.replace(/"/g, "") : "";

      if (cleanProductName === WIDGET_TARGET_NAME) {
        Object.assign(bc.buildSettings, {
          SWIFT_VERSION: "5.0",
          IPHONEOS_DEPLOYMENT_TARGET: "16.2",
          TARGETED_DEVICE_FAMILY: '"1,2"',
          DEVELOPMENT_TEAM: appleTeamId,
          PRODUCT_BUNDLE_IDENTIFIER: `"${widgetBundleId}"`,
          CODE_SIGN_ENTITLEMENTS: `"${WIDGET_TARGET_NAME}/${WIDGET_TARGET_NAME}.entitlements"`,
          INFOPLIST_FILE: `"${WIDGET_TARGET_NAME}/${WIDGET_TARGET_NAME}-Info.plist"`,
          // Helpful defaults for extensions
          SKIP_INSTALL: "YES",
        });
      }
    });

    // 8) Ensure the .appex product is represented (helps Xcode + EAS)
    ensureProductsGroupHasAppeX(xcodeProject, `${WIDGET_TARGET_NAME}.appex`);

    // 9) Embed extension into main app + add dependency (THIS makes EAS detect it)
    const mainTargetUuid = getMainAppTargetUuid(xcodeProject);

    if (mainTargetUuid) {
      // Target dependency
      if (!hasTargetDependency(xcodeProject, mainTargetUuid, extTargetUuid)) {
        try {
          xcodeProject.addTargetDependency(mainTargetUuid, extTargetUuid);
        } catch (e) {
          console.log(e)
        }
      }

      // Embed App Extensions phase
      // Embed extension into main app
const embedPhase = xcodeProject.addBuildPhase(
  [`${WIDGET_TARGET_NAME}.appex`],
  'PBXCopyFilesBuildPhase',
  'Embed App Extensions',
  mainTargetUuid,
  '10'
);

// Force attach build phase to main target manually
const mainTarget = xcodeProject.hash.project.objects.PBXNativeTarget[mainTargetUuid];

if (mainTarget && !mainTarget.buildPhases.some(bp => bp.value === embedPhase.uuid)) {
  mainTarget.buildPhases.push({
    value: embedPhase.uuid,
    comment: 'Embed App Extensions'
  });
}
    } else {
      console.warn("[withLiveActivity] WARNING: Could not find main app target UUID; embedding may be missing.");
    }

    return cfg;
  });
}

// ─── Export ───────────────────────────────────────────────────────────────────
module.exports = function withLiveActivity(config, options = {}) {
  const bundleId = config.ios?.bundleIdentifier ?? "com.ryan.fifteen";
  const appleTeamId = options.appleTeamId ?? config.ios?.appleTeamId ?? "";
  const appGroup = options.appGroup ?? `group.${bundleId}`;

  config = withLiveActivityInfoPlist(config);
  config = withLiveActivityEntitlement(config);
  config = withLiveActivityXcode(config, { appleTeamId, appGroup });

  return config;
};