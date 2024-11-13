import Avatar from "@components/Avatar";
import { ChatDumb } from "@components/Chat/ChatDumb";
import { useDebugEnabled } from "@components/DebugButton";
import { GroupAvatarDumb } from "@components/GroupAvatar";
import { useCurrentAccount } from "@data/store/accountsStore";
import { useProfilesSocials } from "@hooks/useProfilesSocials";
import { useConversationMessages } from "@queries/useConversationMessages";
import { useConversationScreenQuery } from "@queries/useConversationQuery";
import { useGroupMembersConversationScreenQuery } from "@queries/useGroupMembersQuery";
import { useGroupNameQuery } from "@queries/useGroupNameQuery";
import { useGroupPhotoQuery } from "@queries/useGroupPhotoQuery";
import Clipboard from "@react-native-clipboard/clipboard";
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { NavigationParamList } from "@screens/Navigation/Navigation";
import { ListRenderItem } from "@shopify/flash-list";
import {
  backgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { AvatarSizes } from "@styles/sizes";
import { getPreferredAvatar, getPreferredName } from "@utils/profile";
import { ConversationWithCodecsType } from "@utils/xmtpRN/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  View,
  useColorScheme,
} from "react-native";

import { GroupChatPlaceholder } from "@components/Chat/ChatPlaceholder/GroupChatPlaceholder";
import { V3Message } from "@components/Chat/Message/V3Message";
import { MediaPreview } from "@data/store/chatStore";
import { ConversationContext } from "@utils/conversation";
import { navigate } from "@utils/navigation";
import { TextInputWithValue } from "@utils/str";
import {
  ConversationTopic,
  ConversationVersion,
  RemoteAttachmentContent,
} from "@xmtp/react-native-sdk";
import {
  getDraftMessage,
  setDraftMessage,
} from "../../features/conversations/utils/textDrafts";
// import { DmChatPlaceholder } from "@components/Chat/ChatPlaceholder/ChatPlaceholder";
import { ConversationTitleDumb } from "./ConversationTitleDumb";

type UseDataProps = {
  topic: ConversationTopic;
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
  const { data: groupName, isLoading: groupNameLoading } = useGroupNameQuery(
    currentAccount,
    topic!
  );
  const { data: groupPhoto, isLoading: groupPhotoLoading } = useGroupPhotoQuery(
    currentAccount,
    topic!
  );
  const { data: members, isLoading: membersLoading } =
    useGroupMembersConversationScreenQuery(currentAccount, topic!);

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
  const data = useProfilesSocials(memberAddresses);

  const memberData: {
    address: string;
    uri?: string;
    name?: string;
  }[] = useMemo(() => {
    return data.map(({ data: socials }, index) =>
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
  }, [data, memberAddresses]);

  const debugEnabled = useDebugEnabled();

  return {
    conversation,
    messages,
    messagesLoading,
    groupName,
    groupNameLoading,
    groupPhoto,
    groupPhotoLoading,
    members,
    membersLoading,
    isLoading,
    isRefetching,
    debugEnabled,
    memberData,
  };
};

const useStyles = () => {
  const colorScheme = useColorScheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
        },
        chatContainer: {
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: backgroundColor(colorScheme),
        },
        avatar: {
          marginRight: Platform.OS === "android" ? 24 : 7,
          marginLeft: Platform.OS === "ios" ? 0 : -9,
        },
      }),
    [colorScheme]
  );
};

type UseDisplayInfoProps = {
  conversation: ConversationWithCodecsType | undefined | null;
  groupPhotoLoading: boolean;
};

const useDisplayInfo = ({
  conversation,
  groupPhotoLoading,
}: UseDisplayInfoProps) => {
  const colorScheme = useColorScheme();
  const headerTintColor =
    Platform.OS === "android"
      ? textSecondaryColor(colorScheme)
      : textPrimaryColor(colorScheme);
  const displayAvatar = !conversation || groupPhotoLoading;
  return { headerTintColor, displayAvatar };
};

type UseUserInteractionProps = {
  debugEnabled: boolean;
  topic: ConversationTopic;
  navigation: NativeStackNavigationProp<NavigationParamList, "Conversation">;
};

const useUserInteraction = ({
  debugEnabled,
  navigation,
  topic,
}: UseUserInteractionProps) => {
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

  return { onPress, onLongPress };
};

const keyExtractor = (item: string) => item;
const getItemTypeCallback = () => {
  return "MESSAGE";
};

export const V3Conversation = ({
  route,
  navigation,
}: NativeStackScreenProps<NavigationParamList, "Conversation">) => {
  // TODO Update values
  const showChatInput = true;
  const topic = route.params.topic!;

  const {
    conversation,
    messages,
    messagesLoading,
    groupName,
    groupPhoto,
    groupPhotoLoading,
    groupNameLoading,
    members,
    isRefetching,
    debugEnabled,
    memberData,
    isLoading,
  } = useData({
    topic,
  });
  const currentAccount = useCurrentAccount()!;
  const styles = useStyles();
  const { headerTintColor, displayAvatar } = useDisplayInfo({
    conversation,
    groupPhotoLoading,
  });

  const onReadyToFocus = useCallback(() => {}, []);
  const { onPress, onLongPress } = useUserInteraction({
    debugEnabled,
    topic,
    navigation,
  });

  const renderItem: ListRenderItem<string> = useCallback(
    ({ item: messageId, index }) => {
      if (!messages) return null;
      return (
        <V3Message
          messageId={messageId}
          currentAccount={currentAccount}
          previousMessageId={index > 0 ? messages.ids[index + 1] : undefined}
          nextMessageId={
            index < messages.ids.length - 1
              ? messages.ids[index - 1]
              : undefined
          }
          topic={topic}
        />
      );
    },
    [currentAccount, topic, messages]
  );

  const showPlaceholder =
    ((messages?.ids.length ?? 0) === 0 && !messagesLoading) ||
    (!conversation && !isLoading);
  const displayList = !showPlaceholder;

  const avatarComponent = useMemo(() => {
    if (displayAvatar) return null;
    return groupPhoto ? (
      <Avatar
        uri={groupPhoto}
        size={AvatarSizes.conversationTitle}
        style={styles.avatar}
      />
    ) : (
      <GroupAvatarDumb
        members={memberData}
        size={AvatarSizes.conversationTitle}
        style={styles.avatar}
      />
    );
  }, [displayAvatar, groupPhoto, styles.avatar, memberData]);

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
      headerTintColor,
    });
  }, [
    groupName,
    headerTintColor,
    navigation,
    onLongPress,
    onPress,
    avatarComponent,
  ]);

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
          await conversation?.send({
            reply: {
              reference: referencedMessageId,
              content: { remoteAttachment: attachment },
            },
          });
        }
        if (text) {
          await conversation?.send({
            reply: {
              reference: referencedMessageId,
              content: { text },
            },
          });
        }
        return;
      }
      if (attachment) {
        await conversation?.send({
          remoteAttachment: attachment,
        });
      }
      if (text) {
        await conversation?.send(text);
      }
    },
    [conversation]
  );

  const onLeaveScreen = useCallback(() => {
    // useChatStore.getState().setOpenedConversationTopic(null);
    setDraftMessage(topic, textInputRef.current?.currentValue ?? "");
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
    () => route.params?.text ?? getDraftMessage(topic) ?? "",
    [route.params?.text, topic]
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
      <View style={styles.container}>
        <View style={styles.chatContainer}>
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
