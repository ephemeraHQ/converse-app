const { mergeConfig } = require("@react-native/metro-config")
const { getSentryExpoConfig } = require("@sentry/react-native/metro")

const defaultConfig = getSentryExpoConfig(__dirname)

// Privy requires this https://docs.privy.io/guide/expo/setup/passkey#_1-set-up-your-build-configuration
const resolveRequestWithPackageExports = (context, moduleName, platform) => {
  if (moduleName.startsWith("@privy-io/")) {
    const ctx = {
      ...context,
      unstable_enablePackageExports: true,
    }
    return ctx.resolveRequest(ctx, moduleName, platform)
  }

  return context.resolveRequest(context, moduleName, platform)
}

const metroConfig = {
  ...defaultConfig,
  resolver: {
    ...defaultConfig.resolver,
    resolveRequest: resolveRequestWithPackageExports,
    sourceExts: [
      ...defaultConfig.resolver.sourceExts,
      // Support .mjs files (required for Expo 49 compatibility)
      "mjs",
    ],
    // Needed for thirdweb
    unstable_enablePackageExports: true,
    // Needed for thirdweb
    unstable_conditionNames: ["react-native", "browser", "require"],
  },
}

module.exports = metroConfig
