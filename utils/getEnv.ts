import Constants from "expo-constants"

export const Environments = {
  development: "development",
  preview: "preview",
  production: "production",
} as const

export type Environment = (typeof Environments)[keyof typeof Environments]

export const getEnv = (): Environment => {
  const expoEnv = Constants.expoConfig?.extra?.expoEnv as Environment
  if (expoEnv === "development") {
    return Environments.development
  } else if (expoEnv === "preview") {
    return Environments.preview
  } else {
    return Environments.production
  }
}

export const isDev = getEnv() === Environments.development
export const isProd = getEnv() === Environments.production
export const isPreview = getEnv() === Environments.preview
