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

      // 3. Inject into existing post_install hook in Podfile
      const podfilePath = path.join(platformRoot, 'Podfile');
      if (fs.existsSync(podfilePath)) {
        let podfile = fs.readFileSync(podfilePath, 'utf8');

        const injection = `
  # TikTokFix: Add xcframework search path
  installer.pods_project.targets.each do |target|
    if target.name == 'TikTokBusiness'
      target.build_configurations.each do |config|
        existing = config.build_settings['FRAMEWORK_SEARCH_PATHS'] || ['$(inherited)']
        existing = [existing] if existing.is_a?(String)
        existing << '$(PODS_ROOT)/../vendor'
        config.build_settings['FRAMEWORK_SEARCH_PATHS'] = existing
      end
    end
  end
`;

        if (!podfile.includes('TikTokFix')) {
          // Insert at the start of the existing post_install block
          podfile = podfile.replace(
            /post_install do \|installer\|/,
            `post_install do |installer|\n${injection}`
          );
          fs.writeFileSync(podfilePath, podfile);
          console.log('[TikTokFix] Injected into existing post_install hook');
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