/* eslint-disable */
/* global require, module */

const { withDangerousMod, withEntitlementsPlist } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

module.exports = function withScreenTime(config) {

  // 1️⃣ Add required entitlements
  config = withEntitlementsPlist(config, (config) => {
    config.modResults["com.apple.developer.family-controls"] = true;
    config.modResults["com.apple.security.application-groups"] = [
      "group.com.ryan.fifteen",
    ];
    return config;
  });

  // 2️⃣ Write native files
  config = withDangerousMod(config, [
    "ios",
    async (config) => {
      const iosDir = config.modRequest.platformProjectRoot;
      const moduleDir = path.join(iosDir, "FocusShield");

      if (!fs.existsSync(moduleDir)) {
        fs.mkdirSync(moduleDir, { recursive: true });
      }

      // Swift file
      fs.writeFileSync(
        path.join(moduleDir, "FocusShieldModule.swift"),
        `
import Foundation
import FamilyControls
import ManagedSettings

@objc(FocusShieldModule)
class FocusShieldModule: NSObject {

  private let store = ManagedSettingsStore()

  @objc
  static func requiresMainQueueSetup() -> Bool { true }

  @objc
  func requestAuthorization(_ resolve: @escaping RCTPromiseResolveBlock,
                            rejecter reject: @escaping RCTPromiseRejectBlock) {

    Task {
      do {
        try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
        resolve(true)
      } catch {
        reject("AUTH_FAILED", error.localizedDescription, error)
      }
    }
  }

  @objc
  func startShield(_ resolve: @escaping RCTPromiseResolveBlock,
                   rejecter reject: @escaping RCTPromiseRejectBlock) {

    store.shield.applicationCategories = .all()
    resolve(true)
  }

  @objc
  func stopShield(_ resolve: @escaping RCTPromiseResolveBlock,
                  rejecter reject: @escaping RCTPromiseRejectBlock) {

    store.shield.applicationCategories = nil
    resolve(true)
  }
}
`
      );

      // ObjC bridge file
      fs.writeFileSync(
        path.join(moduleDir, "FocusShieldModule.m"),
        `
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(FocusShieldModule, NSObject)

RCT_EXTERN_METHOD(requestAuthorization:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(startShield:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stopShield:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
`
      );

      return config;
    },
  ]);

  return config;
};
