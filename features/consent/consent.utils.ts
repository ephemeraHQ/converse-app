import { IConsentState } from "@/features/consent/consent.types"
import { IXmtpConsentState } from "@/features/xmtp/xmtp.types"

export function convertConsentStateToXmtpConsentState(
  consentState: IConsentState,
): IXmtpConsentState {
  if (consentState === "allowed") {
    return "allowed"
  }

  if (consentState === "unknown") {
    return "unknown"
  }

  return "denied"
}
