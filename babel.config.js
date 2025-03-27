module.exports = {
  presets: [
    [
      "babel-preset-expo",
      // Prevents unnecessary babel transform BigInt to number for Hermes.
      { unstable_transformProfile: "hermes-stable" },
    ],
  ],
  plugins: [
    // https://github.com/kuatsu/react-native-boost
    ["react-native-boost/plugin"],
    [
      "module-resolver",
      {
        alias: {
          // Folder aliases
          "@": "./",
          "@components": "./components",
          "@config": "./config",
          "@containers": "./containers",
          "@data": "./data",
          "@hooks": "./hooks",
          "@i18n": "./i18n",
          "@queries": "./queries",
          "@screens": "./screens",
          "@styles": "./styles",
          "@utils": "./utils",
          "@theme": "./theme",
          "@assets": "./assets",
          "@design-system": "./design-system",
          "@navigation": "./navigation",
          "@features": "./features",
          "@shared": "./features/shared",
          "@search": "./features/search",
        },
      },
    ],
    "react-native-reanimated/plugin",
  ],
}
