import { isDev, isPreview } from "@/utils/getEnv";
import { devConfig } from "./dev";
import { prodConfig } from "./prod";
import { previewConfig } from "./preview";

export const getConfig = () => {
  if (isDev) return devConfig;
  if (isPreview) return previewConfig;
  return prodConfig;
};

export const config = getConfig();
