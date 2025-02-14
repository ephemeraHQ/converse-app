## SpecStory

## Improving TypeScript Configuration File (1/17/2025, 12:51:16 PM)

_**User**_

Make this cleaner and better

---

_**Assistant**_

I'll help make this configuration file cleaner and better organized according to the style guide. Here are the main improvements:

1. Use TypeScript types instead of `any`
2. Extract repeated environment-based configurations
3. Organize the config into logical sections
4. Add descriptive comments for better maintainability

Here's the improved version:

```typescript:app.config.ts
import { ConfigContext, ExpoConfig } from "expo/config";
import warnOnce from "warn-once";
import appBuildNumbers from "./app.json";

// Environment types
type Environment = "dev" | "preview" | "prod";
type EnvConfig = {
  name: string;
  scheme: string;
  androidPackage: string;
  appDomains: {
    converse: string;
    getConverse: string;
  };
  googleServicesPath: string;
};

// Environment configuration map
const envConfigs: Record<Environment, EnvConfig> = {
  dev: {
    name: "Converse DEV",
    scheme: "converse-dev",
    androidPackage: "com.converse.dev",
    appDomains: {
      converse: "dev.converse.xyz",
      getConverse: "dev.getconverse.app",
    },
    googleServicesPath: "./scripts/build/android/google-services/dev.json",
  },
  preview: {
    name: "Converse PREVIEW",
    scheme: "converse-preview",
    androidPackage: "com.converse.preview",
    appDomains: {
      converse: "preview.converse.xyz",
      getConverse: "preview.getconverse.app",
    },
    googleServicesPath: "./scripts/build/android/google-services/preview.json",
  },
  prod: {
    name: "Converse",
    scheme: "converse",
    androidPackage: "com.converse.prod",
    appDomains: {
      converse: "converse.xyz",
      getConverse: "getconverse.app",
    },
    googleServicesPath: "./scripts/build/android/google-services/production.json",
  },
};

// Environment detection
const env = process.env.EXPO_ENV as Environment;
const isDev = env === "dev";
const isPreview = env === "preview";
const isProduction = !isDev && !isPreview;
const currentEnv = isDev ? "dev" : isPreview ? "preview" : "prod";
const config = envConfigs[currentEnv];

// Development environment warning
warnOnce(
  isDev && !process.env.EXPO_PUBLIC_DEV_API_URI,
  "\n\n🚧 Running the app without EXPO_PUBLIC_DEV_API_URI setup\n\n"
);

// Deep link configuration
const deepLinkPaths = [
  "/dm",
  "/group-invite",
  "/group",
  "/coinbase",
  "/desktopconnect",
];

// Wallet schemes for Android manifest queries
const walletSchemes = [
  "cbwallet",
  "ledgerlive",
  "rainbow",
  "metamask",
  "trust",
  "uniswap",
  "zerion",
  "exodus",
  "oneinch",
];

export default ({ config: defaultConfig }: ConfigContext): ExpoConfig => ({
  ...defaultConfig,
  name: config.name,
  scheme: config.scheme,
  slug: "converse",
  orientation: "portrait",
  icon: isProduction ? "./assets/icon.png" : "./assets/icon-preview.png",
  userInterfaceStyle: "automatic",
  
  // ... existing code ...
  
  android: {
    versionCode: appBuildNumbers.expo.android.versionCode,
    package: config.androidPackage,
    googleServicesFile: config.googleServicesPath,
    permissions: [
      "INTERNET",
      "READ_EXTERNAL_STORAGE",
      "SYSTEM_ALERT_WINDOW",
      "VIBRATE",
      "POST_NOTIFICATIONS",
      "READ_CONTACTS",
      "RECEIVE_BOOT_COMPLETED",
      "WRITE_EXTERNAL_STORAGE",
      "WAKE_LOCK",
      "USE_FINGERPRINT",
      "USE_BIOMETRIC",
    ],
    intentFilters: [
      {
        action: "VIEW",
        category: ["DEFAULT", "BROWSABLE"],
        data: [
          { scheme: config.scheme },
          { scheme: config.androidPackage },
        ],
      },
      {
        autoVerify: true,
        action: "VIEW",
        category: ["DEFAULT", "BROWSABLE"],
        data: deepLinkPaths.flatMap((path) => [
          { scheme: "https", host: config.appDomains.getConverse, pathPrefix: path },
          { scheme: "https", host: config.appDomains.converse, pathPrefix: path },
        ]),
      },
    ],
  },
  
  plugins: [
    [
      "expo-build-properties",
      {
        android: {
          compileSdkVersion: 35,
          targetSdkVersion: 34,
          buildToolsVersion: "34.0.0",
          minSdkVersion: 26,
          manifestQueries: {
            package: ["org.toshi"],
            intent: walletSchemes.map((scheme) => ({
              action: "VIEW",
              data: {
                scheme,
                host: "*",
              },
            })),
          },
        },
      },
    ],
    // ... rest of plugins remain the same ...
  ],
  
  // ... rest of the config remains the same ...
});
```

Key improvements made:
1. Added proper TypeScript types instead of using `any`
2. Created an environment configuration map to reduce repetition and improve maintainability
3. Extracted repeated patterns into variables (deepLinkPaths, walletSchemes)
4. Simplified the environment detection logic
5. Added descriptive comments for better code organization
6. Made the intent filters and manifest queries more maintainable by using array methods
7. Removed duplicate string literals by using the config object

The code is now more type-safe, easier to maintain, and follows better programming practices while maintaining the same functionality.

---



---

