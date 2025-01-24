import { ExpoConfig } from "expo/config";
import { version } from "./package.json";

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

type Environment = "dev" | "preview" | "prod";

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
      googleServicesFile:
        "./scripts/build/android/google-services/preview.json",
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
      googleServicesFile:
        "./scripts/build/android/google-services/production.json",
    },
    androidPackage: "com.converse.prod",
    appDomainConverse: "converse.xyz",
    appDomainGetConverse: "getconverse.app",
    appName: "Converse",
    icon: "./assets/icon.png",
    googleServicesFile:
      "./scripts/build/android/google-services/production.json",
  },
};

export default (): ExpoConfig => {
  const environment = (process.env.EXPO_ENV || "dev") as Environment;
  const config = settings[environment];

  return {
    name: config.appName,
    scheme: config.scheme,
    owner: "converse",
    slug: "converse",
    orientation: "portrait",
    icon: config.icon,
    userInterfaceStyle: "automatic",
    version: version,
    assetBundlePatterns: ["**/*"],
    updates: {
      fallbackToCacheTimeout: 0,
      url: "https://u.expo.dev/49a65fae-3895-4487-8e8a-5bd8bee3a401",
    },
    runtimeVersion: version,
    ios: {
      // bundleIdentifier: config.ios.bundleIdentifier, // Not needed since we have ios folder already specifying it
      supportsTablet: true,
      config: {
        usesNonExemptEncryption: false,
      },
    },
    extra: {
      eas: {
        projectId: "49a65fae-3895-4487-8e8a-5bd8bee3a401",
      },
    },
    android: {
      package: config.android.package,
      googleServicesFile: config.android.googleServicesFile,
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
          data: [{ scheme: config.scheme }, { scheme: config.androidPackage }],
        },
        {
          autoVerify: true,
          action: "VIEW",
          category: ["DEFAULT", "BROWSABLE"],
          data: [
            {
              scheme: "https",
              host: config.appDomainGetConverse,
              pathPrefix: "/dm",
            },
            {
              scheme: "https",
              host: config.appDomainConverse,
              pathPrefix: "/dm",
            },
            {
              scheme: "https",
              host: config.appDomainGetConverse,
              pathPrefix: "/group-invite",
            },
            {
              scheme: "https",
              host: config.appDomainConverse,
              pathPrefix: "/group-invite",
            },
            {
              scheme: "https",
              host: config.appDomainGetConverse,
              pathPrefix: "/group",
            },
            {
              scheme: "https",
              host: config.appDomainConverse,
              pathPrefix: "/group",
            },
            {
              scheme: "https",
              host: config.appDomainGetConverse,
              pathPrefix: "/coinbase",
            },
            {
              scheme: "https",
              host: config.appDomainConverse,
              pathPrefix: "/coinbase",
            },
            {
              scheme: "https",
              host: config.appDomainGetConverse,
              pathPrefix: "/desktopconnect",
            },
            {
              scheme: "https",
              host: config.appDomainConverse,
              pathPrefix: "/desktopconnect",
            },
          ],
        },
      ],
    },
    plugins: [
      [
        // Configure Android build properties and SDK versions
        "expo-build-properties",
        {
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 34,
            buildToolsVersion: "34.0.0",
            minSdkVersion: 26,
            manifestQueries: {
              // Required for Coinbase Wallet integration
              package: ["org.toshi"],
              // Define supported wallet deep links that our app can open
              // This allows Android to show our app as an option when users click wallet links
              intent: [
                {
                  action: "VIEW",
                  data: {
                    scheme: "cbwallet",
                    host: "*",
                  },
                },
                {
                  action: "VIEW",
                  data: {
                    scheme: "ledgerlive",
                    host: "*",
                  },
                },
                {
                  action: "VIEW",
                  data: {
                    scheme: "rainbow",
                    host: "*",
                  },
                },
                {
                  action: "VIEW",
                  data: {
                    scheme: "metamask",
                    host: "*",
                  },
                },
                {
                  action: "VIEW",
                  data: {
                    scheme: "trust",
                    host: "*",
                  },
                },
                {
                  action: "VIEW",
                  data: {
                    scheme: "uniswap",
                    host: "*",
                  },
                },
                {
                  action: "VIEW",
                  data: {
                    scheme: "zerion",
                    host: "*",
                  },
                },
                {
                  action: "VIEW",
                  data: {
                    scheme: "exodus",
                    host: "*",
                  },
                },
                {
                  action: "VIEW",
                  data: {
                    scheme: "oneinch",
                    host: "*",
                  },
                },
              ],
            },
          },
        },
      ],
      "expo-secure-store",
      [
        "expo-splash-screen",
        {
          image: "./assets/splash.png",
          backgroundColor: "#ffffff",
          dark: {
            image: "./assets/splash-dark.png",
            backgroundColor: "#000000",
          },
          imageWidth: 300,
        },
      ],
      "expo-secure-store",
      [
        "@sentry/react-native/expo",
        {
          organization: "converse-app",
          project: "converse-react-native",
          url: "https://sentry.io/",
        },
      ],
      ["@react-native-firebase/app-check"],
      "./scripts/build/android/notifeeExpoPlugin.js", // See https://github.com/invertase/notifee/issues/350
      "./scripts/build/android/androidDependenciesExpoPlugin.js", // Handle some conflicting dependencies manually
      "./scripts/build/android/buildGradleProperties.js", // Increase memory for building android in EAS
    ],
  };
};
