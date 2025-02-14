## SpecStory

## Reviewing Missing Info.plist Settings (2/6/2025, 8:36:42 AM)

_**User**_

do you see any missing settings base on what i have in this info.plist? 



---

_**Assistant**_

Looking at your Info.plist and comparing it with common requirements for modern iOS apps, here are a few potentially missing settings you might want to consider:

1. **Privacy - Location Usage Descriptions** - If you plan to use location services:
```plist:ios/Converse/Info.plist
// ... existing code ...
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need this to show relevant content based on your location.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>We need this to show relevant content based on your location even when the app is in background.</string>
// ... existing code ...
```

2. **Push Notifications** - If you plan to use push notifications:
```plist:ios/Converse/Info.plist
// ... existing code ...
<key>UIBackgroundModes</key>
<array>
    <string>fetch</string>
    <string>remote-notification</string>
</array>
// ... existing code ...
```

3. **Universal Links** - Since you have deep linking configured in your app.config.ts, you might want to add associated domains:
```plist:ios/Converse/Info.plist
// ... existing code ...
<key>com.apple.developer.associated-domains</key>
<array>
    <string>applinks:dev.getconverse.app</string>
    <string>applinks:dev.converse.xyz</string>
    <string>applinks:preview.getconverse.app</string>
    <string>applinks:preview.converse.xyz</string>
    <string>applinks:getconverse.app</string>
    <string>applinks:converse.xyz</string>
</array>
// ... existing code ...
```

4. **Media Library Usage** - If you plan to access media files:
```plist:ios/Converse/Info.plist
// ... existing code ...
<key>NSAppleMusicUsageDescription</key>
<string>We need this to allow you to share media files.</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>We need this to save photos to your library.</string>
// ... existing code ...
```

5. **Local Network Usage** - If your app needs to discover or connect to local network devices:
```plist:ios/Converse/Info.plist
// ... existing code ...
<key>NSLocalNetworkUsageDescription</key>
<string>We need this to discover and connect to nearby devices.</string>
<key>NSBonjourServices</key>
<array>
    <string>_bonjour._tcp</string>
    <string>_lnp._tcp</string>
</array>
// ... existing code ...
```

Note that you should only add these settings if your app actually needs these permissions. Adding unnecessary permission requests can lead to App Store rejection or poor user experience.

---

_**User**_

no but what i want you to do is look at the info.plist data i just sent you and compare it with what my @app.config.ts will generate. Am i missing anything in my @app.config.ts ?

---

_**Assistant**_

Ah, I apologize for the misunderstanding. Let me compare your app.config.ts with the Info.plist to identify what might be missing in the app.config.ts configuration:

```typescript:app.config.ts
// ... existing code ...
return {
  // ... existing code ...
  ios: {
    bundleIdentifier: config.ios.bundleIdentifier,
    supportsTablet: true,
    config: {
      usesNonExemptEncryption: false,
    },
    // Add these missing configurations:
    infoPlist: {
      LSMinimumSystemVersion: "12.0",
      AppGroup: "group.$(PRODUCT_BUNDLE_IDENTIFIER)",
      AppGroupName: "group.$(PRODUCT_BUNDLE_IDENTIFIER)",
      CADisableMinimumFrameDurationOnPhone: true,
      NSCameraUsageDescription: "We need this so that you can take photos to share.",
      NSPhotoLibraryUsageDescription: "We need this so that you can share photos from your library.",
      NSContactsUsageDescription: "We need this to suggest contacts you know.",
      NSFaceIDUsageDescription: "We need this to use biometrics to secure your data.",
      NSMicrophoneUsageDescription: "We need this to record audio messages.",
      NSUserActivityTypes: ["INSendMessageIntent"],
      OSLogPreferences: {
        "Enable-Private-Data": true
      },
      UIBackgroundModes: ["fetch"],
      UIRequiresFullScreen: false,
      UIStatusBarStyle: "UIStatusBarStyleDefault",
      UIViewControllerBasedStatusBarAppearance: false,
      LSApplicationQueriesSchemes: [
        "cbwallet",
        "ledgerlive",
        "rainbow",
        "metamask",
        "trust",
        "uniswap",
        "zerion",
        "exodus",
        "oneinch"
      ]
    }
  },
  // ... existing code ...
```

The main differences I noticed:
1. Most of the Info.plist configurations are missing from your app.config.ts
2. The wallet deep linking configurations are defined in the android section but not in iOS
3. Various iOS-specific settings like camera permissions, background modes, and status bar configurations are not defined in the Expo config

These settings in app.config.ts will help ensure that the generated Info.plist matches your current one. Note that some of these settings might already be handled by Expo's default configuration or by plugins you're using, but it's safer to explicitly define them if they're important for your app's functionality.

---

_**User**_

but do i really need all thses? Or a lot are alrteady added by default by expo ? and also maybe i wnat to use plugins instead of directly putting in infoPlist:{} ?

---

_**Assistant**_



You're right - I apologize for suggesting to add everything directly to infoPlist. Let's analyze what's actually needed:

1. Many settings are indeed added by default by Expo or through plugins you already have:
- Camera/Photo permissions are handled by the image picker functionality in Expo
- FaceID is handled by `expo-secure-store` (which you already have in plugins)
- Background fetch and notifications can be handled by specific Expo plugins

2. You're already using several plugins that handle their own configurations:
- `expo-splash-screen`
- `expo-secure-store`
- `@sentry/react-native/expo`
- `@react-native-firebase/app-check`

The main things that might need attention in your app.config.ts are:

```typescript:app.config.ts
// ... existing code ...
return {
  // ... existing code ...
  ios: {
    bundleIdentifier: config.ios.bundleIdentifier,
    supportsTablet: true,
    config: {
      usesNonExemptEncryption: false,
    },
    // Add only what's not handled by plugins:
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
        "oneinch"
      ]
    }
  },
  // ... existing code ...
```

The main addition needed is the `LSApplicationQueriesSchemes` for wallet deep linking support, as this is specific to your app's functionality and isn't handled by any plugin.

For other functionality, you might want to consider using official Expo plugins instead of direct Info.plist modifications:
- For contacts: `expo-contacts`
- For background tasks: `expo-background-fetch`
- For biometrics: `expo-local-authentication`

Would you like me to suggest specific plugins for any particular functionality you need?

---

_**User**_

what does "LSApplicationQueriesSchemes" do?

---

_**Assistant**_

`LSApplicationQueriesSchemes` is an iOS-specific setting that declares which external app URL schemes your app wants to query or open. It's essentially a whitelist of other apps that your app wants to interact with via deep linking.

In your case, it's specifically used to allow your app to check if various wallet apps are installed on the user's device and open them. For example:
- `cbwallet` for Coinbase Wallet
- `metamask` for MetaMask
- `rainbow` for Rainbow Wallet
- etc.

Without declaring these schemes in `LSApplicationQueriesSchemes`, iOS will:
1. Not allow your app to check if these wallet apps are installed (using `canOpenURL`)
2. Not allow your app to open these wallet apps (using `openURL`)

I notice you already have this properly configured in your Android setup through the `manifestQueries` in your app.config.ts:

```typescript:app.config.ts
android: {
  // ... existing code ...
  manifestQueries: {
    intent: [
      {
        action: "VIEW",
        data: {
          scheme: "cbwallet",
          host: "*",
        },
      },
      // ... other wallet schemes ...
    ],
  },
}
```

So adding `LSApplicationQueriesSchemes` to your iOS configuration would be the iOS equivalent of this Android configuration, ensuring consistent wallet connectivity behavior across both platforms.

---

_**User**_

perfect added! This is what "expo prebuild ios" gives me for info.plist so compare it with what i previously had please:

<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>CADisableMinimumFrameDurationOnPhone</key>
    <true/>
    <key>CFBundleAllowMixedLocalizations</key>
    <true/>
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
    <key>CFBundleDisplayName</key>
    <string>Converse DEV</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>$(PRODUCT_NAME)</string>
    <key>CFBundlePackageType</key>
    <string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
    <key>CFBundleShortVersionString</key>
    <string>2.2.10</string>
    <key>CFBundleSignature</key>
    <string>????</string>
    <key>CFBundleURLTypes</key>
    <array>
      <dict>
        <key>CFBundleURLSchemes</key>
        <array>
          <string>converse-dev</string>
          <string>com.converse.dev</string>
        </array>
      </dict>
      <dict>
        <key>CFBundleURLSchemes</key>
        <array>
          <string>exp+converse</string>
        </array>
      </dict>
    </array>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>ITSAppUsesNonExemptEncryption</key>
    <false/>
    <key>LSMinimumSystemVersion</key>
    <string>12.0</string>
    <key>LSRequiresIPhoneOS</key>
    <true/>
    <key>NSAppTransportSecurity</key>
    <dict>
      <key>NSAllowsArbitraryLoads</key>
      <false/>
      <key>NSAllowsLocalNetworking</key>
      <true/>
    </dict>
    <key>NSCameraUsageDescription</key>
    <string>Allow $(PRODUCT_NAME) to access your camera</string>
    <key>NSContactsUsageDescription</key>
    <string>Allow $(PRODUCT_NAME) to access your contacts</string>
    <key>NSFaceIDUsageDescription</key>
    <string>Allow $(PRODUCT_NAME) to access your Face ID biometric data.</string>
    <key>NSMicrophoneUsageDescription</key>
    <string>Allow $(PRODUCT_NAME) to access your microphone</string>
    <key>NSPhotoLibraryUsageDescription</key>
    <string>Allow $(PRODUCT_NAME) to access your photos</string>
    <key>UIBackgroundModes</key>
    <array>
      <string>fetch</string>
    </array>
    <key>UILaunchStoryboardName</key>
    <string>SplashScreen</string>
    <key>UIRequiredDeviceCapabilities</key>
    <array>
      <string>arm64</string>
    </array>
    <key>UIRequiresFullScreen</key>
    <false/>
    <key>UIStatusBarStyle</key>
    <string>UIStatusBarStyleDefault</string>
    <key>UISupportedInterfaceOrientations</key>
    <array>
      <string>UIInterfaceOrientationPortrait</string>
      <string>UIInterfaceOrientationPortraitUpsideDown</string>
    </array>
    <key>UISupportedInterfaceOrientations~ipad</key>
    <array>
      <string>UIInterfaceOrientationPortrait</string>
      <string>UIInterfaceOrientationPortraitUpsideDown</string>
      <string>UIInterfaceOrientationLandscapeLeft</string>
      <string>UIInterfaceOrientationLandscapeRight</string>
    </array>
    <key>UIUserInterfaceStyle</key>
    <string>Automatic</string>
    <key>UIViewControllerBasedStatusBarAppearance</key>
    <false/>
  </dict>
</plist>

---

_**Assistant**_

Comparing the generated Info.plist from `expo prebuild ios` with your previous one, here are the key differences:

1. **Added in prebuild (not in your original):**
```plist
<key>CFBundleAllowMixedLocalizations</key>
<true/>
```

2. **Different permission descriptions:**
- The prebuild uses more generic descriptions with `$(PRODUCT_NAME)`:
```plist
<key>NSCameraUsageDescription</key>
<string>Allow $(PRODUCT_NAME) to access your camera</string>
```
vs. your original more specific descriptions:
```plist
<key>NSCameraUsageDescription</key>
<string>We need this so that you can take photos to share.</string>
```

3. **Missing from prebuild (were in your original):**
```plist
<key>AppGroup</key>
<string>group.$(PRODUCT_BUNDLE_IDENTIFIER)</string>
<key>AppGroupName</key>
<string>group.$(PRODUCT_BUNDLE_IDENTIFIER)</string>
<key>LSApplicationQueriesSchemes</key>
<array>
  <string>cbwallet</string>
  <string>ledgerlive</string>
  <!-- ... other wallet schemes ... -->
</array>
<key>NSUserActivityTypes</key>
<array>
  <string>INSendMessageIntent</string>
</array>
```

4. **Different URL scheme structure:**
- Prebuild separates URL schemes into multiple dictionaries and adds `exp+converse`
- Your original had them combined in one dictionary

The main things you need to add back to your app.config.ts are:

```typescript:app.config.ts
ios: {
  // ... existing config ...
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
    // Add if you need app groups functionality
    AppGroup: "group.$(PRODUCT_BUNDLE_IDENTIFIER)",
    AppGroupName: "group.$(PRODUCT_BUNDLE_IDENTIFIER)",
    // Add if you need Siri intents
    NSUserActivityTypes: ["INSendMessageIntent"],
  },
}
```

Everything else is either already handled by Expo or its plugins, or is automatically generated during the prebuild process.

---

_**User**_

we use "import * as ImagePicker from "expo-image-picker";" for picking media and videos so pleaes add the correct string in the expo plugin config so that when we ask for permissions it's not genertic string

---

_**Assistant**_

Yes! For `expo-image-picker`, we can customize the permission strings through the plugin configuration. Here's how to add it to your app.config.ts:

```typescript:app.config.ts
// ... existing code ...
    plugins: [
      // ... other plugins ...
      [
        "expo-image-picker",
        {
          photosPermission: "We need this so that you can share photos from your library.",
          cameraPermission: "We need this so that you can take photos to share."
        }
      ],
      // ... other plugins ...
    ],
```

This will replace the generic "Allow $(PRODUCT_NAME) to access your camera/photos" with your custom messages. The plugin will handle adding these to the Info.plist during the prebuild process.

You can remove these from the `infoPlist` section if you had them there since the plugin will manage them.

---

_**User**_

i see we also use "expo-background-fetch" should we add anything in the @app.config.ts about that?

---

_**Assistant**_



Yes! For `expo-background-fetch`, we should ensure that the background fetch capability is properly configured. However, looking at your app.config.ts, you already have the necessary configuration through the iOS background modes:

```typescript:app.config.ts
ios: {
  // ... existing config ...
  infoPlist: {
    // ... other settings ...
    UIBackgroundModes: ["fetch"]  // This is already handled by Expo's default configuration
  }
}
```

The `UIBackgroundModes` with `fetch` is already being added by Expo during prebuild, as we can see in the generated Info.plist:

```plist
<key>UIBackgroundModes</key>
<array>
  <string>fetch</string>
</array>
```

So in this case, no additional configuration is needed in app.config.ts for `expo-background-fetch` to work properly. Expo handles this configuration automatically when the package is installed.

---

_**User**_

For the code present, we get this error:
```
No overload matches this call.
  Overload 1 of 2, '(options: FirebaseAppOptions, config?: FirebaseAppConfig | undefined): Promise<FirebaseApp>', gave the following error.
    Argument of type '{}' is not assignable to parameter of type 'FirebaseAppOptions'.
      Type '{}' is missing the following properties from type 'FirebaseAppOptions': appId, projectId
  Overload 2 of 2, '(options: FirebaseAppOptions, name?: string | undefined): Promise<FirebaseApp>', gave the following error.
    Argument of type '{}' is not assignable to parameter of type 'FirebaseAppOptions'.
      Type '{}' is missing the following properties from type 'FirebaseAppOptions': appId, projectId
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_



You need to provide Firebase configuration options. Since you already have `googleServicesFile` in your config, Firebase should auto-configure from that file. Remove the empty object:

```typescript:utils/appCheck.ts
// ... existing code ...
    logger.debug("Initializing Firebase...");
    firebase.initializeApp();  // Remove the empty object
// ... existing code ...
```

This will let Firebase use the configuration from your google-services.json/GoogleService-Info.plist files that are specified in your app.config.ts.

---

_**User**_

no, it requires config

---

_**Assistant**_



You'll need to add the Firebase config. Create a config file and import it:

```typescript:utils/appCheck.ts
import { config } from "@/config";

// ... existing code ...
logger.debug("Initializing Firebase...");
firebase.initializeApp({
  appId: config.firebase.appId,
  projectId: config.firebase.projectId,
});
```

And make sure to add these Firebase config values to your config file for each environment (development, preview, production).

Would you like me to show how to structure the config file as well?

---



---

