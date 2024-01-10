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
          crypto: "crypto-browserify",
          // This entrypoint mapping is done in @xmtp/user-preferences-bindings-wasm's "exports" in package.json
          // but we don't want to enable unstable_enablePackageExports for now in metro.config.js
          "@xmtp/user-preferences-bindings-wasm/web":
            "@xmtp/user-preferences-bindings-wasm/dist/web/user_preferences_bindings_wasm",
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
