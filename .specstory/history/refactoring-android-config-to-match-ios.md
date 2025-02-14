## SpecStory

## Refactoring Android Config to Match iOS (1/19/2025, 9:53:30 AM)

_**User**_

refactor to use same ppattern as like ios: {...} for android too

---

_**Assistant**_

I'll help you refactor the Android configuration to match the iOS pattern by moving the Android-specific settings into the `settings` configuration object. Here's how to update the code:

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
  };
  android: {
    package: string;
    googleServicesFile: string;
  };
};

const settings: Record<Environment, EnvironmentConfig> = {
  dev: {
    scheme: "converse-dev",
    ios: {
      bundleIdentifier: "com.converse.dev",
    },
    android: {
      package: "com.converse.dev",
      googleServicesFile: "./scripts/build/android/google-services/dev.json",
    },
    androidPackage: "com.converse.dev",
    appDomainConverse: "dev.converse.xyz",
    appDomainGetConverse: "dev.getconverse.app",
    appName: "Converse DEV",
    icon: "./assets/icon-preview.png",
    googleServicesFile: "./scripts/build/android/google-services/dev.json",
  },
  preview: {
    scheme: "converse-preview",
    ios: {
      bundleIdentifier: "com.converse.preview",
    },
    android: {
      package: "com.converse.preview",
      googleServicesFile: "./scripts/build/android/google-services/preview.json",
    },
    androidPackage: "com.converse.preview",
    appDomainConverse: "preview.converse.xyz",
    appDomainGetConverse: "preview.getconverse.app",
    appName: "Converse PREVIEW",
    icon: "./assets/icon-preview.png",
    googleServicesFile: "./scripts/build/android/google-services/preview.json",
  },
  prod: {
    scheme: "converse",
    ios: {
      bundleIdentifier: "com.converse.native",
    },
    android: {
      package: "com.converse.prod",
      googleServicesFile: "./scripts/build/android/google-services/production.json",
    },
    androidPackage: "com.converse.prod",
    appDomainConverse: "converse.xyz",
    appDomainGetConverse: "getconverse.app",
    appName: "Converse",
    icon: "./assets/icon.png",
    googleServicesFile: "./scripts/build/android/google-services/production.json",
  },
};

// ... existing code ...

export default ({ config: expoConfig }: ConfigContext): ExpoConfig => ({
  // ... existing code ...
  ios: {
    bundleIdentifier: config.ios.bundleIdentifier,
    supportsTablet: true,
    buildNumber: appConfig.expo.ios.buildNumber,
    config: {
      usesNonExemptEncryption: false,
    },
  },
  android: {
    versionCode: appConfig.expo.android.versionCode,
    package: config.android.package,
    googleServicesFile: config.android.googleServicesFile,
    // ... rest of android config remains the same ...
  },
  // ... existing code ...
});
```

I've made the following changes:
1. Updated the `EnvironmentConfig` type to include both `ios` and `android` objects
2. Moved the Android-specific configuration into the `android` object in each environment setting
3. Updated the config usage in the ExpoConfig to use the new structure
4. Left the legacy `androidPackage` and `googleServicesFile` fields temporarily to avoid breaking changes (these can be removed in a follow-up PR)

Note that I've kept the rest of the Android configuration (permissions, intentFilters, etc.) in the main config since those are consistent across environments.

---



---

