import { useCurrentAccount } from "@data/store/accountsStore";
import { useConversationMessages } from "@queries/useConversationMessages";
import { ConversationTopic, ConversationVersion } from "@xmtp/react-native-sdk";
import { memo, useCallback, useEffect } from "react";
import { FlatListProps, Platform } from "react-native";
// import { DmChatPlaceholder } from "@components/Chat/ChatPlaceholder/ChatPlaceholder";
import { DmConsentPopup } from "@/components/Chat/ConsentPopup/dm-consent-popup";
import { GroupConsentPopup } from "@/components/Chat/ConsentPopup/group-consent-popup";
import { MessageContextMenu } from "@/components/Chat/Message/MessageContextMenu";
import { useConversationStore } from "@/features/conversation/conversation-store";
import { useDmPeerInboxId } from "@/queries/useDmPeerInbox";
import { V3Message } from "@components/Chat/Message/V3Message";
import { Screen } from "@components/Screen/ScreenComp/Screen";
import { Button } from "@design-system/Button/Button";
import { Center } from "@design-system/Center";
import { Text } from "@design-system/Text";
import { AnimatedVStack, VStack } from "@design-system/VStack";
import {
  Composer,
  IComposerSendArgs,
} from "@features/conversation/composer/composer";
import {
  ConversationContextProvider,
  useConversationContext,
} from "@features/conversation/conversation-context";
import {
  ConversationGroupContextProvider,
  useConversationGroupContext,
} from "@features/conversation/conversation-group-context";
import { translate } from "@i18n/translate";
import { useRouter } from "@navigation/useNavigation";
import { useAppTheme } from "@theme/useAppTheme";
import Animated, {
  AnimatedProps,
  useAnimatedKeyboard,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  initializeCurrentConversation,
  useConversationCurrentTopic,
} from "../../features/conversation/conversation-service";
import { DmConversationTitle } from "../../features/conversations/components/DmConversationTitle";
import { GroupConversationTitle } from "../../features/conversations/components/GroupConversationTitle";
import { NewConversationTitle } from "../../features/conversations/components/NewConversationTitle";

const keyExtractor = (item: string) => item;

type V3ConversationProps = {
  topic: ConversationTopic | undefined;
  peerAddress?: string;
  textPrefill?: string;
};

export const V3Conversation = ({
  topic,
  peerAddress,
  textPrefill,
}: V3ConversationProps) => {
  // TODO: Handle when topic is not defined
  const messageToPrefill = textPrefill ?? "";
  initializeCurrentConversation({
    topic,
    peerAddress,
    inputValue: messageToPrefill,
  });

  return (
    <ConversationContextProvider>
      <Screen contentContainerStyle={{ flex: 1 }}>
        <Content />
      </Screen>
    </ConversationContextProvider>
  );
};

const Content = memo(function Content() {
  const { theme } = useAppTheme();
  const isNewConversation = useConversationContext("isNewConversation");
  const conversationVersion = useConversationContext("conversationVersion");

  return (
    <AnimatedVStack
      layout={theme.animation.reanimatedSpringLayoutTransition}
      style={{
        flex: 1,
      }}
    >
      {isNewConversation ? (
        <NewConversationContent />
      ) : conversationVersion === ConversationVersion.DM ? (
        <DmContent />
      ) : (
        <ConversationGroupContextProvider>
          <GroupContent />
        </ConversationGroupContextProvider>
      )}
      <ComposerWrapper />
      <KeyboardFiller />
      <MessageContextMenuWrapper />
    </AnimatedVStack>
  );
});

const MessageContextMenuWrapper = memo(function MessageContextMenuWrapper() {
  const { theme } = useAppTheme();

  const messageContextMenuData = useConversationStore(
    (state) => state.messageContextMenuData
  );

  if (!messageContextMenuData) {
    return null;
  }

  return (
    <MessageContextMenu
      {...messageContextMenuData}
      onClose={() => {
        useConversationStore.setState({
          messageContextMenuData: null,
        });
      }}
    />
  );
});

const ComposerWrapper = memo(function ComposerWrapper() {
  const sendMessage = useConversationContext("sendMessage");

  const handleSend = useCallback(
    async (args: IComposerSendArgs) => {
      sendMessage(args);
    },
    [sendMessage]
  );

  return <Composer onSend={handleSend} />;
});

const NewConversationContent = memo(function NewConversationContent() {
  const peerAddress = useConversationContext("peerAddress");
  useNewConversationHeader();

  return <MessagesList messageIds={[]} />;
});

const DmContent = memo(function DmContent() {
  const currentAccount = useCurrentAccount()!;
  const topic = useConversationCurrentTopic()!;
  const conversationNotFound = useConversationContext("conversationNotFound");
  const isAllowedConversation = useConversationContext("isAllowedConversation");
  // const peerAddress = useConversationContext("peerAddress")!;
  const conversationId = useConversationContext("conversationId")!;
  const isLoadingConversationConsent = useConversationContext(
    "isLoadingConversationConsent"
  );
  const {
    data: messages,
    isLoading: messagesLoading,
    isRefetching: isRefetchingMessages,
    refetch: refetchMessages,
  } = useConversationMessages(currentAccount, topic!);

  const { data: peerInboxId } = useDmPeerInboxId(currentAccount, topic!);

  useDmHeader();

  if (conversationNotFound) {
    // TODO: Add DM placeholder
    return null;
  }

  if (messages?.ids.length === 0 && !messagesLoading) {
    // TODO: Add DM placeholder
    return null;
  }

  console.log("isAllowedConversation:", isAllowedConversation);
  console.log("isLoadingConversationConsent:", isLoadingConversationConsent);

  return (
    <MessagesList
      messageIds={messages?.ids ?? []}
      refreshing={isRefetchingMessages}
      onRefresh={refetchMessages}
      ListHeaderComponent={
        !isAllowedConversation &&
        peerInboxId &&
        !isLoadingConversationConsent ? (
          <DmConsentPopup
            peerInboxId={peerInboxId}
            topic={topic}
            conversationId={conversationId}
          />
        ) : undefined
      }
    />
  );
});

const GroupContent = memo(function GroupContent() {
  const currentAccount = useCurrentAccount()!;
  const topic = useConversationCurrentTopic()!;
  const conversationNotFound = useConversationContext("conversationNotFound");
  const isAllowedConversation = useConversationContext("isAllowedConversation");
  const isLoadingConversationConsent = useConversationContext(
    "isLoadingConversationConsent"
  );

  const {
    data: messages,
    isLoading: messagesLoading,
    isRefetching: isRefetchingMessages,
    refetch,
  } = useConversationMessages(currentAccount, topic!);

  useGroupHeader();

  if (conversationNotFound) {
    return <GroupConversationMissing />;
  }

  if (messages?.ids.length === 0 && !messagesLoading) {
    return <GroupConversationEmpty />;
  }

  return (
    <MessagesList
      messageIds={messages?.ids ?? []}
      refreshing={isRefetchingMessages}
      onRefresh={refetch}
      ListHeaderComponent={
        !isAllowedConversation && !isLoadingConversationConsent ? (
          <GroupConsentPopup topic={topic} />
        ) : undefined
      }
    />
  );
});

export const MessagesList = memo(function MessagesList(
  props: Omit<AnimatedProps<FlatListProps<string>>, "renderItem" | "data"> & {
    messageIds: string[];
  }
) {
  const { messageIds, ...rest } = props;

  const { theme } = useAppTheme();

  return (
    // @ts-ignore
    <Animated.FlatList
      inverted
      data={messageIds}
      renderItem={({ item, index }) => {
        return (
          <V3Message
            nextMessageId={messageIds[index - 1]}
            previousMessageId={messageIds[index + 1]}
            messageId={item}
          />
        );
      }}
      keyboardDismissMode="interactive"
      automaticallyAdjustContentInsets={false}
      contentInsetAdjustmentBehavior="never"
      keyExtractor={keyExtractor}
      keyboardShouldPersistTaps="handled"
      // estimatedItemSize={34} // TODO
      showsVerticalScrollIndicator={Platform.OS === "ios"} // Size glitch on Android
      pointerEvents="auto"
      /**
       * Causes a glitch on Android, no sure we need it for now
       */
      // maintainVisibleContentPosition={{
      //   minIndexForVisible: 0,
      //   autoscrollToTopThreshold: 100,
      // }}
      // estimatedListSize={Dimensions.get("screen")}
      {...rest}
    />
  );
});

export const KeyboardFiller = memo(function KeyboardFiller() {
  const { height: keyboardHeightAV } = useAnimatedKeyboard();
  const insets = useSafeAreaInsets();

  const as = useAnimatedStyle(() => ({
    height: Math.max(keyboardHeightAV.value - insets.bottom, 0),
  }));

  return <AnimatedVStack style={as} />;
});

function useNewConversationHeader() {
  const navigation = useRouter();

  const peerAddress = useConversationContext("peerAddress");

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => <NewConversationTitle peerAddress={peerAddress!} />,
    });
  }, [peerAddress, navigation]);
}

function useDmHeader() {
  const navigation = useRouter();

  const topic = useConversationCurrentTopic();

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => <DmConversationTitle topic={topic!} />,
    });
  }, [topic, navigation]);
}

function useGroupHeader() {
  const navigation = useRouter();

  const topic = useConversationCurrentTopic();

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => <GroupConversationTitle topic={topic!} />,
    });
  }, [topic, navigation]);
}

const GroupConversationMissing = memo(() => {
  const topic = useConversationCurrentTopic();

  return (
    <VStack>
      <Text
        style={{
          textAlign: "center",
        }}
      >
        {topic
          ? translate("group_not_found")
          : translate("opening_conversation")}
      </Text>
    </VStack>
  );
});

const GroupConversationEmpty = memo(() => {
  const { theme } = useAppTheme();

  const groupName = useConversationGroupContext("groupName");
  const sendMessage = useConversationContext("sendMessage");

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
