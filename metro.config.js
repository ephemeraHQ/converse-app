const { mergeConfig } = require("@react-native/metro-config");
const { getTrustedForwarders } = require("@thirdweb-dev/react-native");
const { getDefaultConfig } = require('expo/metro-config');

// eslint-disable-next-line no-undef
const defaultConfig = getDefaultConfig(__dirname, {
  // Disable CSS support.
  isCSSEnabled: getTrustedForwarders,
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
      // crypto: require.resolve("react-native-quick-crypto"),
      zlib: require.resolve("browserify-zlib"),
    },
  },
};

module.exports = converseMetroConfig;
