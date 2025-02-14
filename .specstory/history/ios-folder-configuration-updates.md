## SpecStory

## iOS Folder Configuration Updates (1/27/2025, 12:18:43 PM)

_**User**_

anything you're seeing here that is missing? that we should update iOS folder with but we don'T

---

_**Assistant**_

Looking at the preview.js script and the deployment workflow, I notice a few potential gaps in the iOS configuration that might need to be addressed:

1. The script doesn't handle the app icon badge configuration for the preview environment. We might want to add this to the Info.plist modifications:

```javascript:scripts/build/ios/preview.js
// ... existing code ...

  // Update main app Info.plist
  const appInfo = plist.parse(fs.readFileSync(PLIST_APP_PATH, "utf8"));
  appInfo.CFBundleDisplayName = "Converse PREVIEW";
  appInfo.CFBundleURLSchemes = ["converse-preview", "com.converse.preview"];
  appInfo.CFBundleURLTypes[0].CFBundleURLSchemes = [
    "converse-preview",
    "com.converse.preview",
  ];
  // Add badge configuration
  appInfo.UIApplicationSupportsIndirectInputEvents = true;
  appInfo.UIBackgroundModes = appInfo.UIBackgroundModes || [];
  if (!appInfo.UIBackgroundModes.includes("remote-notification")) {
    appInfo.UIBackgroundModes.push("remote-notification");
  }
  // ... existing code ...
```

2. The script doesn't handle the APS Environment entitlement for push notifications. We should add this to the entitlements modifications:

```javascript:scripts/build/ios/preview.js
// ... existing code ...

  // Update main app entitlements
  entitlementsApp["aps-environment"] = "development"; // For preview environment
  
  // ... existing code with other entitlements updates ...
```

3. If you're using Universal Links, you might want to ensure the associated domains are properly configured for the preview environment:

```javascript:scripts/build/ios/preview.js
// ... existing code ...

  // Update main app entitlements
  entitlementsApp["com.apple.developer.associated-domains"] = [
    "applinks:preview.converse.xyz",
    "applinks:preview.getconverse.app",
    "webcredentials:preview.converse.xyz",
    // Add any other preview-specific domains
  ];
  
  // ... existing code ...
```

These changes would ensure that:
- Push notifications are properly configured
- App icon badges work correctly
- Universal links work in the preview environment
- The APS environment is set correctly for preview builds

Would you like me to provide any additional details about these suggestions?

---

_**User**_

ok so the question is i have a app.config.ts with expo that should resolve those but i also manage an ios folder.... so do you know if when doing eas build, expo will take config from app.config.ts and apply them to ios folder or will ignore because i already have a ios folder?

---

_**Assistant**_

Ah, this is a great question! When using EAS build with a managed iOS folder, here's how it works:

1. If you have a custom iOS folder, Expo will respect most of the native configurations in your iOS folder OVER the configurations in app.config.ts. This means:
   - Your manually managed iOS configurations (Info.plist, entitlements, etc.) take precedence
   - The preview.js script modifications are necessary because they directly modify the iOS folder

2. However, some specific expo-related configurations from app.config.ts will still be applied during the build process, such as:
   - Expo SDK version
   - Expo modules configurations
   - Version and build numbers
   - Some plugin configurations

3. For your specific case:
   - The push notification entitlements
   - Universal Links
   - Badge configurations
   - Bundle ID modifications

These should all be managed through your iOS folder and the preview.js script since you're using a custom iOS folder.

This is why your preview.js script is important - it ensures these configurations are correctly set for the preview environment, regardless of what's in app.config.ts.

To avoid confusion and potential conflicts, I would recommend:
1. Document which configurations are managed where
2. Keep iOS-specific configurations in the iOS folder and preview.js
3. Use app.config.ts primarily for Expo-specific configurations and plugins

Would you like me to provide an example of what configurations should go where?

---



---

