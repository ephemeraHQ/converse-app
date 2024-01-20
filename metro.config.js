// const {
//   createSentryMetroSerializer,
// } = require("@sentry/react-native/dist/js/tools/sentryMetroSerializer");
const { getDefaultConfig, mergeConfig } = require("expo/metro-config");

// eslint-disable-next-line no-undef
const defaultConfig = getDefaultConfig(__dirname, {
  // [Web-only]: Enables CSS support in Metro.
  isCSSEnabled: true,
});

// const sentryConfig = {
//   serializer: {
//     customSerializer: createSentryMetroSerializer(),
//   },
// };

const converseConfig = {
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

module.exports = converseConfig;

// module.exports = mergeConfig(converseConfig, sentryConfig);
