import { Platform } from "react-native"
import { IConfig } from "@/config/config.types"
import { shared } from "./shared"

export const previewConfig: IConfig = {
  ...shared,
  app: {
    ...shared.app,
    storeUrl: Platform.select({
      default: "itms-beta://testflight.apple.com/v1/app/6478027666",
      android: "https://play.google.com/apps/internaltest/4701737988037557150",
    }),
  },
} as const
