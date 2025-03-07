import { config } from "@/config"

export enum ONBOARDING_ENTERING_DELAY {
  FIRST = 100,
  SECOND = 175,
  THIRD = 250,
  FOURTH = 850,
  FIFTH = 925,
  SIXTH = 1000,
}

export const RPID = config.websiteDomain
export const RELYING_PARTY = `https://${RPID}`
