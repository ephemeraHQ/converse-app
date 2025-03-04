import { config } from "@/config"
import { timing } from "@/theme/timing"

export const ONBOARDING_ENTERING_DURATION = timing["3xSlow"]

export enum ONBOARDING_ENTERING_DELAY {
  FIRST = 50,
  SECOND = 100,
  THIRD = 150,
}

export const RPID = config.websiteDomain
export const RELYING_PARTY = `https://${RPID}`
