const fs = require("fs");
const isClean = require("git-is-clean");
const plist = require("plist");

const go = async () => {
  const clean = await isClean();
  if (!clean) {
    console.log("Git index is not clean");
    process.exit(1);
  }

  const PROJ_PATH = "ios/Converse.xcodeproj/project.pbxproj";
  const projContent = fs.readFileSync(PROJ_PATH, "utf-8");

  const newProjContent = projContent
    .replace(
      /PRODUCT_BUNDLE_IDENTIFIER = com\.converse\.dev/g,
      "PRODUCT_BUNDLE_IDENTIFIER = com.converse.native"
    )
    .replace(
      /com\.converse\.dev AdHoc 1672231603936/g,
      "com.converse.native AppStore 2022-12-08T13:34:24.744Z"
    )
    .replace(
      /com\.converse\.dev\.ConverseNotificationExtension AdHoc 1672234281727/g,
      "com.converse.native.ConverseNotificationExtension AppStore 2022-12-29T15:15:27.011Z"
    )
    .replace(
      /ASSETCATALOG_COMPILER_APPICON_NAME = AppIconPreview/g,
      "ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon"
    )
    .replace(/3L9E5TA22P/g, "Q6W2FLK8DM");

  fs.writeFileSync(PROJ_PATH, newProjContent);

  const PLIST_PATH = "ios/Converse/Info.plist";

  const info = plist.parse(fs.readFileSync(PLIST_PATH, "utf8"));
  info.CFBundleDisplayName = "Converse";
  info.CFBundleURLSchemes = ["converse", "com.converse.native"];
  info.CFBundleURLTypes[0].CFBundleURLSchemes = [
    "converse",
    "com.converse.native",
  ];
  const newInfo = plist.build(info);
  fs.writeFileSync(PLIST_PATH, newInfo, "utf-8");

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
