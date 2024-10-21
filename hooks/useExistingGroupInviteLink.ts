import { useChatStore } from "@features/accounts/accounts.store";
import { useShallow } from "zustand/react/shallow";

export const useExistingGroupInviteLink = (
  topic: string
): string | undefined => {
  return useChatStore(useShallow((s) => s.groupInviteLinks[topic]));
};
