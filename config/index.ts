import { isDev, isPreview } from "@/utils/getEnv";
import { developmentConfig } from "./development";
import { productionConfig } from "./production";
import { previewConfig } from "./preview";

export const getConfig = () => {
  if (isDev) return developmentConfig;
  if (isPreview) return previewConfig;
  return productionConfig;
};

export const config = getConfig();
