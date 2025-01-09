import { getCurrentInboxId } from "@data/store/accountsStore";

/**
 * Checks if the provided inboxId belongs to the current user
 * @param inboxId Inbox ID to check
 * @returns boolean indicating if the inboxId belongs to the current user
 */
export function isCurrentUser(inboxId: string | undefined): boolean {
  if (!inboxId) return false;
  const currentInboxId = getCurrentInboxId();
  if (!currentInboxId) return false;

  return inboxId.toLowerCase() === currentInboxId.toLowerCase();
}
