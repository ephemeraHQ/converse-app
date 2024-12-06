import { MessageReactions } from "@/components/Chat/Message/MessageReactions/MessageReactions";
import { V3MessageSenderAvatar } from "@/components/Chat/Message/MessageSenderAvatar";
import { MessageContainer } from "@/components/Chat/Message/components/message-container";
import { MessageContentContainer } from "@/components/Chat/Message/components/message-content-container";
import { MessageRepliable } from "@/components/Chat/Message/components/message-repliable";
import { MessageSpaceBetweenMessages } from "@/components/Chat/Message/components/message-space-between-messages";
import { MessageDateChange } from "@/components/Chat/Message/message-date-change";
import {
  IMessageGesturesOnLongPressArgs,
  MessageGestures,
} from "@/components/Chat/Message/message-gestures";
import { MessageTimestamp } from "@/components/Chat/Message/message-timestamp";
import {
  useMessageContextStore,
  useMessageContextStoreContext,
} from "@/components/Chat/Message/stores/message-store";
import { useSelect } from "@/data/store/storeHelpers";
import { VStack } from "@/design-system/VStack";
import {
  setCurrentConversationReplyToMessageId,
  setMessageContextMenuData,
} from "@/features/conversation/conversation-service";
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

  const messageStore = useMessageContextStore();

  const handleReply = useCallback(() => {
    setCurrentConversationReplyToMessageId(messageId);
  }, [messageId]);

  const handleTap = useCallback(() => {
    const isShowingTime = !messageStore.getState().isShowingTime;
    messageStore.setState({
      isShowingTime,
    });
  }, [messageStore]);

  const handleLongPress = useCallback(
    (e: IMessageGesturesOnLongPressArgs) => {
      const messageId = messageStore.getState().messageId;
      setMessageContextMenuData({
        messageId,
        itemRectX: e.pageX,
        itemRectY: e.pageY,
        itemRectHeight: e.height,
        itemRectWidth: e.width,
        messageComponent: children,
      });
    },
    [messageStore, children]
  );

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
            <VStack
              style={{
                rowGap: theme.spacing["4xs"],
                alignItems: fromMe ? "flex-end" : "flex-start",
              }}
            >
              <MessageGestures onTap={handleTap} onLongPress={handleLongPress}>
                {children}
              </MessageGestures>
              <MessageReactions />
            </VStack>
          </MessageContentContainer>
        </MessageContainer>
      </MessageRepliable>
      <MessageSpaceBetweenMessages />
    </>
  );
}
