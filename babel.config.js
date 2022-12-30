module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo-modern"],
    plugins: [
      [
        "module-resolver",
        {
          alias: {
            crypto: "crypto-browserify",
          },
        },
      ],
    ],
    env: {
      production: {
        plugins: ["transform-remove-console"],
      },
    },
  };
};
