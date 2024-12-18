const fs = require("fs");
const { execSync } = require("child_process");

/**
 * Lists all GoogleService-Info plist files in the iOS directory
 *
 * @returns {string[]} Array of found plist file paths
 * @example
 * // Returns:
 * [
 *   'ios/Google Services/GoogleService-Info-prod.plist',
 *   'ios/Google Services/GoogleService-Info-preview.plist'
 * ]
 */
const findGoogleServiceFiles = () => {
  try {
    const result = execSync('find ios -name "GoogleService-Info*.plist"', {
      encoding: "utf8",
    });
    return result.split("\n").filter(Boolean);
  } catch (error) {
    console.warn(`Failed to find GoogleService-Info files: ${error.message}`);
    return [];
  }
};

/**
 * Copies environment-specific Firebase config file for iOS builds
 *
 * This utility handles copying the correct GoogleService-Info.plist
 * file based on the build environment (preview/production).
 *
 * @param {string} env - Build environment ('preview' | 'production')
 * @throws {Error} If source file doesn't exist or copy fails
 * @sideEffects
 * - Copies GoogleService-Info.plist to ios/Converse/
 * - Logs operation status to console
 *
 * @example
 * // Copy preview config
 * copyGoogleServiceInfo('preview')
 * /// Side effects:
 * // - Copies preview plist file
 * // - Logs success message
 *
 * @example
 * // Copy production config
 * copyGoogleServiceInfo('production')
 * /// Side effects:
 * // - Copies production plist file
 * // - Logs success message
 */
const copyGoogleServiceInfo = (env) => {
  // Validate environment
  const validEnvs = ["preview", "production"];
  if (!validEnvs.includes(env)) {
    throw new Error(
      `Invalid environment: "${env}". Must be one of: ${validEnvs.join(", ")}`
    );
  }

  const SOURCE = `ios/Google Services/GoogleService-Info-${
    env === "production" ? "prod" : "preview"
  }.plist`;
  const DEST = "ios/Converse/GoogleService-Info.plist";

  try {
    if (!fs.existsSync(SOURCE)) {
      const availableFiles = findGoogleServiceFiles();
      throw new Error(
        `Source file not found: ${SOURCE}\n\n` +
          `Available GoogleService-Info files:\n${
            availableFiles.length
              ? availableFiles.map((f) => `- ${f}`).join("\n")
              : "  None found"
          }`
      );
    }
    fs.copyFileSync(SOURCE, DEST);
    console.log(`✓ Copied ${env} GoogleService-Info.plist`);
  } catch (error) {
    console.error(
      `✗ Failed to copy GoogleService-Info.plist: ${error.message}`
    );
    throw error;
  }
};

module.exports = {
  copyGoogleServiceInfo,
};
