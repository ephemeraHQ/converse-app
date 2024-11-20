import Avatar from "@components/Avatar";
import { useCurrentAccount } from "@data/store/accountsStore";
import { useConversationMessages } from "@queries/useConversationMessages";
import { useGroupPhotoQuery } from "@queries/useGroupPhotoQuery";
import Clipboard from "@react-native-clipboard/clipboard";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { NavigationParamList } from "@screens/Navigation/Navigation";
import { ListRenderItem } from "@shopify/flash-list";
import { memo, useCallback, useEffect, useMemo } from "react";
import { Alert, Platform } from "react-native";

import { GroupChatPlaceholder } from "@components/Chat/ChatPlaceholder/GroupChatPlaceholder";
import { V3Message } from "@components/Chat/Message/V3Message";
import { ConversationVersion } from "@xmtp/react-native-sdk";
// import { DmChatPlaceholder } from "@components/Chat/ChatPlaceholder/ChatPlaceholder";
import { ChatInputDumb } from "@components/Chat/Input/InputDumb";
import { useDebugEnabled } from "@components/DebugButton";
import { GroupAvatarDumb } from "@components/GroupAvatar";
import { Screen } from "@components/Screen/ScreenComp/Screen";
import {
  AnimatedVStack,
  IAnimatedVStackProps,
  VStack,
} from "@design-system/VStack";
import { useProfilesSocials } from "@hooks/useProfilesSocials";
import { useRouter } from "@navigation/useNavigation";
import { useGroupMembersConversationScreenQuery } from "@queries/useGroupMembersQuery";
import { useAppTheme } from "@theme/useAppTheme";
import { ReanimatedFlashList } from "@utils/animations";
import { debugBorder } from "@utils/debug-style";
import { getPreferredAvatar, getPreferredName } from "@utils/profile";
import {
  useAnimatedKeyboard,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ConversationContextProvider,
  useConversationContext,
} from "../../features/conversation/conversation-context";
import { useConversationGroupContext } from "../../features/conversation/conversation-group-context";
import { initializeCurrentConversation } from "../../features/conversation/conversation-service";
import { ConversationTitleDumb } from "./ConversationTitleDumb";

// type UseDataProps = {
//   topic: ConversationTopic;
// };

// const useData = ({ topic }: UseDataProps) => {
//   // const currentAccount = useCurrentAccount()!;
//   // const {
//   //   data: conversation,
//   //   isLoading,
//   //   isRefetching,
//   // } = useConversationScreenQuery(currentAccount, topic!);

//   // const { data: messages, isLoading: messagesLoading } =
//   //   useConversationMessages(currentAccount, topic!);
//   // const { data: groupName, isLoading: groupNameLoading } = useGroupNameQuery(
//   //   currentAccount,
//   //   topic!
//   // );
//   // const { data: groupPhoto, isLoading: groupPhotoLoading } = useGroupPhotoQuery(
//   //   currentAccount,
//   //   topic!
//   // );
//   // const { data: members, isLoading: membersLoading } =
//   //   useGroupMembersConversationScreenQuery(currentAccount, topic!);

//   // useEffect(() => {
//   //   const checkActive = async () => {
//   //     if (!conversation) return;
//   //     if (conversation.version === ConversationVersion.GROUP) {
//   //       const isActive = conversation.isGroupActive;
//   //       // If not active leave the screen
//   //       if (!isActive) {
//   //         navigate("Chats");
//   //       }
//   //     }
//   //   };
//   //   checkActive();
//   // }, [conversation]);

//   // const memberAddresses = useMemo(() => {
//   //   const addresses: string[] = [];
//   //   for (const memberId of members?.ids ?? []) {
//   //     const member = members?.byId[memberId];
//   //     if (
//   //       member?.addresses[0] &&
//   //       member?.addresses[0].toLowerCase() !== currentAccount?.toLowerCase()
//   //     ) {
//   //       addresses.push(member?.addresses[0]);
//   //     }
//   //   }
//   //   return addresses;
//   // }, [members, currentAccount]);
//   // const data = useProfilesSocials(memberAddresses);

//   // const memberData: {
//   //   address: string;
//   //   uri?: string;
//   //   name?: string;
//   // }[] = useMemo(() => {
//   //   return data.map(({ data: socials }, index) =>
//   //     socials
//   //       ? {
//   //           address: memberAddresses[index],
//   //           uri: getPreferredAvatar(socials),
//   //           name: getPreferredName(socials, memberAddresses[index]),
//   //         }
//   //       : {
//   //           address: memberAddresses[index],
//   //           uri: undefined,
//   //           name: memberAddresses[index],
//   //         }
//   //   );
//   // }, [data, memberAddresses]);

//   // const debugEnabled = useDebugEnabled();

//   return {
//     conversation,
//     messages,
//     messagesLoading,
//     groupName,
//     groupNameLoading,
//     groupPhoto,
//     groupPhotoLoading,
//     members,
//     membersLoading,
//     isLoading,
//     isRefetching,
//     debugEnabled,
//     memberData,
//   };
// };

// const useStyles = () => {
//   const colorScheme = useColorScheme();
//   return useMemo(
//     () =>
//       StyleSheet.create({

//         avatar: {
//           marginRight: Platform.OS === "android" ? 24 : 7,
//           marginLeft: Platform.OS === "ios" ? 0 : -9,
//         },
//       }),
//     [colorScheme]
//   );
// };

const keyExtractor = (item: string) => item;

// const getItemTypeCallback = () => {
//   return "MESSAGE";
// };

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
  const currentAccount = useCurrentAccount()!;
  console.log("currentAccount:", currentAccount);
  const topic = useConversationContext("topic")!;
  console.log("topic:", topic);

  const {
    data: messages,
    isLoading: messagesLoading,
    isRefetching: isRefetchingMessages,
    error: messagesError,
  } = useConversationMessages(currentAccount, topic!);

  // const {
  //   conversation,
  //   messages,
  //   messagesLoading,
  //   groupName,
  //   groupPhoto,
  //   groupPhotoLoading,
  //   groupNameLoading,
  //   members,
  //   isRefetching,
  //   debugEnabled,
  //   memberData,
  //   isLoading,
  // } = useData({
  //   topic,
  // });

  // const styles = useStyles();

  const renderItem: ListRenderItem<string> = useCallback(
    ({ item: messageId, index }) => {
      if (!messages) return null;
      return (
        <V3Message
          messageId={messageId}
          previousMessageId={index > 0 ? messages.ids[index + 1] : undefined}
          nextMessageId={
            index < messages.ids.length - 1
              ? messages.ids[index - 1]
              : undefined
          }
        />
      );
    },
    [messages]
  );

  // const showPlaceholder =
  //   ((messages?.ids.length ?? 0) === 0 && !messagesLoading) ||
  //   (!conversation && !isLoading);
  // const displayList = !showPlaceholder;

  useHeader();

  // const onLeaveScreen = useCallback(() => {
  //   // useChatStore.getState().setOpenedConversationTopic(null);
  //   setDraftMessage(topic, textInputRef.current?.currentValue ?? "");
  // }, [topic]);

  // useEffect(() => {
  //   const unsubscribeBeforeRemove = navigation.addListener(
  //     "beforeRemove",
  //     onLeaveScreen
  //   );

  //   return () => {
  //     unsubscribeBeforeRemove();
  //   };
  // }, [navigation, onLeaveScreen]);

  // const messageToPrefill = useMemo(
  //   () => route.params?.text ?? getDraftMessage(topic) ?? "",
  //   [route.params?.text, topic]
  // );

  // const textInputRef = useRef<TextInputWithValue>();
  // const mediaPreviewRef = useRef<MediaPreview>();
  // const [frameTextInputFocused, setFrameTextInputFocused] = useState(false);
  // const tagsFetchedOnceForMessage = useRef<{ [messageId: string]: boolean }>(
  //   {}
  // );

  const isEmptyList = messages?.ids.length === 0 && !messagesLoading;

  console.log("messages?.ids:", messages?.ids);

  return (
    <VStack
      style={{
        flex: 1,
      }}
    >
      {/* <ChatDumb
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
              /> */}
      <ChatListContainer>
        {isEmptyList ? (
          <ListEmptyComponent />
        ) : (
          <ReanimatedFlashList
            inverted
            data={messages?.ids ?? []}
            refreshing={isRefetchingMessages}
            renderItem={renderItem}
            ListEmptyComponent={<ListEmptyComponent />}
            keyboardDismissMode="interactive"
            automaticallyAdjustContentInsets={false}
            contentInsetAdjustmentBehavior="never"
            keyExtractor={keyExtractor}
            keyboardShouldPersistTaps="handled"
            estimatedItemSize={34} // TODO
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
          />
        )}
      </ChatListContainer>

      {/* <AnimatedVStack
                style={[
                  textInputStyle,
                  {
                    display:
                      frameTextInputFocused && hideInputIfFrameFocused
                        ? "none"
                        : "flex",
                  },
                ]}
              > */}
      <ChatInputDumb />
      <KeyboardFiller />
      {/* </AnimatedVStack> */}
      {/* <View
                style={[
                  styles.inputBottomFiller,
                  { height: insets.bottom + DEFAULT_INPUT_HEIGHT },
                ]}
              /> */}
    </VStack>
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

const ChatListContainer = memo(function ChatListContainer(
  props: IAnimatedVStackProps
) {
  const showChatInput = true; // TODO

  const { height: keyboardHeightAV } = useAnimatedKeyboard();
  const insets = useSafeAreaInsets();
  const composerHeightAV = useConversationContext("composerHeightAV")!;

  const frameTextInputFocusedAV = useSharedValue(false); // TODO

  const chatInputDisplayedHeight = useDerivedValue(() => {
    if (frameTextInputFocusedAV.value) {
      return 0;
    }
    return (
      composerHeightAV.value +
      // TODO: Not sure why
      58
    );
  });

  const chatContentStyle = useAnimatedStyle(
    () => ({
      flex: 1,
      paddingBottom: 0,
      // paddingBottom: showChatInput
      //   ? chatInputDisplayedHeight.value +
      //     Math.max(insets.bottom, keyboardHeightAV.value)
      //   : insets.bottom,
    }),
    [showChatInput, keyboardHeightAV, chatInputDisplayedHeight, insets.bottom]
  );

  return (
    <AnimatedVStack style={[chatContentStyle, debugBorder()]} {...props} />
  );
});

const ListEmptyComponent = memo(function ListEmptyComponent() {
  const conversationVersion = useConversationContext("conversationVersion");

  if (!conversationVersion) {
    return null;
  }

  if (conversationVersion == ConversationVersion.GROUP) {
    return <GroupChatPlaceholder />;
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
});

function useHeader() {
  const { theme } = useAppTheme();

  const navigation = useRouter();

  const topic = useConversationContext("topic")!;
  const currentAccount = useCurrentAccount()!;

  const groupName = useConversationGroupContext("groupName");

  const { data: groupPhoto, isLoading: groupPhotoLoading } = useGroupPhotoQuery(
    currentAccount,
    topic!
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
      headerTitle: () => (
        <ConversationTitleDumb
          title={groupName}
          avatarComponent={avatarComponent}
          onLongPress={onLongPress}
          onPress={onPress}
        />
      ),
    });
  }, [groupName, navigation, onLongPress, onPress, avatarComponent]);
}

const GroupAvatarWrapper = memo(function GroupAvatarWrapper() {
  const { theme } = useAppTheme();

  const topic = useConversationContext("topic")!;
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
