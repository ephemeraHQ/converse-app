import { useSelect } from "@/data/store/storeHelpers";
import { VStack } from "@/design-system/VStack";
import { V3MessageSenderAvatar } from "@/features/conversation/conversation-message-sender-avatar";
import { useMessageContextStoreContext } from "@/features/conversation/conversation-message.store-context";
import { MessageContainer } from "@/features/conversation/conversation-message/conversation-message-container";
import { MessageContentContainer } from "@/features/conversation/conversation-message/conversation-message-content-container";
import { useAppTheme } from "@/theme/useAppTheme";
import { ReactNode, memo } from "react";

type IConversationMessageLayoutProps = {
  children: ReactNode;
};

export const ConversationMessageLayout = memo(
  function ConversationMessageLayout({
    children,
  }: IConversationMessageLayoutProps) {
    const { theme } = useAppTheme();

    const { senderAddress, fromMe } = useMessageContextStoreContext(
      useSelect(["senderAddress", "fromMe", "messageId"])
    );

    return (
      <MessageContainer>
        <MessageContentContainer>
          {!fromMe && (
            <>
              <V3MessageSenderAvatar inboxId={senderAddress} />
              <VStack style={{ width: theme.spacing.xxs }} />
            </>
          )}
          <VStack
            style={{
              rowGap: theme.spacing["4xs"],
              alignItems: fromMe ? "flex-end" : "flex-start",
            }}
          >
            {children}
          </VStack>
        </MessageContentContainer>
      </MessageContainer>
    );
  }
);
