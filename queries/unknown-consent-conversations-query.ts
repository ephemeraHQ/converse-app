import { isConversationConsentUnknown } from "@/features/conversation/utils/is-conversation-consent-unknown";
import {
  IConversationsQuery,
  getConversationsQueryOptions,
} from "@/queries/conversations-query";
import { UseQueryOptions } from "@tanstack/react-query";

// For now just reuse the global conversations query
export const getUnknownConsentConversationsQueryOptions = (args: {
  account: string;
  context: string;
}): UseQueryOptions<IConversationsQuery> => {
  return {
    ...getConversationsQueryOptions(args),
    select: (conversations) => {
      return (
        conversations?.filter((conversation) =>
          // Only the unknown conversations
          isConversationConsentUnknown(conversation)
        ) ?? []
      );
    },
  };
};
