import { Platform } from "react-native"
import { IConfig } from "@/config/config.types"
import { shared } from "./shared"

export const productionConfig: IConfig = {
  ...shared,
  debugMenu: false,
  app: {
    ...shared.app,
    storeUrl: Platform.select({
      default: "TODO",
      android: "TODO",
    }),
  },
} as const
