import { useCurrentAccount } from "@/data/store/accountsStore";
import { Center } from "@/design-system/Center";
import { Text } from "@/design-system/Text";
import { VStack } from "@/design-system/VStack";
import { Loader } from "@/design-system/loader";
import { ConversationMessageTimestamp } from "@/features/conversation/conversation-message/conversation-message-timestamp";
import { MessageContextStoreProvider } from "@/features/conversation/conversation-message/conversation-message.store-context";
import { ConversationMessage } from "@/features/conversation/conversation-message/conversation-message";
import { ConversationMessageLayout } from "@/features/conversation/conversation-message/conversation-message-layout";
import { ConversationMessageReactions } from "@/features/conversation/conversation-message/conversation-message-reactions/conversation-message-reactions";
import { ConversationMessagesList } from "@/features/conversation/conversation-messages-list";
import { ConversationStoreProvider } from "@/features/conversation/conversation.store-context";
import { useConversationPreviewMessages } from "@/queries/useConversationPreviewMessages";
import { useConversationQuery } from "@/queries/useConversationQuery";
import { $globalStyles } from "@/theme/styles";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import React from "react";

type ConversationReadOnlyProps = {
  topic: ConversationTopic;
};

export const ConversationReadOnly = ({ topic }: ConversationReadOnlyProps) => {
  const currentInboxId = useCurrentInboxId()!;

  const { data: messages, isLoading: isLoadingMessages } =
    useConversationPreviewMessages(currentAccount, topic!);

  const { data: conversation, isLoading: isLoadingConversation } =
    useConversationQuery({
      account: currentAccount,
      topic,
    });

  const isLoading = isLoadingMessages || isLoadingConversation;

  return (
    <VStack
      // {...debugBorder()}
      style={$globalStyles.flex1}
    >
      {isLoading ? (
        <Center style={$globalStyles.flex1}>
          <Loader />
        </Center>
      ) : !conversation ? (
        <Center style={$globalStyles.flex1}>
          <Text>Conversation not found</Text>
        </Center>
      ) : (
        <ConversationStoreProvider
          topic={topic}
          conversationId={conversation.id}
        >
          <ConversationMessagesList
            messageIds={messages?.ids ?? []}
            renderMessage={({ messageId, index }) => {
              const message = messages?.byId[messageId]!;
              const previousMessage = messages?.byId[messages?.ids[index + 1]];
              const nextMessage = messages?.byId[messages?.ids[index - 1]];

              return (
                <MessageContextStoreProvider
                  message={message}
                  previousMessage={previousMessage}
                  nextMessage={nextMessage}
                >
                  <ConversationMessageTimestamp />
                  <ConversationMessageLayout>
                    <ConversationMessage message={message} />
                    <ConversationMessageReactions />
                  </ConversationMessageLayout>
                </MessageContextStoreProvider>
              );
            }}
          />
        </ConversationStoreProvider>
      )}
    </VStack>
  );
};
