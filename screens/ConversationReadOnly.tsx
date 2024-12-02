import { MessagesList } from "@/components/Conversation/V3Conversation";
import { useCurrentAccount } from "@/data/store/accountsStore";
import { AnimatedVStack } from "@/design-system/VStack";
import { ConversationContextProvider } from "@/features/conversation/conversation-context";
import {
  initializeCurrentConversation,
  useConversationCurrentTopic,
} from "@/features/conversation/conversation-service";
import { useConversationPreviewMessages } from "@/queries/useConversationPreviewMessages";
import { useAppTheme } from "@/theme/useAppTheme";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import React, { memo } from "react";

type ConversationReadOnlyProps = {
  topic: ConversationTopic;
};

export const ConversationReadOnly = ({ topic }: ConversationReadOnlyProps) => {
  initializeCurrentConversation({
    topic,
    peerAddress: undefined,
    inputValue: "",
  });

  return (
    <ConversationContextProvider>
      <Content />
    </ConversationContextProvider>
  );
};

const Content = memo(function Content() {
  const currentAccount = useCurrentAccount()!;

  const { theme } = useAppTheme();

  const topic = useConversationCurrentTopic();

  const { data: messages, isLoading: isLoadingMessages } =
    useConversationPreviewMessages(currentAccount, topic!);

  if (isLoadingMessages) {
    return null;
  }

  return (
    <AnimatedVStack
      layout={theme.animation.reanimatedSpringLayoutTransition}
      style={{
        flex: 1,
      }}
    >
      <MessagesList data={messages?.ids} />
    </AnimatedVStack>
  );
});
