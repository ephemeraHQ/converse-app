import { useChatStore } from "@/features/multi-inbox/multi-inbox.store";
import { useShallow } from "zustand/react/shallow";
import type { ConversationTopic } from "@xmtp/react-native-sdk";

export const useExistingGroupInviteLink = (
  topic: ConversationTopic | undefined
): string | undefined => {
  return useChatStore(
    useShallow((s) => (topic ? s.groupInviteLinks[topic] : undefined))
  );
};
