import { isDev } from "@/utils/getEnv";
import { devConfig } from "./dev";
import { prodConfig } from "./prod";

export const getConfig = () => {
  if (isDev) return devConfig;
  return prodConfig;
};

export const config = getConfig();
