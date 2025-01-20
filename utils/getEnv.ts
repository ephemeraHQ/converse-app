export const Environments = {
  dev: "dev",
  prod: "prod",
} as const;

export type Environment = (typeof Environments)[keyof typeof Environments];

export const getEnv = (): Environment => {
  const isExpoEnvDev = process.env.EXPO_ENV === "dev";
  if (__DEV__ || isExpoEnvDev) {
    return Environments.dev;
  } else {
    return Environments.prod;
  }
};

export const isDev = getEnv() === Environments.dev;
export const isProd = getEnv() === Environments.prod;
