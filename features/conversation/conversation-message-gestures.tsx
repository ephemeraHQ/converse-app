import { useMessageContextMenuStore } from "@/features/conversation/conversation-message/conversation-message-context-menu/conversation-message-context-menu.store-context";
import {
  IMessageGesturesOnLongPressArgs,
  MessageGestures,
} from "@/features/conversation/conversation-message/conversation-message-gestures";
import { useMessageContextStore } from "@/features/conversation/conversation-message/conversation-message.store-context";
import React, { memo, useCallback } from "react";

export const ConversationMessageGestures = memo(
  function ConversationMessageGestures({
    children,
  }: {
    children: React.ReactNode;
  }) {
    const messageStore = useMessageContextStore();

    const messageContextMenuStore = useMessageContextMenuStore();

    const handleLongPress = useCallback(
      (e: IMessageGesturesOnLongPressArgs) => {
        const messageId = messageStore.getState().messageId;
        // const message = messageStore.getState().message;
        // const previousMessage = messageStore.getState().previousMessage;
        // const nextMessage = messageStore.getState().nextMessage;
        messageContextMenuStore.getState().setMessageContextMenuData({
          messageId,
          itemRectX: e.pageX,
          itemRectY: e.pageY,
          itemRectHeight: e.height,
          itemRectWidth: e.width,
          // Need to have MessageContextStoreProvider here.
          // Not the cleanest...
          // Might want to find another solution later but works for now.
          // Solution might be to remove the context and just pass props
          // messageComponent: (
          //   <MessageContextStoreProvider
          //     message={message}
          //     previousMessage={previousMessage}
          //     nextMessage={nextMessage}
          //   >
          //     {children}
          //   </MessageContextStoreProvider>
          // ),
        });
      },
      [messageContextMenuStore, messageStore]
    );

    const handleTap = useCallback(() => {
      const isShowingTime = !messageStore.getState().isShowingTime;
      messageStore.setState({
        isShowingTime,
      });
    }, [messageStore]);

    return (
      <MessageGestures onLongPress={handleLongPress} onTap={handleTap}>
        {children}
      </MessageGestures>
    );
  }
);
