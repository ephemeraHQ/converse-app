export const Environments = {
  dev: "dev",
  preview: "preview",
  prod: "prod",
} as const;

export type Environment = (typeof Environments)[keyof typeof Environments];

export const getEnv = (): Environment => {
  if (__DEV__ || process.env.EXPO_ENV === "dev") {
    return Environments.dev;
  } else if (process.env.EXPO_ENV === "preview") {
    return Environments.preview;
  } else {
    return Environments.prod;
  }
};

export const isDev = getEnv() === Environments.dev;
export const isProd = getEnv() === Environments.prod;
export const isPreview = getEnv() === Environments.preview;
