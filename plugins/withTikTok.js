/* eslint-disable no-undef */

const { withXcodeProject, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function withTikTokXCFramework(config) {
  // Step 1: Copy xcframework + patch podspec
  config = withDangerousMod(config, [
    'ios',
    (config) => {
      // Copy xcframework to ios/vendor/
      const src = path.join(config.modRequest.projectRoot, 'vendor', 'TikTokBusinessSDK.xcframework');
      const destDir = path.join(config.modRequest.platformProjectRoot, 'vendor');

      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      if (fs.existsSync(src)) {
        execSync(`cp -r "${src}" "${destDir}/"`);
        console.log('[TikTokFix] xcframework copied to ios/vendor/');
      } else {
        console.error('[TikTokFix] ERROR: xcframework not found at', src);
      }

      // Patch TikTokBusiness.podspec to remove TikTokBusinessSDK dependency
      const podspecPath = path.join(
        config.modRequest.projectRoot,
        'node_modules',
        'react-native-tiktok-business-sdk',
        'TikTokBusiness.podspec'
      );

      if (fs.existsSync(podspecPath)) {
        let podspec = fs.readFileSync(podspecPath, 'utf8');
        console.log('[TikTokFix] Original podspec:', podspec);
        podspec = podspec.replace(/.*s\.dependency.*TikTokBusinessSDK.*\n/g, '');
        fs.writeFileSync(podspecPath, podspec);
        console.log('[TikTokFix] Patched podspec, removed TikTokBusinessSDK dependency');
      } else {
        console.error('[TikTokFix] ERROR: podspec not found at', podspecPath);
      }

      return config;
    },
  ]);

  // Step 2: Add xcframework to Xcode project
  config = withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    xcodeProject.addFramework('vendor/TikTokBusinessSDK.xcframework', {
      customFramework: true,
      embed: true,
    });
    console.log('[TikTokFix] Added xcframework to Xcode project');
    return config;
  });

  return config;
}

module.exports = withTikTokXCFramework;