// Learn more https://docs.expo.io/guides/customizing-metro
const upstreamTransformer = require("@expo/metro-config/babel-transformer");
const { resolveConfig, transform } = require("@svgr/core");
const resolveConfigDir = require("path-dirname");

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

module.exports = {
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
};
