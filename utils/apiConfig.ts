import Constants from "expo-constants";
import logger from "./logger";
import { getEnv, isProd, Environments } from "./getEnv";

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
  const devApiUri = process.env.EXPO_PUBLIC_DEV_API_URI;

  // Log environment info
  logger.info("Environment:", {
    NODE_ENV: process.env.NODE_ENV,
    devApiUri,
    hostUri: Constants.expoConfig?.hostUri,
    inBrowser: typeof document !== "undefined",
  });

  // In production, use the configured API
  if (isProd()) {
    return devApiUri;
  }

  // For development, replace localhost with device-accessible IP
  if (devApiUri?.includes("localhost")) {
    logger.info("Replacing localhost with device-accessible IP");
    // Try Expo host info first
    const hostIp =
      Constants.expoConfig?.hostUri?.split(":")[0] ||
      (Constants.manifest as any)?.debuggerHost?.split(":")[0];
    logger.info("Host IP", { hostIp });

    if (hostIp) {
      logger.info("Replacing localhost with device-accessible IP", {
        devApiUri,
        hostIp,
      });
      return devApiUri.replace("localhost", hostIp);
    }
  }

  // Fallback to original URI
  return devApiUri;
};

declare const process: {
  env: {
    [key: string]: string;
  };
};
