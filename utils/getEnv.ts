import Constants from "expo-constants";

export const Environments = {
  dev: "dev",
  preview: "preview",
  prod: "prod",
} as const;

export type Environment = (typeof Environments)[keyof typeof Environments];

/**
 * Get the current environment
 *
 * @returns {string} The current environment
 *
 * @example
 * // Input:
 * getEnv()
 * /// Output:
 * // - 'dev' when in development
 * // - 'preview' when in preview
 * // - 'prod' when in production
 */
export const getEnv = (): Environment => {
  // todo(lustig): type .env variables
  // @ts-ignore
  const isExpoEnvDev = process.env.EXPO_ENV === "dev";
  if (__DEV__ || isExpoEnvDev) {
    return Environments.dev;
  } else if (Constants.expoConfig?.extra?.ENV === "preview") {
    return Environments.preview;
  } else {
    return Environments.prod;
  }
};

export const isDev = getEnv() === Environments.dev;
export const isPreview = getEnv() === Environments.preview;
export const isProd = getEnv() === Environments.prod;
