import { isDev, isPreview } from "@/utils/getEnv";
import { developmentConfig } from "./development";
import { productionConfig } from "./production";
import { previewConfig } from "./preview";
import { z } from "zod";

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

export const getConfig = () => {
  if (isDev) return developmentConfig;
  if (isPreview) return previewConfig;
  return productionConfig;
};

export const config = getConfig();
