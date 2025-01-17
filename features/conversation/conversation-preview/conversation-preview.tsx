import { useCurrentAccount } from "@/data/store/accountsStore";
import { Center } from "@/design-system/Center";
import { Text } from "@/design-system/Text";
import { VStack } from "@/design-system/VStack";
import { EmptyState } from "@/design-system/empty-state";
import { Loader } from "@/design-system/loader";
import { ConversationMessage } from "@/features/conversation/conversation-message/conversation-message";
import { ConversationMessageLayout } from "@/features/conversation/conversation-message/conversation-message-layout";
import { ConversationMessageReactions } from "@/features/conversation/conversation-message/conversation-message-reactions/conversation-message-reactions";
import { ConversationMessageTimestamp } from "@/features/conversation/conversation-message/conversation-message-timestamp";
import { MessageContextStoreProvider } from "@/features/conversation/conversation-message/conversation-message.store-context";
import { conversationListDefaultProps } from "@/features/conversation/conversation-messages-list";
import { ConversationStoreProvider } from "@/features/conversation/conversation.store-context";
import { useConversationQuery } from "@/queries/useConversationQuery";
import { $globalStyles } from "@/theme/styles";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import React from "react";
import { FlatList } from "react-native";
import { useConversationPreviewMessages } from "./conversation-preview-messages.query";

type ConversationPreviewProps = {
  topic: ConversationTopic;
};

export const ConversationPreview = ({ topic }: ConversationPreviewProps) => {
  const currentAccount = useCurrentAccount()!;

  const { data: messages, isLoading: isLoadingMessages } =
    useConversationPreviewMessages(currentAccount, topic);

  const { data: conversation, isLoading: isLoadingConversation } =
    useConversationQuery({
      account: currentAccount,
      topic,
    });

  const isLoading = isLoadingMessages || isLoadingConversation;

  return (
    <VStack style={$globalStyles.flex1}>
      {isLoading ? (
        <Center style={$globalStyles.flex1}>
          <Loader />
        </Center>
      ) : !conversation ? (
        <Center style={$globalStyles.flex1}>
          <Text>Conversation not found</Text>
        </Center>
      ) : messages?.ids.length === 0 ? (
        <Center style={$globalStyles.flex1}>
          <EmptyState
            title="Empty conversation"
            description="This conversation has no messages"
          />
        </Center>
      ) : (
        <ConversationStoreProvider
          topic={topic}
          conversationId={conversation.id}
        >
          {/* Using basic Flatlist instead of the Animated one to try to fix the context menu crashes https://github.com/dominicstop/react-native-ios-context-menu/issues/70 */}
          <FlatList
            {...conversationListDefaultProps}
            data={Object.values(messages?.byId ?? {})}
            renderItem={({ item, index }) => {
              const message = item;
              const previousMessage = messages?.byId[messages?.ids[index + 1]];
              const nextMessage = messages?.byId[messages?.ids[index - 1]];

              return (
                <MessageContextStoreProvider
                  message={message}
                  previousMessage={previousMessage}
                  nextMessage={nextMessage}
                >
                  <VStack>
                    <ConversationMessageTimestamp />
                    <ConversationMessageLayout>
                      <ConversationMessage message={message} />
                      <ConversationMessageReactions />
                    </ConversationMessageLayout>
                  </VStack>
                </MessageContextStoreProvider>
              );
            }}
          />
        </ConversationStoreProvider>
      )}
    </VStack>
  );
};
