## SpecStory

## Fixing App Identifier Domain Error (2/6/2025, 9:15:20 AM)

_**User**_

getting error "Application with identifier Q6W2FLK8DM.com.converse.dev is not associated with domain dev.converse.xyz" why

---

_**Assistant**_

This error typically occurs in iOS development when there's a mismatch between your app's Associated Domains configuration and the apple-app-site-association (AASA) file on your server. Here's how to fix it:

1. Check your Xcode project configuration:
   - Ensure "Associated Domains" capability is enabled
   - Verify the domain entry is correct: `applinks:dev.converse.xyz`

2. Verify your apple-app-site-association file:
   - It should be accessible at: `https://dev.converse.xyz/.well-known/apple-app-site-association`
   - The file should contain your app's Team ID and Bundle ID
   - Example format:

```json
{
    "applinks": {
        "apps": [],
        "details": [
            {
                "appID": "Q6W2FLK8DM.com.converse.dev",
                "paths": ["*"]
            }
        ]
    }
}
```

3. Common issues to check:
   - Make sure the AASA file is served over HTTPS
   - The file should be served without a file extension
   - Content-Type should be `application/json`
   - Verify your Team ID (Q6W2FLK8DM) and Bundle ID (com.converse.dev) are correct
   - The AASA file should be accessible without any redirects

4. To test:
   - Use Apple's validation tool: https://search.developer.apple.com/appsearch-validation-tool
   - Clear your device's cache or use a new device for testing
   - Try removing and re-adding the Associated Domains capability in Xcode

Let me know if you need help with any specific part of this setup!

---

_**User**_

error happens when calling "LocalAuthentication.isEnrolledAsync();" from "import * as LocalAuthentication from "expo-local-authentication";"

---

_**Assistant**_



Ah, this is a different issue! The error you're seeing is related to biometric authentication permissions in your Expo/React Native app. Here's how to fix it:

1. First, make sure you have the proper configuration in your `app.json` or `app.config.js`:

```json:app.json
{
  "expo": {
    // ... other config
    "plugins": [
      [
        "expo-local-authentication",
        {
          "faceIDPermission": "Allow $(PRODUCT_NAME) to use Face ID."
        }
      ]
    ]
  }
}
```

2. For iOS, you also need to add the usage description in the `info.plist` section:

```json:app.json
{
  "expo": {
    // ... other config
    "ios": {
      "infoPlist": {
        "NSFaceIDUsageDescription": "This app uses Face ID/Touch ID to verify your identity."
      }
    }
  }
}
```

3. Then, when checking for biometric enrollment, it's better to first check if the hardware is available:

```typescript
import * as LocalAuthentication from 'expo-local-authentication';

async function checkBiometricAvailability() {
  try {
    // First check if hardware is available
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      return false;
    }

    // Then check if biometrics are enrolled
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return isEnrolled;
  } catch (error) {
    logger.error(`Error checking biometric availability: ${error}`);
    return false;
  }
}
```

4. If you're still getting the error, try rebuilding your app:
```bash
expo prebuild --clean
```

The error you're seeing usually means there's a permissions or configuration issue. Make sure you've properly configured the app and rebuilt it after making these changes.

---

_**User**_

oh nenvemr ind it happens when calling "signupWithPasskey" from "import { useSignupWithPasskey } from "@privy-io/expo/passkey";

---

_**Assistant**_



Ah yes, now I understand! This error occurs with Privy's Passkey implementation because there's a mismatch in the Associated Domains configuration for your app. Here's how to fix it:

1. First, configure your `app.json` or `app.config.js` with the correct Associated Domains:

```json:app.json
{
  "expo": {
    // ... other config
    "ios": {
      "bundleIdentifier": "com.converse.dev",
      "associatedDomains": ["applinks:dev.converse.xyz", "webcredentials:dev.converse.xyz"]
    }
  }
}
```

2. Make sure your apple-app-site-association (AASA) file is properly configured on your server at `https://dev.converse.xyz/.well-known/apple-app-site-association`:

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "Q6W2FLK8DM.com.converse.dev",
        "paths": ["*"]
      }
    ]
  },
  "webcredentials": {
    "apps": ["Q6W2FLK8DM.com.converse.dev"]
  }
}
```

3. After making these changes:
```bash
# Clean and rebuild your app
expo prebuild --clean
```

Key points:
- Make sure your Bundle ID matches exactly what's in your Apple Developer account
- The Team ID (Q6W2FLK8DM) should match your Apple Developer Team ID
- Both `applinks` and `webcredentials` are required for Passkeys to work properly
- The AASA file must be served over HTTPS without redirects

Let me know if you're still having issues after making these changes!

---

_**User**_

ok yeah. here's waht i have at @https://dev.converse.xyz/.well-known/apple-app-site-association 

{"applinks":{"apps":[],"details":[{"appID":"3L9E5TA22P.com.converse.dev","paths":["/dm/*","/coinbase","/mobile-wallet-protocol","/desktopconnect/*","/group/*","/group-invite/*","/poap/*"]},{"appID":"Q6W2FLK8DM.com.converse.dev","paths":["/dm/*","/coinbase","/mobile-wallet-protocol","/desktopconnect/*","/group/*","/group-invite/*","/poap/*"]}]},"webcredentials":{"apps":["Q6W2FLK8DM.com.converse.dev","3L9E5TA22P.com.converse.dev"]}}

---

_**Assistant**_

Looking at your AASA file, I notice that while it has the correct structure, it might be too restrictive with the paths for Passkey functionality. For Passkeys to work properly, you need to allow all paths (`"*"`) or specifically include the paths that Privy needs for authentication.

Here's how you should modify your AASA file:

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "3L9E5TA22P.com.converse.dev",
        "paths": ["*"]  // Changed to allow all paths
      },
      {
        "appID": "Q6W2FLK8DM.com.converse.dev",
        "paths": ["*"]  // Changed to allow all paths
      }
    ]
  },
  "webcredentials": {
    "apps": [
      "Q6W2FLK8DM.com.converse.dev",
      "3L9E5TA22P.com.converse.dev"
    ]
  }
}
```

The key changes are:
1. Replaced the specific path list with `["*"]` to allow all paths
2. Maintained both app IDs but made them less restrictive

After updating the AASA file:
1. Make sure it's being served with the correct content type (`application/json`)
2. Verify it's accessible via HTTPS without redirects
3. You might need to wait a few hours for Apple's CDN to cache the new configuration
4. Try testing the Passkey functionality again

Let me know if you're still experiencing issues after making these changes!

---

_**User**_

ok one thing i notice. so previously i wasn't using expo prebuild ios. I had my own ios folder. not that I delted my ios folder i want to only use @app.config.ts 

I also add those scripts to add values to ios @preview.js @production.js  and i guess by default no dev.js because dev was using default dev values.

Can. you make sure I'm not missing anything in my @app.config.ts ?



---

_**Assistant**_

Looking at your build scripts and app.config.ts, I'll help you consolidate the iOS configuration into app.config.ts. Here's what needs to be added:

```typescript:app.config.ts
// ... existing code ...

type EnvironmentConfig = {
  scheme: string;
  androidPackage: string;
  appDomainConverse: string;
  appDomainGetConverse: string;
  appName: string;
  icon: string;
  googleServicesFile: string;
  ios: {
    bundleIdentifier: string;
    // Add these new fields
    keychainAccessGroup: string;
    applicationGroup: string;
    displayName: string;
    urlSchemes: string[];
    associatedDomains: string[];
  };
  android: {
    // ... existing android config ...
  };
};

const settings: Record<Environment, EnvironmentConfig> = {
  development: {
    // ... existing dev config ...
    ios: {
      bundleIdentifier: "com.converse.dev",
      keychainAccessGroup: "com.converse.dev",
      applicationGroup: "group.com.converse.dev",
      displayName: "Converse DEV",
      urlSchemes: ["converse-dev", "com.converse.dev"],
      associatedDomains: [
        "applinks:dev.converse.xyz",
        "applinks:dev.getconverse.app",
        "webcredentials:dev.converse.xyz"
      ],
    },
    // ... rest of dev config ...
  },
  preview: {
    // ... existing preview config ...
    ios: {
      bundleIdentifier: "com.converse.preview",
      keychainAccessGroup: "com.converse.preview",
      applicationGroup: "group.com.converse.preview",
      displayName: "Converse PREVIEW",
      urlSchemes: ["converse-preview", "com.converse.preview"],
      associatedDomains: [
        "applinks:preview.converse.xyz",
        "applinks:preview.getconverse.app",
        "webcredentials:preview.converse.xyz"
      ],
    },
    // ... rest of preview config ...
  },
  production: {
    // ... existing production config ...
    ios: {
      bundleIdentifier: "com.converse.native",
      keychainAccessGroup: "com.converse.native",
      applicationGroup: "group.com.converse.native",
      displayName: "Converse",
      urlSchemes: ["converse", "com.converse.native"],
      associatedDomains: [
        "applinks:converse.xyz",
        "applinks:getconverse.app",
        "webcredentials:converse.xyz"
      ],
    },
    // ... rest of production config ...
  },
};

export default (): ExpoConfig => {
  const expoEnv = (process.env.EXPO_ENV || "development") as Environment;
  const config = settings[expoEnv];

  return {
    // ... existing config ...
    ios: {
      bundleIdentifier: config.ios.bundleIdentifier,
      supportsTablet: true,
      config: {
        usesNonExemptEncryption: false,
      },
      // Add these new configurations
      associatedDomains: config.ios.associatedDomains,
      entitlements: {
        "keychain-access-groups": [`$(AppIdentifierPrefix)${config.ios.keychainAccessGroup}`],
        "com.apple.security.application-groups": [config.ios.applicationGroup],
        "com.apple.developer.associated-domains": config.ios.associatedDomains,
      },
      infoPlist: {
        CFBundleDisplayName: config.ios.displayName,
        CFBundleURLTypes: [{
          CFBundleURLSchemes: config.ios.urlSchemes
        }],
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
      },
    },
    // ... rest of config ...
  };
};
```

Key changes:
1. Added iOS-specific configuration fields to the `EnvironmentConfig` type
2. Added corresponding values for each environment
3. Added entitlements configuration in the ExpoConfig
4. Added URL schemes and display name configuration
5. Maintained associated domains configuration for universal links and passkeys

After these changes, you should be able to remove the iOS build scripts since all the configuration will be handled by Expo's prebuild process. Make sure to:

1. Run `expo prebuild --clean` after making these changes
2. Test universal links and passkeys in each environment
3. Verify that the keychain access groups and app groups are working correctly

Let me know if you need any clarification or run into issues!

---

_**User**_

do i really need "urlSchemes" ? or expo already handles that or IDK?

---

_**Assistant**_

The `urlSchemes` configuration is important to keep because:

1. It enables deep linking to your app using custom URL schemes (e.g., `converse://`)
2. It's used for authentication flows (like wallet connections)
3. It's separate from the `scheme` property in the root config which Expo uses for its own purposes

Looking at your app.config.ts, you already have these URL schemes defined in two places:

1. In the root `scheme` property:
```typescript:app.config.ts
// ... existing code ...
return {
  scheme: config.scheme,  // This is used by Expo
  // ...
}
```

2. In the Android intent filters:
```typescript:app.config.ts
android: {
  intentFilters: [
    {
      action: "VIEW",
      category: ["DEFAULT", "BROWSABLE"],
      data: [
        { scheme: config.scheme },
        { scheme: config.androidPackage }
      ],
    },
    // ...
  ]
}
```

For consistency and to ensure all deep linking scenarios work correctly, you should keep the `urlSchemes` in the iOS config as well:

```typescript:app.config.ts
ios: {
  // ... other iOS config ...
  infoPlist: {
    CFBundleURLTypes: [{
      CFBundleURLSchemes: [config.scheme, config.ios.bundleIdentifier]
    }],
    // ... other infoPlist settings ...
  },
}
```

This ensures that:
1. Your app can be opened via `converse://` links
2. Wallet connections work properly
3. Deep linking is consistent across iOS and Android

So yes, you should keep the URL schemes configuration!

---

_**User**_

but why we have "scheme" AND urlSchemes for ioS?

---

_**Assistant**_



The `scheme` and `urlSchemes` serve different purposes:

1. `scheme` (root level):
```typescript:app.config.ts
export default (): ExpoConfig => ({
  scheme: config.scheme,  // e.g., "converse-dev"
  // ...
})
```
- This is Expo's default scheme used for Expo-specific features
- Used by Expo development client and updates
- Single scheme that Expo uses as the primary deep link scheme

2. `urlSchemes` (iOS specific):
```typescript:app.config.ts
ios: {
  infoPlist: {
    CFBundleURLTypes: [{
      CFBundleURLSchemes: [config.scheme, config.ios.bundleIdentifier]
    }],
  }
}
```
- These are additional URL schemes your app can handle
- Often needed for third-party integrations (like wallet connections)
- Can include multiple schemes
- iOS-specific configuration

However, you're right that in your case, it looks like there's duplication since you're including `config.scheme` in both places. You could simplify by removing it from `urlSchemes` and just keep the bundle identifier:

```typescript:app.config.ts
ios: {
  infoPlist: {
    CFBundleURLTypes: [{
      CFBundleURLSchemes: [config.ios.bundleIdentifier]  // Just keep this one
    }],
  }
}
```

Since Expo will automatically handle registering the primary `scheme` for deep linking, you probably don't need to duplicate it in `urlSchemes`. The bundle identifier scheme is still useful for third-party integrations.

---

_**User**_

here's the data for @https://dev.converse.xyz/.well-known/apple-app-site-association  "

It seems wrong no?

{"applinks":{"apps":[],"details":[{"appID":"3L9E5TA22P.com.converse.dev","paths":["/dm/*","/coinbase","/mobile-wallet-protocol","/desktopconnect/*","/group/*","/group-invite/*","/poap/*"]},{"appID":"Q6W2FLK8DM.com.converse.dev","paths":["/dm/*","/coinbase","/mobile-wallet-protocol","/desktopconnect/*","/group/*","/group-invite/*","/poap/*"]}]},"webcredentials":{"apps":["Q6W2FLK8DM.com.converse.dev","3L9E5TA22P.com.converse.dev"]}}

---

_**Assistant**_

Yes, there are a few potential issues with your AASA file:

1. **Multiple Team IDs**: You have two different team IDs (`3L9E5TA22P` and `Q6W2FLK8DM`) for the same bundle identifier. You should only use the team ID that matches your Apple Developer account.

2. **Restrictive Paths**: For Passkey functionality (which uses `webcredentials`), you might need less restrictive paths in the `applinks` section. The current paths are very specific:
```json
"paths": [
    "/dm/*",
    "/coinbase",
    "/mobile-wallet-protocol",
    "/desktopconnect/*",
    "/group/*",
    "/group-invite/*",
    "/poap/*"
]
```

Here's how the AASA file should look:

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "Q6W2FLK8DM.com.converse.dev",
        "paths": ["*"]
      }
    ]
  },
  "webcredentials": {
    "apps": ["Q6W2FLK8DM.com.converse.dev"]
  }
}
```

Key changes:
1. Removed the duplicate team ID entry
2. Simplified paths to `["*"]` to ensure Passkey functionality works
3. Kept only one team ID in `webcredentials`

Make sure:
1. `Q6W2FLK8DM` is your actual Apple Developer Team ID
2. The file is served with `Content-Type: application/json`
3. It's accessible via HTTPS without redirects

After updating the AASA file, it might take a few hours for Apple's CDN to cache the new configuration.

---



---

