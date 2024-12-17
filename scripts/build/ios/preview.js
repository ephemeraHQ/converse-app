/**
 * iOS Preview Environment Configuration Script
 *
 * This script modifies various iOS configuration files to set up
 * the preview environment build variant of the Converse app.
 * It updates bundle IDs, display names, URL schemes and
 * entitlements to use preview-specific values.
 *
 * The GoogleService-Info.plist file contains Firebase configuration
 * specific to the preview environment. This file is downloaded from:
 * https://console.firebase.google.com/project/converse-unshut-labs/
 * settings/general/ios:com.converse.preview
 *
 * The file contains environment-specific Firebase settings including:
 * - API keys
 * - Bundle IDs
 * - Project IDs
 * - Client IDs
 * - Database URLs
 *
 * @sideEffects
 * - Copies preview-specific GoogleService-Info.plist
 * - Updates Xcode project config
 * - Updates Info.plist files
 * - Updates entitlements files
 */

const fs = require("fs");
const plist = require("plist");
const { copyGoogleServiceInfo } = require("../build.utils.js");

/**
 * iOS Preview Environment Configuration Script
 *
 * This script modifies various iOS configuration files to set up
 * the preview environment build variant of the Converse app.
 * It updates bundle IDs, display names, URL schemes and
 * entitlements to use preview-specific values.
 *
 * @sideEffects
 * - Updates Xcode project config
 * - Updates Info.plist files
 * - Updates entitlements files
 */
const go = async () => {
  copyGoogleServiceInfo("preview");

  //
  // Update Xcode Project Bundle ID
  // ----------------------------------------
  const PROJ_PATH = "ios/Converse.xcodeproj/project.pbxproj";
  const projContent = fs.readFileSync(PROJ_PATH, "utf-8");

  // Replace dev bundle ID with preview bundle ID
  const newProjContent = projContent.replace(
    /PRODUCT_BUNDLE_IDENTIFIER = com\.converse\.dev/g,
    "PRODUCT_BUNDLE_IDENTIFIER = com.converse.preview"
  );

  fs.writeFileSync(PROJ_PATH, newProjContent);

  //
  // Update Info.plist Files
  // ----------------------------------------
  const PLIST_APP_PATH = "ios/Converse/Info.plist";
  const PLIST_EXTENSION_PATH = "ios/ConverseNotificationExtension/Info.plist";

  // Update main app Info.plist
  const appInfo = plist.parse(fs.readFileSync(PLIST_APP_PATH, "utf8"));
  appInfo.CFBundleDisplayName = "Converse PREVIEW";
  appInfo.CFBundleURLSchemes = ["converse-preview", "com.converse.preview"];
  appInfo.CFBundleURLTypes[0].CFBundleURLSchemes = [
    "converse-preview",
    "com.converse.preview",
  ];
  const newAppInfo = plist.build(appInfo);
  fs.writeFileSync(PLIST_APP_PATH, newAppInfo, "utf-8");

  // Update notification extension Info.plist
  const extensionInfo = plist.parse(
    fs.readFileSync(PLIST_EXTENSION_PATH, "utf8")
  );
  extensionInfo.AppBundleId = "com.converse.preview";
  extensionInfo.Env = "preview";
  const newExtensionInfo = plist.build(extensionInfo);
  fs.writeFileSync(PLIST_EXTENSION_PATH, newExtensionInfo, "utf-8");

  //
  // Update Entitlements Files
  // ----------------------------------------
  const ENTITLEMENTS_APP_PATH = "ios/Converse/Converse.entitlements";
  const ENTITLEMENTS_EXTENSION_PATH =
    "ios/ConverseNotificationExtension/ConverseNotificationExtension.entitlements";

  // Load entitlements files
  const entitlementsApp = plist.parse(
    fs.readFileSync(ENTITLEMENTS_APP_PATH, "utf8")
  );
  const entitlementsExtension = plist.parse(
    fs.readFileSync(ENTITLEMENTS_EXTENSION_PATH, "utf8")
  );

  // Update main app entitlements
  entitlementsApp["keychain-access-groups"][0] = entitlementsApp[
    "keychain-access-groups"
  ][0].replace("com.converse.dev", "com.converse.preview");
  entitlementsApp["com.apple.security.application-groups"][0] = entitlementsApp[
    "com.apple.security.application-groups"
  ][0].replace("com.converse.dev", "com.converse.preview");
  entitlementsApp["com.apple.developer.associated-domains"][0] =
    entitlementsApp["com.apple.developer.associated-domains"][0].replace(
      "applinks:dev.converse.xyz",
      "applinks:preview.converse.xyz"
    );
  entitlementsApp["com.apple.developer.associated-domains"][1] =
    entitlementsApp["com.apple.developer.associated-domains"][1].replace(
      "applinks:dev.getconverse.app",
      "applinks:preview.getconverse.app"
    );

  // Update notification extension entitlements
  entitlementsExtension["keychain-access-groups"][0] = entitlementsExtension[
    "keychain-access-groups"
  ][0].replace("com.converse.dev", "com.converse.preview");
  entitlementsExtension["com.apple.security.application-groups"][0] =
    entitlementsExtension["com.apple.security.application-groups"][0].replace(
      "com.converse.dev",
      "com.converse.preview"
    );

  // Write updated entitlements back to files
  const newEntitlementsApp = plist.build(entitlementsApp);
  fs.writeFileSync(ENTITLEMENTS_APP_PATH, newEntitlementsApp, "utf-8");

  const newEntitlementsExtension = plist.build(entitlementsExtension);
  fs.writeFileSync(
    ENTITLEMENTS_EXTENSION_PATH,
    newEntitlementsExtension,
    "utf-8"
  );
};

go();
