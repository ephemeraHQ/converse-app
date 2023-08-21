module.exports = {
  presets: [
    [
      "module:metro-react-native-babel-preset",
      // Prevents unnecessary babel transform BigInt to number for Hermes.
      { unstable_transformProfile: "hermes-stable" },
    ],
  ],
  plugins: [
    ["@babel/plugin-proposal-decorators", { version: "legacy" }],
    "@babel/plugin-proposal-export-namespace-from",
    [
      "module-resolver",
      {
        alias: {
          crypto: "crypto-browserify",
          "@xmtp/xmtp-js": "./vendor/xmtp-js/src",
          "react-native-sqlite-storage": "react-native-quick-sqlite",
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
