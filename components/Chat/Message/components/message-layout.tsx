import { V3MessageSenderAvatar } from "@/components/Chat/Message/MessageSenderAvatar";
import { MessageContainer } from "@/components/Chat/Message/components/message-container";
import { MessageContentContainer } from "@/components/Chat/Message/components/message-content-container";
import { MessageRepliable } from "@/components/Chat/Message/components/message-repliable";
import { MessageSpaceBetweenMessages } from "@/components/Chat/Message/components/message-space-between-messages";
import { useMessageContext } from "@/components/Chat/Message/contexts/message-context";
import { MessageDateChange } from "@/components/Chat/Message/message-date-change";
import { MessageTimestamp } from "@/components/Chat/Message/message-timestamp";
import { useMessageContextStoreContext } from "@/components/Chat/Message/stores/message-store";
import { useSelect } from "@/data/store/storeHelpers";
import { Pressable } from "@/design-system/Pressable";
import { VStack } from "@/design-system/VStack";
import { setCurrentConversationReplyToMessageId } from "@/features/conversation/conversation-service";
import { useAppTheme } from "@/theme/useAppTheme";
import { ReactNode, useCallback } from "react";

type IMessageLayoutProps = {
  children: ReactNode;
};

export function MessageLayout({ children }: IMessageLayoutProps) {
  const { theme } = useAppTheme();

  const { senderAddress, fromMe, messageId } = useMessageContextStoreContext(
    useSelect(["senderAddress", "fromMe", "messageId"])
  );

  const { toggleTime } = useMessageContext();

  const handleReply = useCallback(() => {
    setCurrentConversationReplyToMessageId(messageId);
  }, [messageId]);

  const handlePressMessage = useCallback(() => {
    toggleTime();
  }, [toggleTime]);

  return (
    <>
      <MessageDateChange />
      <MessageTimestamp />
      <MessageRepliable onReply={handleReply}>
        <MessageContainer fromMe={fromMe}>
          <MessageContentContainer fromMe={fromMe}>
            {!fromMe && (
              <>
                <V3MessageSenderAvatar inboxId={senderAddress} />
                <VStack style={{ width: theme.spacing.xxs }} />
              </>
            )}
            <Pressable onPress={handlePressMessage}>{children}</Pressable>
          </MessageContentContainer>
        </MessageContainer>
      </MessageRepliable>
      <MessageSpaceBetweenMessages />
    </>
  );
}
