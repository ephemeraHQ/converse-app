import { ConfigContext, ExpoConfig } from "expo/config";
import warnOnce from "warn-once";

import appJson from "./app.json";

const env = process.env as any;
const isDev = env.EXPO_ENV === "dev";
const expoConfig = appJson.expo;
warnOnce(
  isDev && !(process.env as any).EXPO_PUBLIC_DEV_API_URI,
  "\n\n🚧 Running the app without EXPO_PUBLIC_DEV_API_URI setup\n\n"
);

const isPreview = env.EXPO_ENV === "preview";
const isProduction = !isDev && !isPreview;

type DefaultExpoConfig = typeof expoConfig;

type ConverseConfigContext = ConfigContext & {
  config: DefaultExpoConfig;
};

export default ({ config }: ConverseConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  name: isDev ? "Converse DEV" : isPreview ? "Converse PREVIEW" : "Converse",
  scheme: isDev ? "converse-dev" : isPreview ? "converse-preview" : "converse",
  icon: isProduction ? "./assets/icon.png" : "./assets/icon-preview.png",
  extra: {
    ...config.extra,
    ENV: isDev ? "dev" : isPreview ? "preview" : "prod",
  },
  runtimeVersion: config.version,
});
