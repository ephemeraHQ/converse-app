## SpecStory

## Configuring Face ID for Passkey Login (2/6/2025, 3:06:09 PM)

_**User**_

i'm using passkey login with faceId . am i missing some config here? Maybe like "com.apple.developer.applesignin"?

---

_**Assistant**_

Yes, to properly support Face ID and passkey authentication on iOS, you'll need to add some additional configuration. Here's how to modify the config:

```typescript:app.config.ts
// ... existing code ...
    ios: {
      bundleIdentifier: config.ios.bundleIdentifier,
      supportsTablet: true,
      config: {
        usesNonExemptEncryption: false,
      },
      associatedDomains: config.ios.associatedDomains,
      googleServicesFile: config.ios.googleServicesFile,
      infoPlist: {
        LSApplicationQueriesSchemes: [
          "cbwallet",
          "ledgerlive",
          "rainbow",
          "metamask",
          "trust",
          "uniswap",
          "zerion",
          "exodus",
          "oneinch",
        ],
        // Add these entries for Face ID and passkey support
        NSFaceIDUsageDescription: "We use Face ID to enable secure passkey authentication",
        "com.apple.developer.associated-domains": config.ios.associatedDomains,
      },
      // Add entitlements for passkey support
      entitlements: {
        "com.apple.developer.associated-domains": config.ios.associatedDomains,
        "com.apple.developer.authentication-services.autofill-credential-provider": true,
      },
    },
// ... existing code ...
```

The changes add:
1. `NSFaceIDUsageDescription` - Required permission message for Face ID usage
2. Associated domains in both infoPlist and entitlements for passkey support
3. Authentication services entitlement for credential provider support

Note: You'll also need to make sure these capabilities are enabled in your Apple Developer account for your app ID. You can do this in the Apple Developer Portal under Certificates, Identifiers & Profiles > Identifiers > Your App ID > Capabilities.

---

_**User**_

ok yeah just went tro previous config and here's the script we had to add the preview stuff . Just make sure that Im not missing anything in my @app.config.ts 

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
const packageJson = require("../../../package.json");

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
  appInfo.CFBundleShortVersionString = packageJson.version;
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
  // Update Expo.plist Runtime Version
  // ----------------------------------------
  const EXPO_PLIST_PATH = "ios/Converse/Supporting/Expo.plist";
  const expoPlist = plist.parse(fs.readFileSync(EXPO_PLIST_PATH, "utf8"));
  expoPlist.EXUpdatesRuntimeVersion = packageJson.version;
  const newExpoPlist = plist.build(expoPlist);
  fs.writeFileSync(EXPO_PLIST_PATH, newExpoPlist, "utf-8");

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
  entitlementsApp["com.apple.developer.associated-domains"][2] =
    entitlementsApp["com.apple.developer.associated-domains"][2].replace(
      "webcredentials:dev.converse.xyz",
      "webcredentials:preview.converse.xyz"
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

---

_**Assistant**_

Looking at both your app.config.ts and the preview configuration script, there are a few additional entitlements that should be added to your app.config.ts for complete passkey and keychain support. Here's what needs to be added:

```typescript:app.config.ts
// ... existing code ...
    ios: {
      bundleIdentifier: config.ios.bundleIdentifier,
      supportsTablet: true,
      config: {
        usesNonExemptEncryption: false,
      },
      associatedDomains: config.ios.associatedDomains,
      googleServicesFile: config.ios.googleServicesFile,
      infoPlist: {
        // ... existing LSApplicationQueriesSchemes and other entries ...
      },
      entitlements: {
        "com.apple.developer.associated-domains": config.ios.associatedDomains,
        "com.apple.developer.authentication-services.autofill-credential-provider": true,
        // Add these additional entitlements
        "com.apple.developer.applesignin": ["Default"],
        "keychain-access-groups": [`$(AppIdentifierPrefix)${config.ios.bundleIdentifier}`],
        "com.apple.security.application-groups": [`group.${config.ios.bundleIdentifier}`],
      },
    },
// ... existing code ...
```

The changes add:
1. `com.apple.developer.applesignin` - For Apple Sign In support
2. `keychain-access-groups` - For secure keychain access across app groups
3. `com.apple.security.application-groups` - For shared access between app extensions

These entitlements match what's being configured in your preview script and are necessary for full passkey, Face ID, and keychain functionality. Make sure these capabilities are also enabled in your Apple Developer Portal for all your app environments (dev, preview, and production).

---

_**User**_

but we didn'T have anything related to apple sign in??

---

_**Assistant**_

Looking at your app's configuration, you're right - I apologize for the confusion. I incorrectly assumed Apple Sign In was needed when it's not part of your authentication flow. Since you're only using passkeys with Face ID, you can remove the Apple Sign In entitlement.

Here's the correct version:

```typescript:app.config.ts
// ... existing code ...
    ios: {
      bundleIdentifier: config.ios.bundleIdentifier,
      supportsTablet: true,
      config: {
        usesNonExemptEncryption: false,
      },
      associatedDomains: config.ios.associatedDomains,
      googleServicesFile: config.ios.googleServicesFile,
      infoPlist: {
        // ... existing LSApplicationQueriesSchemes and other entries ...
      },
      entitlements: {
        "com.apple.developer.associated-domains": config.ios.associatedDomains,
        "com.apple.developer.authentication-services.autofill-credential-provider": true,
        "keychain-access-groups": [`$(AppIdentifierPrefix)${config.ios.bundleIdentifier}`],
        "com.apple.security.application-groups": [`group.${config.ios.bundleIdentifier}`],
      },
    },
// ... existing code ...
```

I've removed the `"com.apple.developer.applesignin": ["Default"]` line since it's not needed for passkey authentication. The remaining entitlements are the ones necessary for passkeys, Face ID, and keychain access.

---



---

