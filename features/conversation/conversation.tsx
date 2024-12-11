import { VStack } from "@/design-system/VStack";
import { Loader } from "@/design-system/loader";
import { ExternalWalletPicker } from "@/features/ExternalWalletPicker/ExternalWalletPicker";
import { ExternalWalletPickerContextProvider } from "@/features/ExternalWalletPicker/ExternalWalletPicker.context";
import { useConversationIsUnread } from "@/features/conversation-list/hooks/useMessageIsUnread";
import { useToggleReadStatus } from "@/features/conversation-list/hooks/useToggleReadStatus";
import { Composer } from "@/features/conversation/conversation-composer/conversation-composer";
import {
  ConversationComposerStoreProvider,
  useConversationComposerStore,
} from "@/features/conversation/conversation-composer/conversation-composer.store-context";
import { DmConsentPopup } from "@/features/conversation/conversation-consent-popup/conversation-consent-popup-dm";
import { GroupConsentPopup } from "@/features/conversation/conversation-consent-popup/conversation-consent-popup-group";
import { GroupConversationTitle } from "@/features/conversation/conversation-group-header-title";
import { KeyboardFiller } from "@/features/conversation/conversation-keyboard-filler";
import { ConversationMessageDateChange } from "@/features/conversation/conversation-message-date-change";
import {
  IMessageGesturesOnLongPressArgs,
  MessageGestures,
} from "@/features/conversation/conversation-message-gestures";
import { ConversationMessageTimestamp } from "@/features/conversation/conversation-message-timestamp";
import {
  MessageContextStoreProvider,
  useMessageContextStore,
} from "@/features/conversation/conversation-message.store-context";
import { ConversationMessage } from "@/features/conversation/conversation-message/conversation-message";
import { MessageContextMenu } from "@/features/conversation/conversation-message/conversation-message-context-menu/conversation-message-context-menu";
import {
  MessageContextMenuStoreProvider,
  useMessageContextMenuStore,
} from "@/features/conversation/conversation-message/conversation-message-context-menu/conversation-message-context-menu.store-context";
import { ConversationMessageLayout } from "@/features/conversation/conversation-message/conversation-message-layout";
import { MessageReactionsDrawer } from "@/features/conversation/conversation-message/conversation-message-reactions/conversation-message-reaction-drawer/conversation-message-reaction-drawer";
import { ConversationMessageReactions } from "@/features/conversation/conversation-message/conversation-message-reactions/conversation-message-reactions";
import { ConversationMessageRepliable } from "@/features/conversation/conversation-message/conversation-message-repliable";
import { ConversationMessagesList } from "@/features/conversation/conversation-messages-list";
import { useCurrentConversationTopic } from "@/features/conversation/conversation.service";
import { ConversationStoreProvider } from "@/features/conversation/conversation.store-context";
import { useSendMessage } from "@/features/conversation/hooks/use-send-message";
import { isConversationAllowed } from "@/features/conversation/utils/is-conversation-allowed";
import { isConversationDm } from "@/features/conversation/utils/is-conversation-dm";
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group";
import { useConversationQuery } from "@/queries/useConversationQuery";
import { useGroupNameQuery } from "@/queries/useGroupNameQuery";
import { ConversationWithCodecsType } from "@/utils/xmtpRN/client.types";
import { useCurrentAccount } from "@data/store/accountsStore";
import { Button } from "@design-system/Button/Button";
import { Center } from "@design-system/Center";
import { Text } from "@design-system/Text";
import { translate } from "@i18n/translate";
import { useRouter } from "@navigation/useNavigation";
import { useConversationMessages } from "@queries/useConversationMessages";
import { useAppTheme } from "@theme/useAppTheme";
import { ConversationTopic, MessageId } from "@xmtp/react-native-sdk";
import React, { memo, useCallback, useEffect, useRef } from "react";

export const Conversation = memo(function Conversation(props: {
  topic: ConversationTopic;
  textPrefill?: string;
}) {
  const { topic, textPrefill = "" } = props;

  const currentAccount = useCurrentAccount()!;

  const navigation = useRouter();

  const { data: conversation, isLoading: isLoadingConversation } =
    useConversationQuery(currentAccount, topic);

  useEffect(() => {
    if (!conversation) {
      return;
    }
    if (isConversationDm(conversation)) {
      navigation.setOptions({
        headerTitle: () => <GroupConversationTitle topic={topic} />,
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
            <KeyboardFiller />
            <MessageContextMenu />
            <MessageReactionsDrawer />
            <ExternalWalletPicker title="Choose a wallet" />
          </ConversationComposerStoreProvider>
        </MessageContextMenuStoreProvider>
      </ConversationStoreProvider>
    </ExternalWalletPickerContextProvider>
  );
});

const ComposerWrapper = memo(function ComposerWrapper(props: {
  conversation: ConversationWithCodecsType;
}) {
  const { conversation } = props;
  const sendMessage = useSendMessage({
    conversation,
  });
  return <Composer onSend={sendMessage} />;
});

const Messages = memo(function Messages(props: {
  conversation: ConversationWithCodecsType;
}) {
  const { conversation } = props;

  const currentAccount = useCurrentAccount()!;
  const topic = useCurrentConversationTopic()!;

  const {
    data: messages,
    isLoading: messagesLoading,
    isRefetching: isRefetchingMessages,
    refetch,
  } = useConversationMessages(currentAccount, topic!);

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

  const composerStore = useConversationComposerStore();

  return (
    <ConversationMessagesList
      messageIds={messages?.ids ?? []}
      refreshing={isRefetchingMessages}
      onRefresh={refetch}
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
            <GroupConsentPopup />
          ) : (
            <DmConsentPopup />
          )
        ) : undefined
      }
      renderMessage={({ messageId, index }) => {
        const message = messages?.byId[messageId]!;
        const previousMessage = messages?.byId[messages?.ids[index + 1]];
        const nextMessage = messages?.byId[messages?.ids[index - 1]];

        return (
          <MessageContextStoreProvider
            message={message}
            previousMessage={previousMessage}
            nextMessage={nextMessage}
          >
            <VStack>
              <ConversationMessageDateChange />
              <ConversationMessageTimestamp />
              <ConversationMessageRepliable
                onReply={() => {
                  composerStore
                    .getState()
                    .setReplyToMessageId(message.id as MessageId);
                }}
              >
                <ConversationMessageLayout>
                  <WithGestures>
                    <ConversationMessage message={message} />
                  </WithGestures>
                  <ConversationMessageReactions />
                </ConversationMessageLayout>
              </ConversationMessageRepliable>
            </VStack>
          </MessageContextStoreProvider>
        );
      }}
    />
  );
});

const WithGestures = memo(function WithGestures({
  children,
}: {
  children: React.ReactNode;
}) {
  const messageStore = useMessageContextStore();

  const messageContextMenuStore = useMessageContextMenuStore();

  const handleLongPress = useCallback(
    (e: IMessageGesturesOnLongPressArgs) => {
      const messageId = messageStore.getState().messageId;
      const message = messageStore.getState().message;
      const previousMessage = messageStore.getState().previousMessage;
      const nextMessage = messageStore.getState().nextMessage;

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
        messageComponent: (
          <MessageContextStoreProvider
            message={message}
            previousMessage={previousMessage}
            nextMessage={nextMessage}
          >
            {children}
          </MessageContextStoreProvider>
        ),
      });
    },
    [messageStore, messageContextMenuStore, children]
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
});

const DmConversationEmpty = memo(function DmConversationEmpty() {
  return null;
});

const GroupConversationEmpty = memo(() => {
  const { theme } = useAppTheme();

  const currentAccount = useCurrentAccount()!;
  const topic = useCurrentConversationTopic();

  const { data: groupName } = useGroupNameQuery(currentAccount, topic);

  const { data: conversation } = useConversationQuery(currentAccount, topic);

  const sendMessage = useSendMessage({
    conversation: conversation!,
  });

  const handleSend = useCallback(() => {
    sendMessage({
      content: {
        text: "👋",
      },
    });
  }, [sendMessage]);

  return (
    <Center
      style={{
        flexGrow: 1,
        flexDirection: "column",
      }}
    >
      <Text
        style={{
          textAlign: "center",
        }}
      >
        {translate("group_placeholder.placeholder_text", {
          groupName,
        })}
      </Text>

      <Button
        variant="fill"
        icon="hand.wave"
        text={translate("say_hi")}
        onPress={handleSend}
        style={{
          alignSelf: "center",
          marginTop: theme.spacing.md,
        }}
      />
    </Center>
  );
});
