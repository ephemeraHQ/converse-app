import { getCurrentInboxId } from "@/data/store/accountsStore";

export function isCurrentUserInboxId(inboxId: string) {
  const currentUserInboxId = getCurrentInboxId();
  if (!inboxId) return false;
  if (!currentUserInboxId) return false;
  return currentUserInboxId.toLowerCase() === inboxId.toLowerCase();
}
