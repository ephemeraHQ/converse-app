import { InboxId } from "@xmtp/react-native-sdk";

export function isSameInboxId(inboxId1: InboxId, inboxId2: InboxId) {
  return inboxId1.toLowerCase() === inboxId2.toLowerCase();
}
