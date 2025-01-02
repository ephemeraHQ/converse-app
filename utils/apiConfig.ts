import Constants from "expo-constants";
import logger from "./logger";
import { isProd } from "./getEnv";

/**
 * Determines the appropriate API URI for the current environment
 * by examining Expo Constants and environment variables.
 *
 * This utility helps connect to a local dev server when running
 * in development, handling different device scenarios:
 * - Expo Go on physical device
 * - Expo Go on emulator
 * - Web browser
 * - Production builds
 *
 * @see https://stackoverflow.com/questions/47417766/calling-locally-hosted-server-from-expo-app
 *
 * @returns {string} The configured API URI
 *
 * @example
 * // When running in Expo Go on physical device
 * getApiUri()
 * /// Output: "http://192.168.1.100:9875"
 *
 * @example
 * // When running in production
 * getApiUri()
 * /// Output: "https://api.production.com"
 */
export const getApiUri = () => {
  // Get configured dev API URI
  const envApiUri = process.env.EXPO_PUBLIC_DEV_API_URI;

  // In production, use the configured API
  if (isProd) {
    return envApiUri;
  }

  // For development, replace localhost with device-accessible IP
  if (envApiUri?.includes("localhost")) {
    logger.info("Replacing localhost with device-accessible IP");
    // Try Expo host info first
    const hostIp = Constants.expoConfig?.hostUri?.split(":")[0];
    logger.info("Host IP", { hostIp });

    if (hostIp) {
      logger.info("Replacing localhost with device-accessible IP", {
        envApiUri,
        hostIp,
      });
      return envApiUri.replace("localhost", hostIp);
    }
  }

  // Fallback to original URI
  return envApiUri;
};

declare const process: {
  env: {
    [key: string]: string;
  };
};
