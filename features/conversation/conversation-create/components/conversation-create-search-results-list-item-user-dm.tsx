import { useCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
import { useDmPeerInboxIdQuery } from "@/queries/use-dm-peer-inbox-id-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { memo } from "react";
import { ConversationSearchResultsListItemUser } from "./conversation-create-search-results-list-item-user";

export const ConversationSearchResultsListItemDm = memo(
  function ConversationSearchResultsListItemDm({
    conversationTopic,
  }: {
    conversationTopic: ConversationTopic;
  }) {
    const currentAccount = useCurrentAccount()!;

    const { data: inboxId } = useDmPeerInboxIdQuery({
      account: currentAccount,
      topic: conversationTopic,
      caller: `DmSearchResult-${conversationTopic}`,
    });

    // For now logic of both User and DM is the same
    return <ConversationSearchResultsListItemUser inboxId={inboxId!} />;
  }
);
