import { useChatStore } from "@data/store/accountsStore";
import { useShallow } from "zustand/react/shallow";

export const useExistingGroupInviteLink = (
  topic: string
): string | undefined => {
  return useChatStore(useShallow((s) => s.groupInviteLinks[topic]));
};
