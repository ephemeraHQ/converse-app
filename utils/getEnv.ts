import Constants from "expo-constants";

export const Environments = {
  dev: "dev",
  preview: "preview",
  prod: "prod",
} as const;

export type Environment = (typeof Environments)[keyof typeof Environments];

export const getEnv = (): Environment => {
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
