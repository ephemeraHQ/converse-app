import { AnimatedVStack, VStack } from "@/design-system/VStack";
import { useConversationIsUnread } from "@/features/conversation-list/hooks/use-conversation-is-unread";
import { ConversationComposer } from "@/features/conversation/conversation-composer/conversation-composer";
import { ConversationComposerContainer } from "@/features/conversation/conversation-composer/conversation-composer-container";
import {
  ConversationComposerStoreProvider,
  useConversationComposerStore,
} from "@/features/conversation/conversation-composer/conversation-composer.store-context";
import { ConversationConsentPopupDm } from "@/features/conversation/conversation-consent-popup/conversation-consent-popup-dm";
import { ConversationConsentPopupGroup } from "@/features/conversation/conversation-consent-popup/conversation-consent-popup-group";
import { ConversationKeyboardFiller } from "@/features/conversation/conversation-keyboard-filler";
import { ConversationMessage } from "@/features/conversation/conversation-message/conversation-message";
import { useConversationMessageContextMenuEmojiPickerStore } from "@/features/conversation/conversation-message/conversation-message-context-menu/conversation-message-context-menu-emoji-picker/conversation-message-context-menu-emoji-picker.store";
import {
  MessageContextMenuStoreProvider,
  useMessageContextMenuStore,
  useMessageContextMenuStoreContext,
} from "@/features/conversation/conversation-message/conversation-message-context-menu/conversation-message-context-menu.store-context";
import {
  ConversationMessageGestures,
  IMessageGesturesOnLongPressArgs,
} from "@/features/conversation/conversation-message/conversation-message-gestures";
import { ConversationMessageLayout } from "@/features/conversation/conversation-message/conversation-message-layout";
import { MessageReactionsDrawer } from "@/features/conversation/conversation-message/conversation-message-reactions/conversation-message-reaction-drawer/conversation-message-reaction-drawer";
import { ConversationMessageReactions } from "@/features/conversation/conversation-message/conversation-message-reactions/conversation-message-reactions";
import { ConversationMessageRepliable } from "@/features/conversation/conversation-message/conversation-message-repliable";
import { ConversationMessageStatus } from "@/features/conversation/conversation-message/conversation-message-status/conversation-message-status";
import { ConversationMessageTimestamp } from "@/features/conversation/conversation-message/conversation-message-timestamp";
import {
  MessageContextStoreProvider,
  useMessageContextStore,
} from "@/features/conversation/conversation-message/conversation-message.store-context";
import {
  getConvosMessageStatusForXmtpMessage,
  getCurrentUserAlreadyReactedOnMessage,
  isAnActualMessage,
  useMessageHasReactions,
} from "@/features/conversation/conversation-message/conversation-message.utils";
import { ConversationMessagesList } from "@/features/conversation/conversation-messages-list";
import { useMarkConversationAsRead } from "@/features/conversation/hooks/use-mark-conversation-as-read";
import { useReactOnMessage } from "@/features/conversation/hooks/use-react-on-message";
import { useRemoveReactionOnMessage } from "@/features/conversation/hooks/use-remove-reaction-on-message";
import { isConversationAllowed } from "@/features/conversation/utils/is-conversation-allowed";
import { isConversationDm } from "@/features/conversation/utils/is-conversation-dm";
import { messageIsFromCurrentAccountInboxId } from "@/features/conversation/utils/message-is-from-current-user";
import { UserInlineSearch } from "@/features/create-conversation/components/user-inline-search";
import { ConversationSearchResultsList } from "@/features/search/components/conversation-search-results-list";
import { useCurrentAccountInboxId } from "@/hooks/use-current-account-inbox-id";
import { useScreenFocusEffectOnce } from "@/hooks/use-screen-focus-effect-once";
import { useAppStateHandlers } from "@/hooks/useAppStateHandlers";
import { useConversationMessagesQuery } from "@/queries/conversation-messages-query";
import { useAppTheme } from "@/theme/useAppTheme";
import { captureError } from "@/utils/capture-error";
import logger from "@/utils/logger";
import {
  ConversationWithCodecsType,
  DecodedMessageWithCodecsType,
} from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import { useCurrentAccount } from "@data/store/accountsStore";
import { useRouter } from "@navigation/useNavigation";
import { ConversationTopic, MessageId } from "@xmtp/react-native-sdk";
import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
} from "react-native";
import { FadeInDown } from "react-native-reanimated";
import { CONVERSATION_LIST_REFRESH_THRESHOLD } from "./conversation-list.contstants";
import { ConversationMessageHighlighted } from "./conversation-message/conversation-message-highlighted";
import {
  ConversationStoreProvider,
  useCurrentConversationTopic,
} from "./conversation.store-context";

export const Conversation = memo(function Conversation(props: {
  topic: ConversationTopic;
  textPrefill?: string;
}) {
  const { topic, textPrefill = "" } = props;

  const currentAccount = useCurrentAccount()!;

  const navigation = useRouter();

  // const {
  //   data: conversation,
  //   isLoading: isLoadingConversation,
  //   status,
  //   fetchStatus,
  // } = useConversationQuery({
  //   account: currentAccount,
  //   topic,
  //   caller: "Conversation screen",
  // });

  // useHeader({
  //   onBack: () => navigation.goBack(),
  //   safeAreaEdges: ["top"],
  //   titleComponent: conversation ? (
  //     isConversationDm(conversation) ? (
  //       <DmConversationTitle topic={topic} />
  //     ) : isConversationGroup(conversation) ? (
  //       <GroupConversationTitle topic={topic} />
  //     ) : undefined
  //   ) : undefined,
  // });

  // if (!conversation && !isLoadingConversation) {
  //   // TODO: Use EmptyState component
  //   return (
  //     <Center style={{ flex: 1 }}>
  //       <Text
  //         style={{
  //           textAlign: "center",
  //         }}
  //       >
  //         {translate("group_not_found")}
  //       </Text>
  //     </Center>
  //   );
  // }

  // if (!conversation) {
  //   return (
  //     <Center
  //       style={{
  //         flex: 1,
  //       }}
  //     >
  //       <Loader />
  //     </Center>
  //   );
  // }

  return (
    <ConversationStoreProvider
      // conversationId={conversation.id}
      topic={topic}
    >
      <MessageContextMenuStoreProvider>
        <ConversationComposerStoreProvider
          inputValue={textPrefill}
          storeName={topic || "new"}
        >
          <VStack
            // {...debugBorder()}
            style={{
              flex: 1,
            }}
          >
            <UserInlineSearch />

            <VStack style={{ flex: 1 }}>
              <ConversationSearchResultsList />

              {/* <Messages conversation={conversation} /> */}
              <VStack
                style={{
                  flex: 1,
                }}
              />
              <ComposerWrapper />
              <KeyboardFillerWrapper />
            </VStack>
          </VStack>
          {/* <MessageContextMenu /> */}
          <MessageReactionsDrawer />
        </ConversationComposerStoreProvider>
      </MessageContextMenuStoreProvider>
    </ConversationStoreProvider>
  );
});

const KeyboardFillerWrapper = memo(function KeyboardFillerWrapper() {
  const messageContextMenuData = useMessageContextMenuStoreContext(
    (state) => state.messageContextMenuData
  );

  const isEmojiPickerOpen = useConversationMessageContextMenuEmojiPickerStore(
    (state) => state.isEmojiPickerOpen
  );

  return (
    <ConversationKeyboardFiller
      messageContextMenuIsOpen={!!messageContextMenuData}
      enabled={!isEmojiPickerOpen}
    />
  );
});

const ComposerWrapper = memo(function ComposerWrapper(props: {
  conversation: ConversationWithCodecsType;
}) {
  // const { conversation } = props;
  // const { sendMessage } = useSendMessage();

  return (
    <ConversationComposerContainer>
      {/* <ReplyPreview /> */}
      <ConversationComposer
        onSend={async ({ referencedMessageId, content }) => {
          // logger.info("[ConversationComposer] Sending message", {
          //   referencedMessageId: referencedMessageId ?? "none",
          //   hasText: !!content.text,
          //   hasAttachment: !!content.remoteAttachment,
          //   topic: conversation.topic,
          // });
          // try {
          //   await sendMessage({
          //     topic: conversation.topic,
          //     referencedMessageId,
          //     content,
          //   });
          //   logger.info("[ConversationComposer] Message sent successfully", {});
          // } catch (error) {
          //   logger.error("[ConversationComposer] Failed to send message", {
          //     error,
          //   });
          //   throw error;
          // }
        }}
      />
    </ConversationComposerContainer>
  );
});

const Messages = memo(function Messages(props: {
  conversation: ConversationWithCodecsType;
}) {
  const { conversation } = props;

  const currentAccount = useCurrentAccount()!;
  const { data: currentAccountInboxId } = useCurrentAccountInboxId();
  const topic = useCurrentConversationTopic()!;

  const refreshingRef = useRef(false);

  const {
    data: messages,
    isLoading: messagesLoading,
    isRefetching: isRefetchingMessages,
    refetch: refetchMessages,
  } = useConversationMessagesQuery({
    account: currentAccount,
    topic,
    caller: "Conversation Messages",
  });

  // For now we want to make sure we don't miss any messages.
  // If we do things correctly we shouldn't really need this but it's a protection for now.
  useScreenFocusEffectOnce(() => {
    refetchMessages();
  });

  // For now we want to make sure we don't miss any messages.
  // If we do things correctly we shouldn't really need this but it's a protection for now.
  useAppStateHandlers({
    onForeground: () => {
      refetchMessages();
    },
  });

  const latestMessageIdByCurrentUser = useMemo(() => {
    logger.debug("[Messages] Finding latest message by current user", {
      hasMessages: !!messages?.ids,
      currentAccountInboxId,
    });

    if (!messages?.ids) return -1;

    const messageId = messages.ids.find(
      (messageId) =>
        isAnActualMessage(messages.byId[messageId]) &&
        messages.byId[messageId].senderInboxId === currentAccountInboxId
    );

    logger.debug("[Messages] Found latest message by current user", {
      messageId: messageId ?? "none",
      message:
        // JSON.stringify(

        messages.byId[messageId ?? ""].nativeContent.text,
      // null,
      // 2
      // ),
    });

    return messageId;
  }, [messages?.ids, messages?.byId, currentAccountInboxId]);

  const { isUnread } = useConversationIsUnread({
    topic,
  });

  const { markAsReadAsync } = useMarkConversationAsRead({
    topic,
  });

  // TODO: Need improvment but okay for now
  useEffect(() => {
    if (isUnread && !messagesLoading) {
      markAsReadAsync().catch(captureError);
    }
  }, [isUnread, messagesLoading, markAsReadAsync]);

  const handleRefresh = useCallback(async () => {
    try {
      refreshingRef.current = true;
      await refetchMessages();
    } catch (e) {
      captureError(e);
    } finally {
      refreshingRef.current = false;
    }
  }, [refetchMessages]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (refreshingRef.current && !isRefetchingMessages) return;
      if (e.nativeEvent.contentOffset.y < CONVERSATION_LIST_REFRESH_THRESHOLD) {
        handleRefresh();
      }
    },
    [handleRefresh, isRefetchingMessages]
  );

  const allMessages = Object.values(messages?.byId ?? {});

  return (
    <ConversationMessagesList
      messages={allMessages}
      refreshing={isRefetchingMessages}
      onRefresh={Platform.OS === "android" ? refetchMessages : undefined}
      onScroll={onScroll}
      ListEmptyComponent={
        isConversationDm(conversation) ? (
          <DmConversationEmpty />
        ) : (
          <GroupConversationEmpty />
        )
      }
      ListHeaderComponent={
        !isConversationAllowed(conversation) ? (
          isConversationDm(conversation) ? (
            <ConversationConsentPopupDm />
          ) : (
            <ConversationConsentPopupGroup />
          )
        ) : undefined
      }
      renderMessage={({ message, index }) => {
        const previousMessage = messages?.byId[messages?.ids[index + 1]];
        const nextMessage = messages?.byId[messages?.ids[index - 1]];

        return (
          <ConversationMessagesListItem
            message={message}
            previousMessage={previousMessage}
            nextMessage={nextMessage}
            isLatestMessageSentByCurrentUser={
              (logger.debug(
                "[Messages] Checking if latest message is sent by current user",
                {
                  latestMessageIdByCurrentUser: latestMessageIdByCurrentUser,
                  messageId: message.id,
                }
              ),
              latestMessageIdByCurrentUser === message.id)
            }
            animateEntering={
              index === 0 &&
              // Need this because otherwise because our optimistic updates, we first create a dummy message with a random id
              // and then replace it with the real message. But the replacment triggers a new element in the list because we use messageId as key extractor
              // Maybe we can have a better solution in the future. Just okay for now until we either have better serialization
              // or have better ways to handle optimistic updates.
              // @ts-expect-error until we have better serialization and have our own message type
              message.deliveryStatus === "sending"
            }
          />
        );
      }}
    />
  );
});

const ConversationMessagesListItem = memo(
  function ConversationMessagesListItem(props: {
    message: DecodedMessageWithCodecsType;
    previousMessage: DecodedMessageWithCodecsType | undefined;
    nextMessage: DecodedMessageWithCodecsType | undefined;
    isLatestMessageSentByCurrentUser: boolean;
    animateEntering: boolean;
  }) {
    const {
      message,
      previousMessage,
      nextMessage,
      isLatestMessageSentByCurrentUser,
      animateEntering,
    } = props;
    const { theme } = useAppTheme();
    const composerStore = useConversationComposerStore();

    const handleReply = useCallback(() => {
      composerStore.getState().setReplyToMessageId(message.id as MessageId);
    }, [composerStore, message]);

    const isFromCurrentUser = messageIsFromCurrentAccountInboxId({
      message,
    });

    const messageHasReactions = useMessageHasReactions({
      messageId: message.id,
    });

    return (
      <MessageContextStoreProvider
        message={message}
        previousMessage={previousMessage}
        nextMessage={nextMessage}
      >
        <AnimatedVStack
          {...(animateEntering && {
            entering: FadeInDown.springify()
              .damping(theme.animation.spring.damping)
              .stiffness(theme.animation.spring.stiffness)
              .withInitialValues({
                transform: [
                  {
                    translateY: 60,
                  },
                ],
              }),
          })}
        >
          <ConversationMessageTimestamp />
          <ConversationMessageRepliable
            onReply={handleReply}
            messageIsFromCurrentUser={isFromCurrentUser}
          >
            <ConversationMessageLayout
              message={
                <ConversationMessageGesturesWrapper>
                  <ConversationMessageHighlighted>
                    <ConversationMessage message={message} />
                  </ConversationMessageHighlighted>
                </ConversationMessageGesturesWrapper>
              }
              reactions={
                messageHasReactions && <ConversationMessageReactions />
              }
              messageStatus={
                isLatestMessageSentByCurrentUser && (
                  <ConversationMessageStatus
                    status={getConvosMessageStatusForXmtpMessage(message)}
                  />
                )
              }
            />
          </ConversationMessageRepliable>
        </AnimatedVStack>
      </MessageContextStoreProvider>
    );
  }
);

const ConversationMessageGesturesWrapper = memo(
  function ConversationMessageGesturesWrapper(props: {
    children: React.ReactNode;
  }) {
    const messageContextMenuStore = useMessageContextMenuStore();
    const messageStore = useMessageContextStore();
    const topic = useCurrentConversationTopic()!;

    const reactOnMessage = useReactOnMessage({
      topic,
    });
    const removeReactionOnMessage = useRemoveReactionOnMessage({
      topic,
    });

    const handleLongPress = useCallback(
      (e: IMessageGesturesOnLongPressArgs) => {
        const messageId = messageStore.getState().messageId;
        messageContextMenuStore.getState().setMessageContextMenuData({
          messageId,
          itemRectX: e.pageX,
          itemRectY: e.pageY,
          itemRectHeight: e.height,
          itemRectWidth: e.width,
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

    const handleDoubleTap = useCallback(() => {
      const messageId = messageStore.getState().messageId;
      const alreadyReacted = getCurrentUserAlreadyReactedOnMessage({
        messageId,
        topic,
        emoji: "❤️",
      });
      if (alreadyReacted) {
        removeReactionOnMessage({
          messageId,
          emoji: "❤️",
        });
      } else {
        reactOnMessage({
          messageId,
          emoji: "❤️",
        });
      }
    }, [reactOnMessage, removeReactionOnMessage, messageStore, topic]);

    return (
      <ConversationMessageGestures
        onLongPress={handleLongPress}
        onTap={handleTap}
        onDoubleTap={handleDoubleTap}
      >
        {props.children}
      </ConversationMessageGestures>
    );
  }
);

const DmConversationEmpty = memo(function DmConversationEmpty() {
  // Will never really be empty anyway because to create the DM conversation the user has to send a first message
  return null;
});

const GroupConversationEmpty = memo(() => {
  // Will never really be empty anyway becaue we have group updates
  return null;
});
