import { Loader } from "@/design-system/loader";
import { ExternalWalletPicker } from "@/features/ExternalWalletPicker/ExternalWalletPicker";
import { ExternalWalletPickerContextProvider } from "@/features/ExternalWalletPicker/ExternalWalletPicker.context";
import { useConversationIsUnread } from "@/features/conversation-list/hooks/useMessageIsUnread";
import { useToggleReadStatus } from "@/features/conversation-list/hooks/useToggleReadStatus";
import { Composer } from "@/features/conversation/conversation-composer/conversation-composer";
import { ConversationComposerContainer } from "@/features/conversation/conversation-composer/conversation-composer-container";
import { ReplyPreview } from "@/features/conversation/conversation-composer/conversation-composer-reply-preview";
import {
  ConversationComposerStoreProvider,
  useConversationComposerStore,
} from "@/features/conversation/conversation-composer/conversation-composer.store-context";
import { DmConsentPopup } from "@/features/conversation/conversation-consent-popup/conversation-consent-popup-dm";
import { GroupConsentPopup } from "@/features/conversation/conversation-consent-popup/conversation-consent-popup-group";
import { DmConversationTitle } from "@/features/conversation/conversation-header/conversation-dm-header-title";
import { GroupConversationTitle } from "@/features/conversation/conversation-header/conversation-group-header-title";
import { KeyboardFiller } from "@/features/conversation/conversation-keyboard-filler";
import { ConversationMessage } from "@/features/conversation/conversation-message/conversation-message";
import { MessageContextMenu } from "@/features/conversation/conversation-message/conversation-message-context-menu/conversation-message-context-menu";
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
  getConvosMessageStatus,
  getCurrentUserAlreadyReactedOnMessage,
  isAnActualMessage,
} from "@/features/conversation/conversation-message/conversation-message.utils";
import { ConversationMessagesList } from "@/features/conversation/conversation-messages-list";
import { useReactOnMessage } from "@/features/conversation/hooks/use-react-on-message";
import { useRemoveReactionOnMessage } from "@/features/conversation/hooks/use-remove-reaction-on-message";
import { useSendMessage } from "@/features/conversation/hooks/use-send-message";
import { isConversationAllowed } from "@/features/conversation/utils/is-conversation-allowed";
import { isConversationDm } from "@/features/conversation/utils/is-conversation-dm";
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group";
import { useCurrentAccountInboxId } from "@/hooks/use-current-account-inbox-id";
import { useConversationQuery } from "@/queries/useConversationQuery";
import {
  ConversationWithCodecsType,
  DecodedMessageWithCodecsType,
} from "@/utils/xmtpRN/client.types";
import { useCurrentAccount } from "@data/store/accountsStore";
import { Center } from "@design-system/Center";
import { Text } from "@design-system/Text";
import { translate } from "@i18n/translate";
import { useRouter } from "@navigation/useNavigation";
import { useConversationMessages } from "@queries/useConversationMessages";
import { ConversationTopic, MessageId } from "@xmtp/react-native-sdk";
import React, {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { ConversationMessageHighlighted } from "./conversation-message/conversation-message-highlighted";
import {
  ConversationStoreProvider,
  useCurrentConversationTopic,
} from "./conversation.store-context";
import { CONVERSATION_LIST_REFRESH_THRESHOLD } from "./conversation-list.contstants";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
} from "react-native";

export const Conversation = memo(function Conversation(props: {
  topic: ConversationTopic;
  textPrefill?: string;
}) {
  const { topic, textPrefill = "" } = props;

  const currentAccount = useCurrentAccount()!;

  const navigation = useRouter();

  const { data: conversation, isLoading: isLoadingConversation } =
    useConversationQuery({
      account: currentAccount,
      topic,
    });

  useLayoutEffect(() => {
    if (!conversation) {
      return;
    }
    if (isConversationDm(conversation)) {
      navigation.setOptions({
        headerTitle: () => <DmConversationTitle topic={topic} />,
      });
    } else if (isConversationGroup(conversation)) {
      navigation.setOptions({
        headerTitle: () => <GroupConversationTitle topic={topic} />,
      });
    }
  }, [topic, navigation, conversation]);

  if (!conversation && !isLoadingConversation) {
    // TODO: Use EmptyState component
    return (
      <Center style={{ flex: 1 }}>
        <Text
          style={{
            textAlign: "center",
          }}
        >
          {translate("group_not_found")}
        </Text>
      </Center>
    );
  }

  if (!conversation) {
    return (
      <Center
        style={{
          flex: 1,
        }}
      >
        <Loader />
      </Center>
    );
  }

  return (
    <ExternalWalletPickerContextProvider>
      <ConversationStoreProvider conversationId={conversation.id} topic={topic}>
        <MessageContextMenuStoreProvider>
          <ConversationComposerStoreProvider
            inputValue={textPrefill}
            storeName={topic}
          >
            <Messages conversation={conversation} />
            <ComposerWrapper conversation={conversation} />
            <KeyboardFillerWrapper />
            <MessageContextMenu />
            <MessageReactionsDrawer />
            <ExternalWalletPicker title="Choose a wallet" />
          </ConversationComposerStoreProvider>
        </MessageContextMenuStoreProvider>
      </ConversationStoreProvider>
    </ExternalWalletPickerContextProvider>
  );
});

const KeyboardFillerWrapper = memo(function KeyboardFillerWrapper() {
  const messageContextMenuData = useMessageContextMenuStoreContext(
    (state) => state.messageContextMenuData
  );
  return <KeyboardFiller messageContextMenuIsOpen={!!messageContextMenuData} />;
});

const ComposerWrapper = memo(function ComposerWrapper(props: {
  conversation: ConversationWithCodecsType;
}) {
  const { conversation } = props;
  const sendMessage = useSendMessage({
    conversation,
  });

  return (
    <ConversationComposerContainer>
      <ReplyPreview />
      <Composer onSend={sendMessage} />
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
    refetch,
  } = useConversationMessages(currentAccount, topic!);

  const latestMessageIdByCurrentUser = useMemo(() => {
    if (!messages?.ids) return -1;
    return messages.ids.find(
      (messageId) =>
        isAnActualMessage(messages.byId[messageId]) &&
        messages.byId[messageId].senderInboxId === currentAccountInboxId
    );
  }, [messages?.ids, messages?.byId, currentAccountInboxId]);

  const isUnread = useConversationIsUnread({
    topic,
    lastMessage: messages?.byId[messages?.ids[0]], // Get latest message
    timestampNs: messages?.byId[messages?.ids[0]]?.sentNs ?? 0,
  });

  const toggleReadStatus = useToggleReadStatus({
    topic,
    isUnread,
    currentAccount,
  });

  const hasMarkedAsRead = useRef(false);

  useEffect(() => {
    if (isUnread && !messagesLoading && !hasMarkedAsRead.current) {
      toggleReadStatus();
      hasMarkedAsRead.current = true;
    }
  }, [isUnread, messagesLoading, toggleReadStatus]);

  const handleRefresh = useCallback(async () => {
    try {
      refreshingRef.current = true;
      await refetch();
    } catch (e) {
      console.error(e);
    } finally {
      refreshingRef.current = false;
    }
  }, [refetch]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (refreshingRef.current && !isRefetchingMessages) return;
      if (e.nativeEvent.contentOffset.y < CONVERSATION_LIST_REFRESH_THRESHOLD) {
        handleRefresh();
      }
    },
    [handleRefresh, isRefetchingMessages]
  );

  return (
    <ConversationMessagesList
      messageIds={messages?.ids ?? []}
      refreshing={isRefetchingMessages}
      onRefresh={Platform.OS === "android" ? refetch : undefined}
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
            <DmConsentPopup />
          ) : (
            <GroupConsentPopup />
          )
        ) : undefined
      }
      renderMessage={({ messageId, index }) => {
        const message = messages?.byId[messageId]!;
        const previousMessage = messages?.byId[messages?.ids[index + 1]];
        const nextMessage = messages?.byId[messages?.ids[index - 1]];

        return (
          <ConversationMessagesListItem
            message={message}
            previousMessage={previousMessage}
            nextMessage={nextMessage}
            isLatestMessageSentByCurrentUser={
              latestMessageIdByCurrentUser === messageId
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
  }) {
    const {
      message,
      previousMessage,
      nextMessage,
      isLatestMessageSentByCurrentUser,
    } = props;
    const composerStore = useConversationComposerStore();

    const handleReply = useCallback(() => {
      composerStore.getState().setReplyToMessageId(message.id as MessageId);
    }, [composerStore, message]);

    return (
      <MessageContextStoreProvider
        message={message}
        previousMessage={previousMessage}
        nextMessage={nextMessage}
      >
        <ConversationMessageTimestamp />
        <ConversationMessageRepliable onReply={handleReply}>
          <ConversationMessageLayout>
            <ConversationMessageGesturesWrapper>
              <ConversationMessageHighlighted>
                <ConversationMessage message={message} />
              </ConversationMessageHighlighted>
            </ConversationMessageGesturesWrapper>
            <ConversationMessageReactions />
            {isLatestMessageSentByCurrentUser && (
              <ConversationMessageStatus
                status={getConvosMessageStatus(message)}
              />
            )}
          </ConversationMessageLayout>
        </ConversationMessageRepliable>
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
