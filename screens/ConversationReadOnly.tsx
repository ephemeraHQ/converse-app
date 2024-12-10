import { ConversationMessage } from "@/features/conversation/conversation-message/conversation-message";
import { ConversationMessageLayout } from "@/features/conversation/conversation-message/conversation-message-layout";
import { MessageDateChange } from "@/features/conversation/conversation-message-date-change";
import { MessageContextStoreProvider } from "@/features/conversation/conversation-message.store-context";
import { ConversationMessagesList } from "@/features/conversation/conversation-messages-list";
import { useCurrentAccount } from "@/data/store/accountsStore";
import { Center } from "@/design-system/Center";
import { VStack } from "@/design-system/VStack";
import { Loader } from "@/design-system/loader";
import { useConversationPreviewMessages } from "@/queries/useConversationPreviewMessages";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import React from "react";

type ConversationReadOnlyProps = {
  topic: ConversationTopic;
};

export const ConversationReadOnly = ({ topic }: ConversationReadOnlyProps) => {
  const currentAccount = useCurrentAccount()!;

  const { data: messages, isLoading: isLoadingMessages } =
    useConversationPreviewMessages(currentAccount, topic!);

  return (
    <VStack
      // {...debugBorder()}
      style={{
        flex: 1,
      }}
    >
      {isLoadingMessages ? (
        <Center
          style={{
            flex: 1,
          }}
        >
          <Loader />
        </Center>
      ) : (
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
                <MessageDateChange />
                <ConversationMessageLayout>
                  <ConversationMessage message={message} />
                </ConversationMessageLayout>
              </MessageContextStoreProvider>
            );
          }}
        />
      )}
    </VStack>
  );
};
