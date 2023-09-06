const fs = require("fs");
const plist = require("plist");

const go = async () => {
  const PROJ_PATH = "ios/Converse.xcodeproj/project.pbxproj";
  const projContent = fs.readFileSync(PROJ_PATH, "utf-8");

  const newProjContent = projContent
    .replace(
      /PRODUCT_BUNDLE_IDENTIFIER = com\.converse\.dev/g,
      "PRODUCT_BUNDLE_IDENTIFIER = com.converse.native"
    )
    .replace(
      /ASSETCATALOG_COMPILER_APPICON_NAME = AppIconPreview/g,
      "ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon"
    );

  fs.writeFileSync(PROJ_PATH, newProjContent);

  const PLIST_APP_PATH = "ios/Converse/Info.plist";
  const PLIST_EXTENSION_PATH = "ios/ConverseNotificationExtension/Info.plist";

  const appInfo = plist.parse(fs.readFileSync(PLIST_APP_PATH, "utf8"));
  appInfo.CFBundleDisplayName = "Converse";
  appInfo.CFBundleURLSchemes = ["converse", "com.converse.native"];
  appInfo.CFBundleURLTypes[0].CFBundleURLSchemes = [
    "converse",
    "com.converse.native",
  ];
  const newAppInfo = plist.build(appInfo);
  fs.writeFileSync(PLIST_APP_PATH, newAppInfo, "utf-8");

  const extensionInfo = plist.parse(fs.readFileSync(PLIST_EXTENSION_PATH, "utf8"));
  extensionInfo.AppBundleId = "com.converse.native";
  extensionInfo.Env = "prod";
  const newExtensionInfo = plist.build(extensionInfo);
  fs.writeFileSync(PLIST_EXTENSION_PATH, newExtensionInfo, "utf-8");

  const ENTITLEMENTS_APP_PATH = "ios/Converse/Converse.entitlements";
  const ENTITLEMENTS_EXTENSION_PATH =
    "ios/ConverseNotificationExtension/ConverseNotificationExtension.entitlements";

  const entitlementsApp = plist.parse(
    fs.readFileSync(ENTITLEMENTS_APP_PATH, "utf8")
  );
  const entitlementsExtension = plist.parse(
    fs.readFileSync(ENTITLEMENTS_EXTENSION_PATH, "utf8")
  );
  entitlementsApp["keychain-access-groups"][0] = entitlementsApp[
    "keychain-access-groups"
  ][0].replace("com.converse.dev", "com.converse.native");
  entitlementsApp["com.apple.security.application-groups"][0] = entitlementsApp[
    "com.apple.security.application-groups"
  ][0].replace("com.converse.dev", "com.converse.native");
  entitlementsApp["com.apple.developer.associated-domains"][0] =
    entitlementsApp["com.apple.developer.associated-domains"][0].replace(
      "applinks:dev.converse.xyz",
      "applinks:converse.xyz"
    );
  entitlementsApp["com.apple.developer.associated-domains"][1] =
    entitlementsApp["com.apple.developer.associated-domains"][1].replace(
      "applinks:dev.getconverse.app",
      "applinks:getconverse.app"
    );
  entitlementsExtension["keychain-access-groups"][0] = entitlementsExtension[
    "keychain-access-groups"
  ][0].replace("com.converse.dev", "com.converse.native");
  entitlementsExtension["com.apple.security.application-groups"][0] =
    entitlementsExtension["com.apple.security.application-groups"][0].replace(
      "com.converse.dev",
      "com.converse.native"
    );
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
