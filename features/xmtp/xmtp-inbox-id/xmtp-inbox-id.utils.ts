import { IXmtpInboxId } from "@features/xmtp/xmtp.types"

export function isSameInboxId(inboxId1: IXmtpInboxId, inboxId2: IXmtpInboxId) {
  return inboxId1.toLowerCase().trim() === inboxId2.toLowerCase().trim()
}
