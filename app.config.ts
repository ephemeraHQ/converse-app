import { ExpoConfig } from "expo/config"
import { version } from "./package.json"

type Environment = "development" | "preview" | "production"

type EnvironmentConfig = {
  scheme: string
  androidPackage: string
  appDomainConverse: string
  appDomainGetConverse: string
  appName: string
  icon: string
  ios: {
    bundleIdentifier: string
    associatedDomains: string[]
    googleServicesFile: string
  }
  android: {
    package: string
    googleServicesFile: string
  }
  alchemyApiKey: string
}

// Type assertion for process.env to include our Expo public variables
const env = process.env as {
  EXPO_PUBLIC_ALCHEMY_API_KEY?: string
  EXPO_ENV?: string
}

const settings: Record<Environment, EnvironmentConfig> = {
  development: {
    scheme: "converse-dev",
    ios: {
      bundleIdentifier: "com.converse.dev",
      associatedDomains: [
        "applinks:dev.converse.xyz",
        "applinks:dev.getconverse.app",
        "webcredentials:dev.converse.xyz",
      ],
      googleServicesFile: "./google-services/ios/development.plist",
    },
    android: {
      package: "com.converse.dev",
      googleServicesFile: "./google-services/android/development.json",
    },
    androidPackage: "com.converse.dev",
    appDomainConverse: "dev.converse.xyz",
    appDomainGetConverse: "dev.getconverse.app",
    appName: "Converse DEV",
    icon: "./assets/icon-preview.png",
    alchemyApiKey: env.EXPO_PUBLIC_ALCHEMY_API_KEY || "",
  },
  preview: {
    scheme: "converse-preview",
    ios: {
      bundleIdentifier: "com.converse.preview",
      associatedDomains: [
        "applinks:preview.converse.xyz",
        "applinks:preview.getconverse.app",
        "webcredentials:preview.converse.xyz",
      ],
      googleServicesFile: "./google-services/ios/preview.plist",
    },
    android: {
      package: "com.converse.preview",
      googleServicesFile: "./google-services/android/preview.json",
    },
    androidPackage: "com.converse.preview",
    appDomainConverse: "preview.converse.xyz",
    appDomainGetConverse: "preview.getconverse.app",
    appName: "Converse PREVIEW",
    icon: "./assets/icon-preview.png",
    alchemyApiKey: env.EXPO_PUBLIC_ALCHEMY_API_KEY || "",
  },
  production: {
    scheme: "converse",
    ios: {
      bundleIdentifier: "com.converse.native",
      associatedDomains: [
        "applinks:converse.xyz",
        "applinks:getconverse.app",
        "webcredentials:converse.xyz",
      ],
      googleServicesFile: "./google-services/ios/production.plist",
    },
    android: {
      package: "com.converse.prod",
      googleServicesFile: "./google-services/android/production.json",
    },
    androidPackage: "com.converse.prod",
    appDomainConverse: "converse.xyz",
    appDomainGetConverse: "getconverse.app",
    appName: "Converse",
    icon: "./assets/icon.png",
    alchemyApiKey: env.EXPO_PUBLIC_ALCHEMY_API_KEY || "",
  },
}

export default (): ExpoConfig => {
  const expoEnv = (process.env.EXPO_ENV || "development") as Environment
  const config = settings[expoEnv]

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
    runtimeVersion: {
      policy: "appVersion",
    },
    updates: {
      url: "https://u.expo.dev/49a65fae-3895-4487-8e8a-5bd8bee3a401",
    },
    extra: {
      expoEnv,
      eas: {
        projectId: "49a65fae-3895-4487-8e8a-5bd8bee3a401",
      },
    },
    ios: {
      bundleIdentifier: config.ios.bundleIdentifier,
      supportsTablet: true,
      associatedDomains: config.ios.associatedDomains,
      googleServicesFile: config.ios.googleServicesFile,
      config: {
        usesNonExemptEncryption: false,
      },
      entitlements: {
        // App check stuff
        "com.apple.developer.devicecheck.appattest-environment": "production",
      },
      infoPlist: {
        LSApplicationQueriesSchemes: [
          "cbwallet",
          "rainbow",
          "metamask",
          "trust",
          "uniswap",
          "zerion",
          "exodus",
          "oneinch",
          "phantom",
          "app.phantom",
        ],
        NSAppTransportSecurity: {
          NSAllowsLocalNetworking: true, // Not sure why
        },
      },
    },
    android: {
      package: config.android.package,
      googleServicesFile: config.android.googleServicesFile,
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
        "expo-notifications",
        {
          enableBackgroundRemoteNotifications: true,
        },
      ],
      ["expo-secure-store"],
      [
        "expo-local-authentication",
        {
          faceIDPermission: "We need this to use biometrics to secure your data.",
        },
      ],
      [
        "expo-build-properties",
        {
          ios: {
            // To fix error "The Swift pod `FirebaseCoreInternal` depends upon `GoogleUtilities`,
            // which does not define modules. To opt into those targets generating module maps
            // (which is necessary to import them from Swift when building as static libraries),
            // you may set `use_modular_headers!` globally in your Podfile,
            // or specify `:modular_headers => true` for particular dependencies"
            useFrameworks: "static",
            deploymentTarget: "16.0",
          },
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
      [
        "expo-image-picker",
        {
          photosPermission: "We need this so that you can share photos from your library.",
          cameraPermission: "We need this so that you can take photos to share.",
        },
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/splash.png",
          backgroundColor: "#ffffff",
          dark: {
            image: "./assets/splash-dark.png",
            backgroundColor: "#000000",
          },
        },
      ],
      [
        "@sentry/react-native/expo",
        {
          organization: "converse-app",
          project: "convos-mobile-app",
          url: "https://sentry.io/",
        },
      ],
      ["@react-native-firebase/app"],
      ["@react-native-firebase/app-check"],
      "./scripts/android/build/android-deps-expo-plugin.js",
    ],
  }
}
