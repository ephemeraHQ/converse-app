import Avatar from "@components/Avatar";
import { V3Message } from "@components/Chat/Message/V3Message";
import { useCurrentAccount } from "@data/store/accountsStore";
import { useConversationMessages } from "@queries/useConversationMessages";
import { useGroupPhotoQuery } from "@queries/useGroupPhotoQuery";
import Clipboard from "@react-native-clipboard/clipboard";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { NavigationParamList } from "@screens/Navigation/Navigation";
import { ConversationVersion } from "@xmtp/react-native-sdk";
import { memo, useCallback, useEffect, useMemo } from "react";
import { Alert, FlatListProps, Platform } from "react-native";
// import { DmChatPlaceholder } from "@components/Chat/ChatPlaceholder/ChatPlaceholder";
import { useDebugEnabled } from "@components/DebugButton";
import { GroupAvatarDumb } from "@components/GroupAvatar";
import { Screen } from "@components/Screen/ScreenComp/Screen";
import { Button } from "@design-system/Button/Button";
import { Center } from "@design-system/Center";
import { Text } from "@design-system/Text";
import { AnimatedVStack, VStack } from "@design-system/VStack";
import { useProfilesSocials } from "@hooks/useProfilesSocials";
import { translate } from "@i18n/translate";
import { useRouter } from "@navigation/useNavigation";
import { useGroupMembersConversationScreenQuery } from "@queries/useGroupMembersQuery";
import { useAppTheme } from "@theme/useAppTheme";
import { isV3Topic } from "@utils/groupUtils/groupId";
import { getPreferredAvatar, getPreferredName } from "@utils/profile";
import Animated, {
  AnimatedProps,
  useAnimatedKeyboard,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChatInputDumb } from "../../features/conversation/composer/composer";
import {
  ConversationContextProvider,
  useConversationContext,
} from "../../features/conversation/conversation-context";
import {
  ConversationGroupContextProvider,
  useConversationGroupContext,
} from "../../features/conversation/conversation-group-context";
import {
  getCurrentConversationMessages,
  initializeCurrentConversation,
  useConversationCurrentTopic,
} from "../../features/conversation/conversation-service";
import { ConversationTitleDumb } from "./ConversationTitleDumb";

const keyExtractor = (item: string) => item;

export const V3Conversation = ({
  route,
}: NativeStackScreenProps<NavigationParamList, "Conversation">) => {
  // TODO: Handle when topic is not defined
  const topic = route.params.topic!;
  const messageToPrefill = route.params.text ?? "";

  initializeCurrentConversation({ topic, inputValue: messageToPrefill });

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

  const conversationVersion = useConversationContext("conversationVersion");

  return (
    <AnimatedVStack
      layout={theme.animation.reanimatedSpringLayoutTransition}
      style={{
        flex: 1,
      }}
    >
      {!conversationVersion ? (
        <VStack
          style={{
            flex: 1,
          }}
        />
      ) : conversationVersion === ConversationVersion.DM ? (
        <DmContent />
      ) : (
        <ConversationGroupContextProvider>
          <GroupContent />
        </ConversationGroupContextProvider>
      )}
      <ChatInputDumb />
      <KeyboardFiller />
    </AnimatedVStack>
  );
});

const DmContent = memo(function DmContent() {
  const currentAccount = useCurrentAccount()!;
  const topic = useConversationCurrentTopic();
  const conversationNotFound = useConversationContext("conversationNotFound");

  const {
    data: messages,
    isLoading: messagesLoading,
    isRefetching: isRefetchingMessages,
  } = useConversationMessages(currentAccount, topic!);

  // TODO: Add DM header
  // useDmHeader();

  if (conversationNotFound) {
    // TODO: Add DM placeholder
    return null;
  }

  if (messages?.ids.length === 0 && !messagesLoading) {
    // TODO: Add DM placeholder
    return null;
  }

  return (
    <MessagesList
      data={messages?.ids ?? []}
      refreshing={isRefetchingMessages}
    />
  );
});

const GroupContent = memo(function GroupContent() {
  const currentAccount = useCurrentAccount()!;
  const topic = useConversationCurrentTopic();
  const conversationNotFound = useConversationContext("conversationNotFound");

  const {
    data: messages,
    isLoading: messagesLoading,
    isRefetching: isRefetchingMessages,
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
      data={messages?.ids ?? []}
      refreshing={isRefetchingMessages}
    />
  );
});

const MessagesList = memo(function MessagesList(
  props: Omit<AnimatedProps<FlatListProps<string>>, "renderItem">
) {
  const { theme } = useAppTheme();

  return (
    <Animated.FlatList
      inverted
      // @ts-ignore It says error but it works
      // layout={theme.animation.springLayoutTransition}
      itemLayoutAnimation={theme.animation.reanimatedSpringLayoutTransition}
      renderItem={({ item, index }) => (
        <Message messageId={item} index={index} />
      )}
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
      {...props}
    />
  );
});

const Message = memo(function Message(props: {
  messageId: string;
  index: number;
}) {
  const { messageId, index } = props;

  const messages = getCurrentConversationMessages()!;

  return (
    <AnimatedVStack
      {...(index === 0 &&
        {
          // entering: theme.animation.reanimatedFadeInDownSpring,
        })}
    >
      <V3Message
        messageId={messageId}
        previousMessageId={messages.ids[index + 1]}
        nextMessageId={messages.ids[index - 1]}
      />
    </AnimatedVStack>
  );
});

const KeyboardFiller = memo(function KeyboardFiller() {
  const { height: keyboardHeightAV } = useAnimatedKeyboard();
  const insets = useSafeAreaInsets();

  const as = useAnimatedStyle(() => ({
    height: Math.max(keyboardHeightAV.value - insets.bottom, 0),
  }));

  return <AnimatedVStack style={as} />;
});

function useGroupHeader() {
  const { theme } = useAppTheme();

  const navigation = useRouter();

  const topic = useConversationCurrentTopic();
  const currentAccount = useCurrentAccount()!;

  const groupName = useConversationGroupContext("groupName");

  const { data: groupPhoto, isLoading: groupPhotoLoading } = useGroupPhotoQuery(
    currentAccount,
    topic
  );

  const avatarComponent = useMemo(() => {
    if (!groupName || groupPhotoLoading) {
      return null;
    }

    if (groupPhoto) {
      return (
        <Avatar
          uri={groupPhoto}
          size={theme.avatarSize.sm}
          // style={styles.avatar}
        />
      );
    }

    return <GroupAvatarWrapper />;
  }, [groupName, groupPhoto, groupPhotoLoading, theme.avatarSize.sm]);

  const debugEnabled = useDebugEnabled();

  const onPress = useCallback(() => {
    // textInputRef?.current?.blur();
    navigation.push("Group", { topic });
  }, [navigation, topic]);

  const onLongPress = useCallback(() => {
    if (!debugEnabled) return;
    Clipboard.setString(
      JSON.stringify({
        topic: topic || "",
      })
    );
    Alert.alert("Conversation details copied");
  }, [debugEnabled, topic]);

  useEffect(() => {
    navigation.setOptions({
      // headerTitle: () => (
      //   <ConversationTitleDumb
      //     title={groupName}
      //     avatarComponent={avatarComponent}
      //     onLongPress={onLongPress}
      //     onPress={onPress}
      //   />
      // ),
    });
  }, [groupName, navigation, onLongPress, onPress, avatarComponent]);
}

const GroupAvatarWrapper = memo(function GroupAvatarWrapper() {
  const { theme } = useAppTheme();

  const topic = useConversationCurrentTopic();
  const currentAccount = useCurrentAccount()!;

  const { data: members } = useGroupMembersConversationScreenQuery(
    currentAccount,
    topic!
  );

  const memberAddresses = useMemo(() => {
    const addresses: string[] = [];
    for (const memberId of members?.ids ?? []) {
      const member = members?.byId[memberId];
      if (
        member?.addresses[0] &&
        member?.addresses[0].toLowerCase() !== currentAccount?.toLowerCase()
      ) {
        addresses.push(member?.addresses[0]);
      }
    }
    return addresses;
  }, [members, currentAccount]);

  const profilesSocialsQueries = useProfilesSocials(memberAddresses);

  const memberData = useMemo(() => {
    return profilesSocialsQueries.map(({ data: socials }, index) =>
      socials
        ? {
            address: memberAddresses[index],
            uri: getPreferredAvatar(socials),
            name: getPreferredName(socials, memberAddresses[index]),
          }
        : {
            address: memberAddresses[index],
            uri: undefined,
            name: memberAddresses[index],
          }
    );
  }, [profilesSocialsQueries, memberAddresses]);

  return (
    <GroupAvatarDumb
      members={memberData}
      size={theme.avatarSize.sm}
      // style={styles.avatar}
    />
  );
});

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
          ? isV3Topic(topic)
            ? translate("group_not_found")
            : translate("conversation_not_found")
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
      text: "👋",
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
