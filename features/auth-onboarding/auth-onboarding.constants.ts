import { config } from "@/config"

export enum ONBOARDING_ENTERING_DELAY {
  FIRST = 100,
  SECOND = 125,
  THIRD = 175,
  FOURTH = 250,
  FIFTH = 350,
  SIXTH = 500,
}

export const RPID = config.app.webDomain
export const RELYING_PARTY = `https://${RPID}`
