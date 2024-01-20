// Learn more https://docs.expo.io/guides/customizing-metro
const upstreamTransformer = require("@expo/metro-config/babel-transformer");
const { mergeConfig } = require("@react-native/metro-config");
const {
  createSentryMetroSerializer,
} = require("@sentry/react-native/dist/js/tools/sentryMetroSerializer");
const { resolveConfig, transform } = require("@svgr/core");
const { getDefaultConfig } = require("expo/metro-config");
const resolveConfigDir = require("path-dirname");

const sentryConfig = {
  serializer: {
    customSerializer: createSentryMetroSerializer(),
  },
};

// eslint-disable-next-line no-undef
const defaultConfig = getDefaultConfig(__dirname, {
  // [Web-only]: Enables CSS support in Metro.
  isCSSEnabled: true,
});


const defaultSVGRConfig = {
  native: true,
  plugins: ["@svgr/plugin-svgo", "@svgr/plugin-jsx"],
  svgoConfig: {
    plugins: [
      {
        name: "preset-default",
        params: {
          overrides: {
            inlineStyles: {
              onlyMatchedOnce: false,
            },
            removeViewBox: false,
            removeUnknownsAndDefaults: false,
            convertColors: false,
          },
        },
      },
    ],
  },
};

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
    babelTransformerPath: {
      transform: async ({ src, filename, options }) => {
        if (filename.endsWith(".svg")) {
          const config = await resolveConfig(resolveConfigDir(filename));
          const svgrConfig = config
            ? { ...defaultSVGRConfig, ...config }
            : defaultSVGRConfig;
          return upstreamTransformer.transform({
            src: await transform(src, svgrConfig),
            filename,
            options,
          });
        }
        return upstreamTransformer.transform({ src, filename, options });
      },
    },
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

module.exports = mergeConfig(converseMetroConfig, sentryConfig);
