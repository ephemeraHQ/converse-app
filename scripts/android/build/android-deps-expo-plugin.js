/**
 * This work was done by Noe.
 * It handles some conflicting dependencies manually.
 * It seems to be needed for now for Android build to work with eas.
 * We might be able to remove it once we will clean up our dependencies?
 * Maybe not since it's used by many crypto libs
 * https://github.com/expo/expo/issues/29026#issuecomment-2173524698
 */
const { createRunOncePlugin, withAppBuildGradle } = require("@expo/config-plugins")
const { mergeContents } = require("@expo/config-plugins/build/utils/generateCode")

const withFixedConvosAndroidDependencies = (config) => {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.contents) {
      config.modResults.contents = setBouncyCastleVersion(config.modResults.contents)
    }
    return config
  })
}

const TAG = "convos-android-dependencies-fix"

const setBouncyCastleVersion = (src) => {
  const configurationFix = `
      configurations.all {
    resolutionStrategy.eachDependency { DependencyResolveDetails details ->
        if (details.requested.name == 'bcprov-jdk15on') {
            details.useTarget group: details.requested.group, name: 'bcprov-jdk15to18', version: '1.78.1'
        }
        if (details.requested.name == 'lifecycle-viewmodel-ktx') {
            details.useTarget group: details.requested.group, name: 'lifecycle-viewmodel-ktx', version: '2.5.0'
        }
    }
  }
  `

  const mergeResults = mergeContents({
    tag: TAG,
    src: src,
    newSrc: configurationFix,
    anchor: /android {/gm,
    offset: 1,
    comment: `// `,
  })

  return mergeResults.contents
}

module.exports = createRunOncePlugin(
  withFixedConvosAndroidDependencies,
  "withFixedConvosAndroidDependencies",
  "1.0.0",
)
