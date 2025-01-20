import { isDev, isPreview } from "../utils/getEnv";
import { devConfig } from "./dev";
import { previewConfig } from "./preview";
import { prodConfig } from "./prod";

export const getConfig = () => {
  if (isDev) return devConfig;
  if (isPreview) return previewConfig;
  return prodConfig;
};

export const config = getConfig();
