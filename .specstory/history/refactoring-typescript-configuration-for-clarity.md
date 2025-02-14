## SpecStory

## Refactoring TypeScript Configuration for Clarity (1/19/2025, 9:12:32 AM)

_**User**_

what would you do to makae it cleaner

---

_**Assistant**_

I'll suggest some improvements to make the code cleaner and more maintainable while following the style guide. Here are the key changes:

1. Split the environment configurations into a separate file
2. Use TypeScript's satisfies operator for better type safety
3. Improve type naming according to the style guide
4. Add some descriptive comments
5. Group related configurations together

Here's how we can refactor it:

First, create a new file `config/environment.ts`:

```typescript:config/environment.ts
// Environment configuration types and settings
type IEnvironment = "dev" | "preview" | "prod";

type IEnvironmentConfig = {
  scheme: string;
  androidPackage: string;
  appDomainConverse: string;
  appDomainGetConverse: string;
  appName: string;
  icon: string;
  googleServicesFile: string;
};

// Environment-specific configuration settings
export const settings = {
  dev: {
    scheme: "converse-dev",
    androidPackage: "com.converse.dev",
    appDomainConverse: "dev.converse.xyz",
    appDomainGetConverse: "dev.getconverse.app",
    appName: "Converse DEV",
    icon: "./assets/icon-preview.png",
    googleServicesFile: "./scripts/build/android/google-services/dev.json",
  },
  preview: {
    scheme: "converse-preview",
    androidPackage: "com.converse.preview",
    appDomainConverse: "preview.converse.xyz",
    appDomainGetConverse: "preview.getconverse.app",
    appName: "Converse PREVIEW",
    icon: "./assets/icon-preview.png",
    googleServicesFile: "./scripts/build/android/google-services/preview.json",
  },
  prod: {
    scheme: "converse",
    androidPackage: "com.converse.prod",
    appDomainConverse: "converse.xyz",
    appDomainGetConverse: "getconverse.app",
    appName: "Converse",
    icon: "./assets/icon.png",
    googleServicesFile: "./scripts/build/android/google-services/production.json",
  },
} satisfies Record<IEnvironment, IEnvironmentConfig>;

export type { IEnvironment, IEnvironmentConfig };
```

Then update the main config file:

```typescript:app.config.ts
import { ConfigContext, ExpoConfig } from "expo/config";
import appConfig from "./app.json";
import { settings, IEnvironment } from "./config/environment";

// Get current environment from process.env or default to prod
const currentEnv = (process.env.EXPO_ENV as IEnvironment) ?? "prod";
const config = settings[currentEnv];

if (!config) {
  throw new Error(
    `Invalid EXPO_ENV value: "${currentEnv}". Must be one of: dev, preview, prod`
  );
}

// Main Expo configuration
export default ({ config: expoConfig }: ConfigContext): ExpoConfig => ({
  ...expoConfig,
  
  // Basic app configuration
  name: config.appName,
  scheme: config.scheme,
  slug: "converse",
  orientation: "portrait",
  icon: config.icon,
  userInterfaceStyle: "automatic",
  version: appConfig.expo.version,
  runtimeVersion: appConfig.expo.version,
  owner: "converse",
  jsEngine: "hermes",
  assetBundlePatterns: ["**/*"],

  // Updates configuration
  updates: {
    fallbackToCacheTimeout: 0,
    url: "https://u.expo.dev/49a65fae-3895-4487-8e8a-5bd8bee3a401",
  },

  // Extra configuration
  extra: {
    eas: {
      projectId: "49a65fae-3895-4487-8e8a-5bd8bee3a401",
    },
    ENV: currentEnv,
  },

  // Platform-specific configurations
  ios: {
    supportsTablet: true,
    buildNumber: appConfig.expo.ios.buildNumber,
    config: {
      usesNonExemptEncryption: false,
    },
  },

  android: {
    // ... existing android config ...
  },

  // ... rest of the existing config ...
}) satisfies ExpoConfig;
```

Key improvements made:

1. Separated environment configurations into a dedicated file for better organization
2. Used TypeScript's `satisfies` operator for better type safety
3. Renamed types to follow the style guide (prefixed with 'I')
4. Added descriptive comments to explain configuration sections
5. Grouped related configurations together
6. Made the code more maintainable by splitting it into logical sections

The Android configuration and plugins sections remain the same but are now part of a more organized structure. You could further split these into separate configuration files if desired, but that might be overkill for this use case.

Would you like me to show how to split out any other sections of the configuration?

---



---

