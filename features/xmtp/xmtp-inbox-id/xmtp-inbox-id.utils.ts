import { IXmtpInboxId } from "@features/xmtp/xmtp.types"

export function isSameInboxId(inboxId1: IXmtpInboxId, inboxId2: IXmtpInboxId) {
  return inboxId1.toLowerCase() === inboxId2.toLowerCase()
}
