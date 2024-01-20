const { mergeConfig } = require("@react-native/metro-config");
const {
  createSentryMetroSerializer,
} = require("@sentry/react-native/dist/js/tools/sentryMetroSerializer");
const { getDefaultConfig } = require("expo/metro-config");

const sentryConfig = {
  serializer: {
    customSerializer: createSentryMetroSerializer(),
  },
};

// eslint-disable-next-line no-undef
const defaultConfig = getDefaultConfig(__dirname, {
  // [Web-only]: Enables CSS support in Metro.
  isCSSEnabled: true,
});

const converseMetroConfig = {
  ...defaultConfig,
  transformer: {
    ...defaultConfig.transformer,
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
    minifierPath: "metro-minify-terser",
    minifierConfig: {
      // Terser options...
    },
    babelTransformerPath: require.resolve("react-native-svg-transformer"),
  },
  resolver: {
    ...defaultConfig.resolver,
    assetExts: defaultConfig.resolver.assetExts.filter((ext) => ext !== "svg"),
    // Expo 49 issue: default metro config needs to include "mjs"
    // https://github.com/expo/expo/issues/23180
    sourceExts: [...defaultConfig.resolver.sourceExts, "svg", "mjs"],
    extraNodeModules: {
      ...require("expo-crypto-polyfills"),
      zlib: require.resolve("browserify-zlib"),
    },
  },
};

module.exports = mergeConfig(converseMetroConfig, sentryConfig);
