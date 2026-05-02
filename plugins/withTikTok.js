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

      // 1. Copy xcframework to ios/vendor/
      const src = path.join(projectRoot, 'vendor', 'TikTokBusinessSDK.xcframework');
      const destDir = path.join(platformRoot, 'vendor');
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      if (fs.existsSync(src)) {
        execSync(`cp -r "${src}" "${destDir}/"`);
        console.log('[TikTokFix] xcframework copied to ios/vendor/');
      }

      // 2. Remove TikTokBusinessSDK pod dependency from podspec
      const podspecPath = path.join(
        projectRoot,
        'node_modules',
        'react-native-tiktok-business-sdk',
        'TikTokBusiness.podspec'
      );
      if (fs.existsSync(podspecPath)) {
        let podspec = fs.readFileSync(podspecPath, 'utf8');
        podspec = podspec.replace(/\s*s\.dependency\s+['"]TikTokBusinessSDK['"][^\n]*\n/g, '\n');
        fs.writeFileSync(podspecPath, podspec);
        console.log('[TikTokFix] Removed TikTokBusinessSDK pod dependency');
      }

      // 3. Patch the Podfile to add post_install hook
      const podfilePath = path.join(platformRoot, 'Podfile');
      if (fs.existsSync(podfilePath)) {
        let podfile = fs.readFileSync(podfilePath, 'utf8');
        const hook = `
# TikTokFix: Add xcframework search path to TikTokBusiness pod
post_install do |installer|
  installer.pods_project.targets.each do |target|
    if target.name == 'TikTokBusiness'
      target.build_configurations.each do |config|
        config.build_settings['FRAMEWORK_SEARCH_PATHS'] ||= ['$(inherited)']
        config.build_settings['FRAMEWORK_SEARCH_PATHS'] << '$(PODS_ROOT)/../../vendor'
        config.build_settings['SWIFT_INCLUDE_PATHS'] ||= ['$(inherited)']
        config.build_settings['SWIFT_INCLUDE_PATHS'] << '$(PODS_ROOT)/../../vendor'
      end
    end
  end
end
`;
        if (!podfile.includes('TikTokFix')) {
          fs.writeFileSync(podfilePath, podfile + hook);
          console.log('[TikTokFix] Added post_install hook to Podfile');
        }
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