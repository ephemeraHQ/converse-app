module.exports = {
  presets: [
    [
      "babel-preset-expo",
      // Prevents unnecessary babel transform BigInt to number for Hermes.
      { unstable_transformProfile: "hermes-stable" },
    ],
  ],
  plugins: [
    // Can be removed when using SDK 50
    // https://github.com/expo/expo/issues/23819#issuecomment-1760250369
    // This is to make Constants.expoConfig work in web
    "expo-router/babel",
    ["@babel/plugin-proposal-decorators", { version: "legacy" }],
    "@babel/plugin-proposal-export-namespace-from",
    "@babel/plugin-transform-flow-strip-types", // For privy (phone country selector)
    ["@babel/plugin-transform-class-properties", { loose: true }], // For privy
    ["@babel/plugin-transform-private-methods", { loose: true }], // For privy
    [
      "module-resolver",
      {
        alias: {
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
