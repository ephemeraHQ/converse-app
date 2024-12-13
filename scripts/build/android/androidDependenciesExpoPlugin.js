const { 
  createRunOncePlugin, 
  withAppBuildGradle 
} = require("@expo/config-plugins");
const { 
  mergeContents 
} = require("@expo/config-plugins/build/utils/generateCode");

const withFixedConverseAndroidDependencies = (config) => {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.contents) {
      config.modResults.contents = setBouncyCastleVersion(
        config.modResults.contents
      );
    }
    return config;
  });
};

const TAG = "converse-android-dependencies-fix";

const setBouncyCastleVersion = (src) => {
  const configurationFix = `
    configurations.all {
  resolutionStrategy.eachDependency { DependencyResolveDetails details ->
      if (details.requested.name == 'bcprov-jdk15on') {
          details.useTarget group: details.requested.group, name: 'bcprov-jdk15to18', version: '1.70'
      }
      if (details.requested.name == 'lifecycle-viewmodel-ktx') {
          details.useTarget group: details.requested.group, name: 'lifecycle-viewmodel-ktx', version: '2.5.0'
      }
  }
}
`;

  const mergeResults = mergeContents({
    tag: TAG,
    src: src,
    newSrc: configurationFix,
    anchor: /android {/gm,
    offset: 1,
    comment: `// `,
  });

  return mergeResults.contents;
};

module.exports = createRunOncePlugin(
  withFixedConverseAndroidDependencies,
  "withFixedConverseAndroidDependencies",
  "1.0.0"
);
