import { MessageContextMenuBackdrop } from "@/components/Chat/Message/message-context-menu/message-context-menu-backdrop";
import { MessageContextMenuEmojiPicker } from "@/components/Chat/Message/message-context-menu/message-context-menu-emoji-picker/message-context-menu-emoji-picker";
import { openMessageContextMenuEmojiPicker } from "@/components/Chat/Message/message-context-menu/message-context-menu-emoji-picker/message-context-menu-emoji-picker-utils";
import { MessageContextMenuItems } from "@/components/Chat/Message/message-context-menu/message-context-menu-items";
import { MessageContextMenuReactors } from "@/components/Chat/Message/message-context-menu/message-context-menu-reactors";
import {
  getMessageById,
  useConversationMessageReactions,
  useCurrentAccountInboxId,
} from "@/components/Chat/Message/message-utils";
import { AnimatedVStack, VStack } from "@/design-system/VStack";
import { useConversationContext } from "@/features/conversation/conversation-context";
import {
  resetMessageContextMenuData,
  useMessageContextMenuData,
} from "@/features/conversation/conversation-service";
import { messageIsFromCurrentUserV3 } from "@/features/conversations/utils/messageIsFromCurrentUser";
import { calculateMenuHeight } from "@design-system/ContextMenu/ContextMenu.utils";
import { Portal } from "@gorhom/portal";
import { memo, useCallback } from "react";
import { StyleSheet } from "react-native";
import { MessageContextMenuAboveMessageReactions } from "./message-context-menu-above-message-reactions";
import { MessageContextMenuContainer } from "./message-context-menu-container";
import { getMessageContextMenuItems } from "./message-context-menu-utils";

export const MESSAGE_CONTEXT_MENU_SPACE_BETWEEN_ABOVE_MESSAGE_REACTIONS_AND_MESSAGE = 16;

export const MessageContextMenu = memo(function MessageContextMenu() {
  const messageContextMenuData = useMessageContextMenuData();

  if (!messageContextMenuData) {
    return null;
  }

  return <Content />;
});

const Content = memo(function Content() {
  const {
    messageId,
    itemRectX,
    itemRectY,
    itemRectHeight,
    itemRectWidth,
    messageComponent,
  } = useMessageContextMenuData()!;

  const { data: currentUserInboxId } = useCurrentAccountInboxId();
  const message = getMessageById(messageId)!;
  const fromMe = messageIsFromCurrentUserV3({ message });
  const menuItems = getMessageContextMenuItems({
    messageId: messageId,
  });
  const menuHeight = calculateMenuHeight(menuItems.length);
  const { bySender } = useConversationMessageReactions(messageId!);

  const reactOnMessage = useConversationContext("reactOnMessage");
  const removeReactionFromMessage = useConversationContext(
    "removeReactionFromMessage"
  );

  const handlePressBackdrop = useCallback(() => {
    resetMessageContextMenuData();
  }, []);

  const handleSelectReaction = useCallback(
    (emoji: string) => {
      const currentUserAlreadyReacted = bySender?.[currentUserInboxId!]?.find(
        (reaction) => reaction.content === emoji
      );
      if (currentUserAlreadyReacted) {
        removeReactionFromMessage({
          messageId: messageId,
          emoji,
        });
      } else {
        reactOnMessage({ messageId: messageId, emoji });
      }
      resetMessageContextMenuData();
    },
    [
      reactOnMessage,
      messageId,
      currentUserInboxId,
      bySender,
      removeReactionFromMessage,
    ]
  );

  const handleChooseMoreEmojis = useCallback(() => {
    openMessageContextMenuEmojiPicker();
  }, []);

  const hasReactions = Boolean(bySender && Object.keys(bySender).length > 0);

  return (
    <>
      <Portal>
        <MessageContextMenuBackdrop handlePressBackdrop={handlePressBackdrop}>
          <AnimatedVStack style={StyleSheet.absoluteFill}>
            {!!bySender && <MessageContextMenuReactors reactors={bySender} />}
            <MessageContextMenuContainer
              itemRectY={itemRectY}
              itemRectX={itemRectX}
              itemRectHeight={itemRectHeight}
              itemRectWidth={itemRectWidth}
              menuHeight={menuHeight}
              fromMe={fromMe}
              hasReactions={hasReactions}
            >
              <MessageContextMenuAboveMessageReactions
                reactors={bySender ?? {}}
                messageId={messageId}
                onChooseMoreEmojis={handleChooseMoreEmojis}
                onSelectReaction={handleSelectReaction}
                originX={fromMe ? itemRectX + itemRectWidth : itemRectX}
                originY={itemRectHeight}
              />

              {/* Replace with rowGap when we refactored menu items */}
              <VStack
                style={{
                  height:
                    MESSAGE_CONTEXT_MENU_SPACE_BETWEEN_ABOVE_MESSAGE_REACTIONS_AND_MESSAGE,
                }}
              />

              {messageComponent}

              {/* Put back once we refactor the menu items */}
              {/* <VStack style={{ height: 16 }}></VStack> */}

              <MessageContextMenuItems
                originX={fromMe ? itemRectX + itemRectWidth : itemRectX}
                originY={itemRectHeight}
                menuItems={menuItems}
              />
            </MessageContextMenuContainer>
          </AnimatedVStack>
        </MessageContextMenuBackdrop>
      </Portal>
      <MessageContextMenuEmojiPicker onSelectReaction={handleSelectReaction} />
    </>
  );
});
