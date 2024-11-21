import { ChatDumb } from "@components/Chat/ChatDumb";
import { useCurrentAccount } from "@data/store/accountsStore";
import { useConversationMessages } from "@queries/useConversationMessages";
import {
  setConversationQueryData,
  useConversationScreenQuery,
} from "@queries/useConversationQuery";
import { ListRenderItem } from "@shopify/flash-list";
import { textPrimaryColor, textSecondaryColor } from "@styles/colors";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, useColorScheme, View, ViewStyle } from "react-native";

import { GroupChatPlaceholder } from "@components/Chat/ChatPlaceholder/GroupChatPlaceholder";
import {
  ConversationTopic,
  ConversationVersion,
  RemoteAttachmentContent,
} from "@xmtp/react-native-sdk";
import { ConversationContext } from "@utils/conversation";
import { TextInputWithValue } from "@utils/str";
import { MediaPreview } from "@data/store/chatStore";
import { V3Message } from "@components/Chat/Message/V3Message";
import { navigate } from "@utils/navigation";
import { getDraftMessage, setDraftMessage } from "../utils/textDrafts";
import { useRouter } from "@navigation/useNavigation";
import { GroupConversationTitle } from "./GroupConversationTitle";
import { DmConversationTitle } from "./DmConversationTitle";
import { ThemedStyle, useAppTheme } from "@theme/useAppTheme";
import { createConversationByAccount } from "@utils/xmtpRN/conversations";
// import { DmChatPlaceholder } from "@components/Chat/ChatPlaceholder/ChatPlaceholder";

type UseDataProps = {
  topic: ConversationTopic | undefined;
};

const useData = ({ topic }: UseDataProps) => {
  const currentAccount = useCurrentAccount()!;
  const {
    data: conversation,
    isLoading,
    isRefetching,
  } = useConversationScreenQuery(currentAccount, topic!);

  const { data: messages, isLoading: messagesLoading } =
    useConversationMessages(currentAccount, topic!);

  useEffect(() => {
    const checkActive = async () => {
      if (!conversation) return;
      if (conversation.version === ConversationVersion.GROUP) {
        const isActive = conversation.isGroupActive;
        // If not active leave the screen
        if (!isActive) {
          navigate("Chats");
        }
      }
    };
    checkActive();
  }, [conversation]);

  return {
    conversation,
    messages,
    messagesLoading,
    isLoading,
    isRefetching,
  };
};

const $container: ViewStyle = {
  flex: 1,
};

const $chatContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  justifyContent: "flex-end",
  backgroundColor: colors.background.surface,
});

const useDisplayInfo = () => {
  const colorScheme = useColorScheme();
  const headerTintColor =
    Platform.OS === "android"
      ? textSecondaryColor(colorScheme)
      : textPrimaryColor(colorScheme);
  return { headerTintColor };
};

const keyExtractor = (item: string) => item;
const getItemTypeCallback = () => {
  return "MESSAGE";
};

type V3ConversationProps = {
  topic?: ConversationTopic;
  peerAddress?: string;
  textPrefill?: string;
};

export const V3Conversation = ({
  topic,
  peerAddress,
  textPrefill,
}: V3ConversationProps) => {
  // TODO Update values
  const navigation = useRouter();
  const showChatInput = true;

  const { conversation, messages, messagesLoading, isRefetching, isLoading } =
    useData({
      topic,
    });
  const currentAccount = useCurrentAccount()!;
  const { themed } = useAppTheme();
  const { headerTintColor } = useDisplayInfo();

  const onReadyToFocus = useCallback(() => {}, []);

  const renderItem: ListRenderItem<string> = useCallback(
    ({ item, index }) => (
      <V3Message
        item={item}
        index={index}
        currentAccount={currentAccount}
        topic={topic!}
      />
    ),
    [currentAccount, topic]
  );

  const showPlaceholder =
    ((messages?.ids.length ?? 0) === 0 && !messagesLoading) ||
    (!conversation && !isLoading);
  const displayList = !showPlaceholder;

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => {
        if (!conversation) return null;
        if (conversation.version === ConversationVersion.GROUP) {
          return <GroupConversationTitle topic={topic!} />;
        }
        return <DmConversationTitle topic={topic!} />;
      },
      headerTintColor,
    });
  }, [headerTintColor, navigation, conversation, topic]);

  const handleSend = useCallback(
    async (sendContent: SendContent) => {
      if (!conversation && peerAddress) {
        const conversation = await createConversationByAccount(
          currentAccount,
          peerAddress
        );
        setConversationQueryData(
          currentAccount,
          conversation.topic,
          conversation
        );
        navigation.setParams({ topic: conversation.topic });
        await conversation.send(sendContent);
        return;
      }
      await conversation?.send(sendContent);
    },
    [conversation, currentAccount, navigation, peerAddress]
  );

  const onSend = useCallback(
    async ({
      text,
      referencedMessageId,
      attachment,
    }: {
      text?: string;
      referencedMessageId?: string;
      attachment?: RemoteAttachmentContent;
    }) => {
      if (referencedMessageId) {
        if (attachment) {
          await handleSend({
            reply: {
              reference: referencedMessageId,
              content: { remoteAttachment: attachment },
            },
          });
        }
        if (text) {
          await handleSend({
            reply: {
              reference: referencedMessageId,
              content: { text },
            },
          });
        }
        return;
      }
      if (attachment) {
        await handleSend({
          remoteAttachment: attachment,
        });
      }
      if (text) {
        await handleSend(text);
      }
    },
    [handleSend]
  );

  const onLeaveScreen = useCallback(() => {
    // useChatStore.getState().setOpenedConversationTopic(null);
    setDraftMessage(topic!, textInputRef.current?.currentValue ?? "");
  }, [topic]);

  useEffect(() => {
    const unsubscribeBeforeRemove = navigation.addListener(
      "beforeRemove",
      onLeaveScreen
    );

    return () => {
      unsubscribeBeforeRemove();
    };
  }, [navigation, onLeaveScreen]);

  const placeholderComponent = useMemo(() => {
    if (!conversation) return null;
    if (conversation.version == ConversationVersion.GROUP) {
      return (
        <GroupChatPlaceholder
          messagesCount={messages?.ids.length ?? 0}
          onSend={onSend}
          group={conversation}
        />
      );
    }
    // TODO: Add DM placeholder
    return null;
    // return (
    //   <ChatPlaceholder
    //     messagesCount={messages?.ids.length ?? 0}
    //     onSend={onSend}
    //     conversation={conversation}
    //   />
    // );
  }, [conversation, messages?.ids.length, onSend]);

  const messageToPrefill = useMemo(
    () => textPrefill ?? getDraftMessage(topic!) ?? "",
    [textPrefill, topic]
  );

  const textInputRef = useRef<TextInputWithValue>();
  const mediaPreviewRef = useRef<MediaPreview>();
  const [frameTextInputFocused, setFrameTextInputFocused] = useState(false);
  const tagsFetchedOnceForMessage = useRef<{ [messageId: string]: boolean }>(
    {}
  );

  const conversationContextValue = useMemo(
    () => ({
      topic,
      conversation: undefined,
      messageToPrefill,
      inputRef: textInputRef,
      mediaPreviewToPrefill: null,
      mediaPreviewRef,
      isBlockedPeer: false,
      onReadyToFocus,
      frameTextInputFocused,
      setFrameTextInputFocused,
      tagsFetchedOnceForMessage,
    }),
    [topic, messageToPrefill, onReadyToFocus, frameTextInputFocused]
  );

  return (
    <ConversationContext.Provider value={conversationContextValue}>
      <View style={$container}>
        <View style={themed($chatContainer)}>
          <ChatDumb
            items={messages?.ids ?? []}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            onReadyToFocus={onReadyToFocus}
            frameTextInputFocused={false}
            showChatInput={showChatInput}
            showPlaceholder={showPlaceholder}
            placeholderComponent={placeholderComponent}
            displayList={displayList}
            refreshing={isRefetching}
            getItemType={getItemTypeCallback}
            itemToId={keyExtractor}
            ListFooterComponent={null}
            onSend={onSend}
          />
        </View>
      </View>
    </ConversationContext.Provider>
  );
};
