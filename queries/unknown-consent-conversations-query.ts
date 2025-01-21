import { isConversationConsentUnknown } from "@/features/conversation/utils/is-conversation-consent-unknown";
import {
  IConversationsQuery,
  getConversationsQueryOptions,
} from "@/queries/use-conversations-query";
import { UseQueryOptions } from "@tanstack/react-query";

function selectUnknownConsentConversations(conversations: IConversationsQuery) {
  return (
    conversations?.filter((conversation) =>
      // Only the unknown conversations
      isConversationConsentUnknown(conversation)
    ) ?? []
  );
}

// For now just reuse the global conversations query
export const getUnknownConsentConversationsQueryOptions = (args: {
  account: string;
  caller: string;
}): UseQueryOptions<IConversationsQuery> => {
  return {
    ...getConversationsQueryOptions(args),
    select: selectUnknownConsentConversations,
  };
};
