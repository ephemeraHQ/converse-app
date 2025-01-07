import { useCurrentAccount } from "@/data/store/accountsStore";
import { AnimatedVStack, VStack } from "@/design-system/VStack";
import { ConversationMessage } from "@/features/conversation/conversation-message/conversation-message";
import { MessageContextMenuBackdrop } from "@/features/conversation/conversation-message/conversation-message-context-menu/conversation-message-context-menu-backdrop";
import { MessageContextMenuEmojiPicker } from "@/features/conversation/conversation-message/conversation-message-context-menu/conversation-message-context-menu-emoji-picker/conversation-message-context-menu-emoji-picker";
import { openMessageContextMenuEmojiPicker } from "@/features/conversation/conversation-message/conversation-message-context-menu/conversation-message-context-menu-emoji-picker/conversation-message-context-menu-emoji-picker-utils";
import { MessageContextMenuItems } from "@/features/conversation/conversation-message/conversation-message-context-menu/conversation-message-context-menu-items";
import { MessageContextMenuReactors } from "@/features/conversation/conversation-message/conversation-message-context-menu/conversation-message-context-menu-reactors";
import {
  IMessageContextMenuStoreState,
  useMessageContextMenuStore,
  useMessageContextMenuStoreContext,
} from "@/features/conversation/conversation-message/conversation-message-context-menu/conversation-message-context-menu.store-context";
import { MessageContextStoreProvider } from "@/features/conversation/conversation-message/conversation-message.store-context";
import {
  getCurrentUserAlreadyReactedOnMessage,
  getMessageById,
  useConversationMessageReactions,
} from "@/features/conversation/conversation-message/conversation-message.utils";
import {
  ConversationStoreProvider,
  useCurrentConversationTopic,
} from "@/features/conversation/conversation.store-context";
import { useReactOnMessage } from "@/features/conversation/hooks/use-react-on-message";
import { useRemoveReactionOnMessage } from "@/features/conversation/hooks/use-remove-reaction-on-message";
import { messageIsFromCurrentAccountInboxId } from "@/features/conversation/utils/message-is-from-current-user";
import { useConversationQuery } from "@/queries/useConversationQuery";
import { calculateMenuHeight } from "@design-system/ContextMenu/ContextMenu.utils";
import { memo, useCallback } from "react";
import { StyleSheet, Modal, View, Platform } from "react-native";
import { MessageContextMenuAboveMessageReactions } from "./conversation-message-context-menu-above-message-reactions";
import { MessageContextMenuContainer } from "./conversation-message-context-menu-container";
import { useMessageContextMenuItems } from "./conversation-message-context-menu.utils";
import { useAppTheme } from "@theme/useAppTheme";
import Animated from "react-native-reanimated";

export const MESSAGE_CONTEXT_MENU_SPACE_BETWEEN_ABOVE_MESSAGE_REACTIONS_AND_MESSAGE = 16;

export const MessageContextMenu = memo(function MessageContextMenu() {
  const messageContextMenuData = useMessageContextMenuStoreContext(
    (state) => state.messageContextMenuData
  );

  if (!messageContextMenuData) {
    return null;
  }

  return <Content messageContextMenuData={messageContextMenuData} />;
});

const Content = memo(function Content(props: {
  messageContextMenuData: NonNullable<
    IMessageContextMenuStoreState["messageContextMenuData"]
  >;
}) {
  const { messageContextMenuData } = props;
  const { theme } = useAppTheme();

  const { messageId, itemRectX, itemRectY, itemRectHeight, itemRectWidth } =
    messageContextMenuData;

  const account = useCurrentAccount()!;
  const topic = useCurrentConversationTopic();
  const messageContextMenuStore = useMessageContextMenuStore();
  const { data: conversation } = useConversationQuery({
    account,
    topic,
  });
  const { bySender } = useConversationMessageReactions(messageId!);

  const message = getMessageById({
    messageId,
    topic,
  })!;

  const fromMe = messageIsFromCurrentAccountInboxId({ message });
  const menuItems = useMessageContextMenuItems({
    messageId: messageId,
    topic,
  });
  const menuHeight = calculateMenuHeight(menuItems.length);

  const reactOnMessage = useReactOnMessage({
    topic,
  });
  const removeReactionOnMessage = useRemoveReactionOnMessage({
    topic,
  });

  const handlePressBackdrop = useCallback(() => {
    messageContextMenuStore.getState().setMessageContextMenuData(null);
  }, [messageContextMenuStore]);

  const handleSelectReaction = useCallback(
    (emoji: string) => {
      const currentUserAlreadyReacted = getCurrentUserAlreadyReactedOnMessage({
        messageId,
        topic,
        emoji,
      });

      if (currentUserAlreadyReacted) {
        removeReactionOnMessage({
          messageId: messageId,
          emoji,
        });
      } else {
        reactOnMessage({ messageId: messageId, emoji });
      }
      messageContextMenuStore.getState().setMessageContextMenuData(null);
    },
    [
      reactOnMessage,
      messageId,
      removeReactionOnMessage,
      messageContextMenuStore,
      topic,
    ]
  );

  const handleChooseMoreEmojis = useCallback(() => {
    openMessageContextMenuEmojiPicker();
  }, []);

  const hasReactions = Boolean(bySender && Object.keys(bySender).length > 0);

  return (
    <>
      <Modal
        visible={true}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={Platform.OS === "android"}
      >
        <Animated.View style={StyleSheet.absoluteFill}>
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
                  topic={topic}
                  reactors={bySender ?? {}}
                  messageId={messageId}
                  onChooseMoreEmojis={handleChooseMoreEmojis}
                  onSelectReaction={handleSelectReaction}
                  originX={fromMe ? itemRectX + itemRectWidth : itemRectX}
                  originY={itemRectHeight}
                />

                <VStack
                  style={{
                    height:
                      MESSAGE_CONTEXT_MENU_SPACE_BETWEEN_ABOVE_MESSAGE_REACTIONS_AND_MESSAGE,
                  }}
                />

                <MessageContextStoreProvider
                  message={message}
                  nextMessage={undefined}
                  previousMessage={undefined}
                >
                  <ConversationMessage message={message} />
                </MessageContextStoreProvider>

                <MessageContextMenuItems
                  originX={fromMe ? itemRectX + itemRectWidth : itemRectX}
                  originY={itemRectHeight}
                  menuItems={menuItems}
                />
              </MessageContextMenuContainer>
            </AnimatedVStack>
          </MessageContextMenuBackdrop>
        </Animated.View>
      </Modal>
      <MessageContextMenuEmojiPicker onSelectReaction={handleSelectReaction} />
    </>
  );
});
