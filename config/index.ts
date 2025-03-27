import { isDev, isPreview } from "@/utils/getEnv"
import { developmentConfig } from "./development"
import { previewConfig } from "./preview"
import { productionConfig } from "./production"

// todo: use zod for env and stop typing in multiple places
// crash on first build step rather than at runtime
// const configSchema = z.object({
//   // ... other config variables ...
//   SECURE_QUERY_ENCRYPTION_KEY: z.string().min(16),
// });

// // export const Config = {
// //   // ... other config variables ...
// //   SECURE_QUERY_ENCRYPTION_KEY: process.env
// //     .SECURE_QUERY_ENCRYPTION_KEY as string,
// // } satisfies z.infer<typeof configSchema>;

// // // Validate config at startup
// // configSchema.parse(Config);

/**
 * Helpful when debugging locally using other environments
 */
const API_URL = process.env.EXPO_PUBLIC_CONVOS_API_URI
const EXPO_ENV = process.env.EXPO_ENV

if (API_URL.includes("localhost")) {
  if (EXPO_ENV && EXPO_ENV !== "development") {
    throw new Error(
      "Using localhost API URL in non-dev environment. Did you forget to pull env vars?",
    )
  }
}

export const getConfig = () => {
  if (isDev) return developmentConfig
  if (isPreview) return previewConfig
  return productionConfig
}

export const config = getConfig()
