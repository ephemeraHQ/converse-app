import Avatar from "@components/Avatar";
import { ChatDumb } from "@components/Chat/ChatDumb";
import { useDebugEnabled } from "@components/DebugButton";
import { GroupAvatarDumb } from "@components/GroupAvatar";
import { useCurrentAccount } from "@data/store/accountsStore";
import { useProfilesSocials } from "@hooks/useProfilesSocials";
import { useGroupMembersConversationScreenQuery } from "@queries/useGroupMembersQuery";
import { useGroupMessages } from "@queries/useGroupMessages";
import { useGroupNameQuery } from "@queries/useGroupNameQuery";
import { useGroupPhotoQuery } from "@queries/useGroupPhotoQuery";
import { useGroupConversationScreenQuery } from "@queries/useGroupQuery";
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
import { GroupWithCodecsType } from "@utils/xmtpRN/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";

import { ConversationTitleDumb } from "./ConversationTitleDumb";
import { GroupChatPlaceholder } from "@components/Chat/ChatPlaceholder/GroupChatPlaceholder";
import { RemoteAttachmentContent } from "@xmtp/react-native-sdk";
import { ConversationContext } from "@utils/conversation";
import { TextInputWithValue } from "@utils/str";
import { MediaPreview } from "@data/store/chatStore";
import { V3Message } from "@components/Chat/Message/V3Message";

type UseDataProps = {
  topic: string;
};

const useData = ({ topic }: UseDataProps) => {
  const currentAccount = useCurrentAccount()!;
  const {
    data: group,
    isLoading,
    isRefetching,
  } = useGroupConversationScreenQuery(currentAccount, topic!);

  const { data: messages } = useGroupMessages(currentAccount, topic!);
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
      const isActive = await group?.isActive();
      // If not active leave the screen
    };
    checkActive();
  }, [group]);

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
    group,
    messages,
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
  group: GroupWithCodecsType | undefined | null;
  groupPhotoLoading: boolean;
};

const useDisplayInfo = ({ group, groupPhotoLoading }: UseDisplayInfoProps) => {
  const colorScheme = useColorScheme();
  const headerTintColor =
    Platform.OS === "android"
      ? textSecondaryColor(colorScheme)
      : textPrimaryColor(colorScheme);
  const displayAvatar = !group || groupPhotoLoading;
  return { headerTintColor, displayAvatar };
};

type UseUserInteractionProps = {
  debugEnabled: boolean;
  topic: string;
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
    group,
    messages,
    groupName,
    groupPhoto,
    groupPhotoLoading,
    groupNameLoading,
    members,
    isRefetching,
    debugEnabled,
    memberData,
  } = useData({
    topic,
  });
  const currentAccount = useCurrentAccount()!;
  const styles = useStyles();
  const { headerTintColor, displayAvatar } = useDisplayInfo({
    group,
    groupPhotoLoading,
  });

  const onReadyToFocus = useCallback(() => {}, []);
  const { onPress, onLongPress } = useUserInteraction({
    debugEnabled,
    topic,
    navigation,
  });

  const renderItem: ListRenderItem<string> = useCallback(
    ({ item, index }) => (
      <V3Message
        item={item}
        index={index}
        currentAccount={currentAccount}
        topic={topic}
      />
    ),
    [currentAccount, topic]
  );

  const showPlaceholder = (messages?.ids.length ?? 0) === 0 || !group;
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
          await group?.send({
            reply: {
              reference: referencedMessageId,
              content: { remoteAttachment: attachment },
            },
          });
        }
        if (text) {
          await group?.send({
            reply: {
              reference: referencedMessageId,
              content: { text },
            },
          });
        }
        return;
      }
      if (attachment) {
        await group?.send({
          remoteAttachment: attachment,
        });
      }
      if (text) {
        await group?.send(text);
      }
    },
    [group]
  );

  const placeholderComponent = useMemo(() => {
    return <GroupChatPlaceholder messagesCount={messages?.ids.length ?? 0} />;
  }, [messages?.ids.length]);

  const messageToPrefill = useMemo(
    () => route.params?.text ?? "",
    [route.params?.text]
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
      transactionMode: false,
      setTransactionMode: () => {},
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
