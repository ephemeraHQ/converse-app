## SpecStory

## Config Cleanup and Commenting Guide (1/19/2025, 7:10:17 AM)

_**User**_

make cleaner and put comments explainign why we do some configs

---

_**Assistant**_

I'll help clean up the config and add explanatory comments. Here's the updated version:

```javascript:metro.config.js
const { mergeConfig } = require("@react-native/metro-config");
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

// Get base Sentry configuration for source maps and error tracking
const defaultConfig = getSentryExpoConfig(__dirname, {
  isCSSEnabled: true, // Enable CSS support for web platform
});

const converseMetroConfig = {
  ...defaultConfig,
  transformer: {
    ...defaultConfig.transformer,
    // Configure module transformation settings
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true, // Optimize module loading performance
      },
    }),
    // Use Terser for code minification
    minifierPath: "metro-minify-terser",
    minifierConfig: {
      // Terser options can be configured here
    },
    // Enable SVG file transformation into React components
    babelTransformerPath: require.resolve("react-native-svg-transformer"),
  },
  resolver: {
    ...defaultConfig.resolver,
    // Remove SVG from asset extensions since we're handling it with svg-transformer
    assetExts: defaultConfig.resolver.assetExts.filter((ext) => ext !== "svg"),
    sourceExts: [
      ...defaultConfig.resolver.sourceExts,
      "svg", // Handle SVG files as source code
      "mjs", // Support .mjs files (required for Expo 49 compatibility)
    ],
    // Configure polyfills for crypto and zlib functionality
    extraNodeModules: {
      ...require("expo-crypto-polyfills"),
      zlib: require.resolve("browserify-zlib"),
    },
    // Enable package.json exports field support
    unstable_enablePackageExports: true,
    // Configure module resolution conditions
    unstable_conditionNames: ["react-native", "browser", "require"],
  },
};

module.exports = converseMetroConfig;
```

I've added comments to explain:
1. The purpose of Sentry configuration
2. CSS support for web platform
3. Performance optimization with inlineRequires
4. SVG transformation setup
5. File extension handling (including the Expo 49 mjs issue)
6. Polyfill configurations
7. Package exports and module resolution settings

The structure remains the same, but the comments make it clearer why each configuration option is needed.

---



---

