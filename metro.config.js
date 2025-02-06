const { mergeConfig } = require("@react-native/metro-config");
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

const defaultConfig = getSentryExpoConfig(__dirname);

// Privy requires this https://docs.privy.io/guide/expo/setup/passkey#_1-set-up-your-build-configuration
const resolveRequestWithPackageExports = (context, moduleName, platform) => {
  if (moduleName.startsWith("@privy-io/")) {
    const ctx = {
      ...context,
      unstable_enablePackageExports: true,
    };
    return ctx.resolveRequest(ctx, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

const converseMetroConfig = {
  ...defaultConfig,
  transformer: {
    ...defaultConfig.transformer,
    // getTransformOptions: async () => ({
    //   transform: {
    //     // Maybe enable this later https://docs.expo.dev/guides/tree-shaking/
    //     // experimentalImportSupport: true,
    //     // inlineRequires: true,
    //   },
    // }),
    // Enable SVG file transformation into React components
    babelTransformerPath: require.resolve("react-native-svg-transformer"),
  },
  resolver: {
    ...defaultConfig.resolver,
    resolveRequest: resolveRequestWithPackageExports,
    assetExts: defaultConfig.resolver.assetExts.filter((ext) => ext !== "svg"),
    sourceExts: [
      ...defaultConfig.resolver.sourceExts,
      // Handle SVG files as source code
      "svg",
      // Support .mjs files (required for Expo 49 compatibility)
      "mjs",
    ],
    extraNodeModules: {
      // Not sure if this is needed
      ...require("expo-crypto-polyfills"),
      // Not sure if this is needed
      zlib: require.resolve("browserify-zlib"),
    },
    // Not sure if this is needed
    unstable_enablePackageExports: true,
    // Not sure if this is needed
    unstable_conditionNames: ["react-native", "browser", "require"],
  },
};

module.exports = converseMetroConfig;
