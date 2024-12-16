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
  getMessageById,
  useConversationMessageReactions,
} from "@/features/conversation/conversation-message/conversation-message.utils";
import {
  ConversationStoreProvider,
  useCurrentConversationTopic,
} from "@/features/conversation/conversation.store-context";
import { useReactOnMessage } from "@/features/conversation/hooks/use-react-on-message";
import { useRemoveReactionOnMessage } from "@/features/conversation/hooks/use-remove-reaction-on-message";
import { messageIsFromCurrentUserV3 } from "@/features/conversation/utils/message-is-from-current-user";
import { useCurrentAccountInboxId } from "@/hooks/use-current-account-inbox-id";
import { useConversationQuery } from "@/queries/useConversationQuery";
import { calculateMenuHeight } from "@design-system/ContextMenu/ContextMenu.utils";
import { Portal } from "@gorhom/portal";
import { memo, useCallback } from "react";
import { StyleSheet } from "react-native";
import { MessageContextMenuAboveMessageReactions } from "./conversation-message-context-menu-above-message-reactions";
import { MessageContextMenuContainer } from "./conversation-message-context-menu-container";
import { useMessageContextMenuItems } from "./conversation-message-context-menu.utils";

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

  const { messageId, itemRectX, itemRectY, itemRectHeight, itemRectWidth } =
    messageContextMenuData;

  const account = useCurrentAccount()!;
  const topic = useCurrentConversationTopic();
  const messageContextMenuStore = useMessageContextMenuStore();
  const { data: conversation } = useConversationQuery(account, topic);
  const { data: currentUserInboxId } = useCurrentAccountInboxId();
  const { bySender } = useConversationMessageReactions(messageId!);

  const message = getMessageById({
    messageId,
    topic,
  })!;

  const fromMe = messageIsFromCurrentUserV3({ message });
  const menuItems = useMessageContextMenuItems({
    messageId: messageId,
    topic,
  });
  const menuHeight = calculateMenuHeight(menuItems.length);

  const reactOnMessage = useReactOnMessage({
    conversation: conversation!,
  });
  const removeReactionOnMessage = useRemoveReactionOnMessage({
    conversation: conversation!,
  });

  const handlePressBackdrop = useCallback(() => {
    messageContextMenuStore.getState().setMessageContextMenuData(null);
  }, [messageContextMenuStore]);

  const handleSelectReaction = useCallback(
    (emoji: string) => {
      const currentUserAlreadyReacted = bySender?.[currentUserInboxId!]?.some(
        (reaction) => reaction.content === emoji
      );

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
      currentUserInboxId,
      bySender,
      removeReactionOnMessage,
      messageContextMenuStore,
    ]
  );

  const handleChooseMoreEmojis = useCallback(() => {
    openMessageContextMenuEmojiPicker();
  }, []);

  const hasReactions = Boolean(bySender && Object.keys(bySender).length > 0);

  return (
    <>
      <Portal>
        <ConversationStoreProvider
          topic={topic}
          conversationId={conversation!.id}
        >
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

                {/* Replace with rowGap when we refactored menu items and not using rn-paper TableView */}
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
                  {/* TODO: maybe make ConversationMessage more dumb to not need any context? */}
                  <ConversationMessage message={message} />
                </MessageContextStoreProvider>

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
        </ConversationStoreProvider>
      </Portal>
      <MessageContextMenuEmojiPicker onSelectReaction={handleSelectReaction} />
    </>
  );
});

/**
 * Tried different approaches to implement native context menu, but it's not
 * working as expected. Still missing some pieces from libraries to achieve what we want
 */

// import { MessageContextMenu } from "@/components/Chat/Message/MessageContextMenu";
// import ContextMenu from "react-native-context-menu-view";
// import * as ContextMenu from "zeego/context-menu";

{
  /* <ContextMenuView
          onMenuWillShow={() => {
            console.log("onMenuWillShow");
          }}
          menuConfig={{
            menuTitle: "Message Options",
            menuItems: [
              {
                actionKey: "copy",
                actionTitle: "Copy",
                icon: {
                  type: "IMAGE_SYSTEM",
                  imageValue: {
                    systemName: "doc.on.doc",
                  },
                },
              },
              {
                actionKey: "delete",
                actionTitle: "Delete",
                menuAttributes: ["destructive"],
                icon: {
                  type: "IMAGE_SYSTEM",
                  imageValue: {
                    systemName: "trash",
                  },
                },
              },
            ],
          }}
          auxiliaryPreviewConfig={{
            transitionEntranceDelay: "RECOMMENDED",
            anchorPosition: "top",
            // alignmentHorizontal: "previewTrailing",
            verticalAnchorPosition: "top",
            // height: 600,
            // preferredHeight: {
            //   mode: "percentRelativeToWindow",
            //   percent: 50,
            // },
          }}
          previewConfig={{ previewType: "CUSTOM" }}
          // renderPreview={() => (
          //   <BubbleContentContainer
          //     fromMe={fromMe}
          //     hasNextMessageInSeries={hasNextMessageInSeries}
          //   >
          //     <MessageText inverted={fromMe}>{textContent}</MessageText>
          //   </BubbleContentContainer>
          // )}
          isAuxiliaryPreviewEnabled={true}
          renderPreview={() => (
            // <VStack
            //   style={{
            //     ...debugBorder(),
            //     position: "absolute",
            //     top: 0,
            //     left: 0,
            //     width: 40,
            //     height: 40,
            //   }}
            // ></VStack>
            <BubbleContentContainer
              fromMe={fromMe}
              hasNextMessageInSeries={hasNextMessageInSeries}
            >
              <MessageText inverted={fromMe}>{textContent}</MessageText>
            </BubbleContentContainer>
          )}
          renderAuxiliaryPreview={() => (
            <HStack
              style={{
                ...debugBorder(),
                columnGap: 10,
                padding: 10,
                paddingHorizontal: 20,
                backgroundColor: "white",
                borderRadius: 10,
              }}
            >
              <Text>😅</Text>
              <Text>🤣</Text>
              <Text>😂</Text>
              <Text>🤩</Text>
              <Text>🤗</Text>
              <Text>🤔</Text>
            </HStack>
          )}
        ></ContextMenuView> */
}
