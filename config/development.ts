import { IConfig } from "@/config/config.types"
import { shared } from "./shared"

export const developmentConfig: IConfig = {
  ...shared,
} as const
