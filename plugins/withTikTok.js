/* eslint-disable no-undef */
const { withXcodeProject, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function withTikTokXCFramework(config) {
  config = withDangerousMod(config, [
    'ios',
    (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformRoot = config.modRequest.platformProjectRoot;

      // Copy xcframework to ios/vendor/
      const src = path.join(projectRoot, 'vendor', 'TikTokBusinessSDK.xcframework');
      const destDir = path.join(platformRoot, 'vendor');
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      if (fs.existsSync(src)) {
        execSync(`cp -r "${src}" "${destDir}/"`);
        console.log('[TikTokFix] xcframework copied to ios/vendor/');
      } else {
        console.error('[TikTokFix] ERROR: xcframework not found at', src);
      }

      // Patch TikTokBusiness.podspec
      // The podspec lives at: node_modules/react-native-tiktok-business-sdk/TikTokBusiness.podspec
      // The ios/vendor folder relative to that podspec is: ../../ios/vendor
      const podspecPath = path.join(
        projectRoot,
        'node_modules',
        'react-native-tiktok-business-sdk',
        'TikTokBusiness.podspec'
      );

      if (fs.existsSync(podspecPath)) {
        let podspec = fs.readFileSync(podspecPath, 'utf8');
        
        // Remove TikTokBusinessSDK pod dependency
        podspec = podspec.replace(/\s*s\.dependency\s+['"]TikTokBusinessSDK['"][^\n]*\n/g, '\n');
        
        // Add vendored_frameworks pointing to the xcframework
        // Path from node_modules/react-native-tiktok-business-sdk/ to ios/vendor/
        if (!podspec.includes('vendored_frameworks')) {
          podspec = podspec.replace(
            /end\s*$/,
            `  s.vendored_frameworks = '../../ios/vendor/TikTokBusinessSDK.xcframework'\nend\n`
          );
        }

        fs.writeFileSync(podspecPath, podspec);
        console.log('[TikTokFix] Patched podspec contents:\n', podspec);
      } else {
        console.error('[TikTokFix] ERROR: podspec not found');
      }

      return config;
    },
  ]);

  config = withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    xcodeProject.addFramework('vendor/TikTokBusinessSDK.xcframework', {
      customFramework: true,
      embed: true,
    });
    return config;
  });

  return config;
}

module.exports = withTikTokXCFramework;