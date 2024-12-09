import { DmConsentPopup } from "@/components/Chat/ConsentPopup/dm-consent-popup";
import { MessageReactionsDrawer } from "@/components/Chat/Message/MessageReactions/MessageReactionsDrawer/MessageReactionsDrawer";
import { MessageContextMenu } from "@/components/Chat/Message/message-context-menu/message-context-menu";
import {
  KeyboardFiller,
  MessagesList,
} from "@/components/Conversation/V3Conversation";
import { useCurrentAccount } from "@/data/store/accountsStore";
import { Composer } from "@/features/conversation/composer/composer";
import {
  ConversationContextProvider,
  useConversationContext,
} from "@/features/conversation/conversation-context";
import { useConversationCurrentTopic } from "@/features/conversation/conversation-service";
import { ConversationStoreProvider } from "@/features/conversation/conversation-store";
import { DmConversationTitle } from "@/features/conversations/components/DmConversationTitle";
import { useRouter } from "@/navigation/useNavigation";
import { useConversationMessages } from "@/queries/useConversationMessages";
import { useDmPeerInboxId } from "@/queries/useDmPeerInbox";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import React, { memo, useEffect } from "react";

export const ExistingDmConversationContent = memo(
  function ExistingDmConversationContent(props: { topic: ConversationTopic }) {
    const { topic } = props;

    const navigation = useRouter();

    useEffect(() => {
      navigation.setOptions({
        headerTitle: () => <DmConversationTitle topic={topic!} />,
      });
    }, [topic, navigation]);

    return (
      <ConversationStoreProvider topic={topic}>
        <ConversationContextProvider>
          <Messages />;
          <ComposerWrapper />
          <KeyboardFiller />
          <MessageContextMenu />
          <MessageReactionsDrawer />
        </ConversationContextProvider>
      </ConversationStoreProvider>
    );
  }
);

const ComposerWrapper = memo(function ComposerWrapper() {
  const sendMessage = useConversationContext("sendMessage");
  return <Composer onSend={sendMessage} />;
});

const Messages = memo(function Messages() {
  const topic = useConversationCurrentTopic();
  const currentAccount = useCurrentAccount()!;

  const {
    data: messages,
    isLoading: messagesLoading,
    isRefetching: isRefetchingMessages,
    refetch: refetchMessages,
  } = useConversationMessages(currentAccount, topic);

  const { data: peerInboxId } = useDmPeerInboxId(currentAccount, topic);

  const isAllowedConversation = useConversationContext("isAllowedConversation");
  const conversationId = useConversationContext("conversationId");

  if (messages?.ids.length === 0 && !messagesLoading) {
    // TODO: Add empty state
    return null;
  }

  return (
    <MessagesList
      messageIds={messages?.ids ?? []}
      refreshing={isRefetchingMessages}
      onRefresh={refetchMessages}
      ListHeaderComponent={
        !isAllowedConversation && peerInboxId ? (
          <DmConsentPopup
            peerInboxId={peerInboxId}
            topic={topic}
            conversationId={conversationId!}
          />
        ) : undefined
      }
    />
  );
});
