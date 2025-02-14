## SpecStory

## Metro Config Restructuring for React Native (2/6/2025, 6:40:12 PM)

_**User**_

fix to have //...other config logic

// Enable package exports for select libraries
...
const resolveRequestWithPackageExports = (context, moduleName, platform) => {
  if (moduleName.startsWith('@privy-io/')) {
    const ctx = {
      ...context,
      unstable_enablePackageExports: true,
    };
    return ctx.resolveRequest(ctx, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

config.resolver.resolveRequest = resolveRequestWithPackageExports;

...
module.exports = config;

---

_**Assistant**_

I'll help you restructure the metro config file to follow a cleaner pattern with the resolveRequest logic. Here's how we can update it:

```javascript:metro.config.js
const { mergeConfig } = require("@react-native/metro-config");
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

// ... other config logic ...

// Enable package exports for select libraries
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

const defaultConfig = getSentryExpoConfig(__dirname);

const converseMetroConfig = {
  ...defaultConfig,
  transformer: {
    ...defaultConfig.transformer,
    babelTransformerPath: require.resolve("react-native-svg-transformer"),
  },
  resolver: {
    ...defaultConfig.resolver,
    resolveRequest: resolveRequestWithPackageExports,
    assetExts: defaultConfig.resolver.assetExts.filter((ext) => ext !== "svg"),
    sourceExts: [...defaultConfig.resolver.sourceExts, "svg", "mjs"],
    extraNodeModules: {
      ...require("expo-crypto-polyfills"),
      zlib: require.resolve("browserify-zlib"),
    },
    unstable_enablePackageExports: true,
    unstable_conditionNames: ["react-native", "browser", "require"],
  },
};

module.exports = converseMetroConfig;
```

Key changes made:
1. Moved the resolveRequestWithPackageExports function definition before the config setup
2. Removed commented out code for cleaner reading
3. Kept the essential configuration while maintaining the same functionality
4. Added a comment marker for "other config logic" at the top

The functionality remains the same, but the code is now more organized with the resolver function defined before it's used in the configuration.

---



---

