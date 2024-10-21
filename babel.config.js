const fs = require('fs');
const path = require('path');

// Function to get all feature directories
const getFeatureDirectories = () => {
  const featuresPath = path.join(__dirname, 'features');
  return fs.readdirSync(featuresPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
};

// Generate aliases for features
const generateFeatureAliases = () => {
  const features = getFeatureDirectories();
  return features.reduce((aliases, feature) => {
    aliases[`@features/${feature}`] = `./features/${feature}`;
    return aliases;
  }, {});
};

module.exports = {
  presets: [
    [
      "babel-preset-expo",
      // Prevents unnecessary babel transform BigInt to number for Hermes.
      { unstable_transformProfile: "hermes-stable" },
    ],
  ],
  plugins: [
    ["@babel/plugin-proposal-decorators", { version: "legacy" }],
    "@babel/plugin-proposal-export-namespace-from",
    "@babel/plugin-transform-flow-strip-types", // For privy (phone country selector)
    ["@babel/plugin-transform-class-properties", { loose: true }], // For privy
    ["@babel/plugin-transform-private-methods", { loose: true }], // For privy
    [
      "module-resolver",
      {
        alias: {
          "fast-text-encoding": "text-encoding",
          // crypto: "react-native-quick-crypto",
          "react-native-sqlite-storage": "@op-engineering/op-sqlite",
          crypto: "crypto-browserify",
          // This entrypoint mapping is done in @xmtp/user-preferences-bindings-wasm's "exports" in package.json
          // but we don't want to enable unstable_enablePackageExports for now in metro.config.js
          "@xmtp/user-preferences-bindings-wasm/web":
            "@xmtp/user-preferences-bindings-wasm/dist/web/user_preferences_bindings_wasm",
          // Same for @web3modal/ethers5
          "@web3modal/ethers5/react":
            "@web3modal/ethers5/dist/esm/exports/react.js",
          "@web3modal/scaffold-utils/ethers":
            "@web3modal/scaffold-utils/dist/esm/exports/ethers.js",
          "react-native-webview": "react-native-webview/src/index.ts",

          // Add dynamic feature aliases
          ...generateFeatureAliases(),

          // Existing folder aliases
          "@components": "./components",
          "@containers": "./containers",
          "@data": "./data",
          "@hooks": "./hooks",
          "@i18n": "./i18n",
          "@queries": "./queries",
          "@screens": "./screens",
          "@styles": "./styles",
          "@utils": "./utils",
          "@theme": "./theme",
          "@design-system": "./design-system",
        },
      },
    ],
    "react-native-reanimated/plugin",
  ],
  env: {
    production: {
      plugins: ["transform-remove-console", "react-native-paper/babel"],
    },
  },
};
