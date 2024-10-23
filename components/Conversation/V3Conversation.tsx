import Avatar from "@components/Avatar";
import { ChatDumb } from "@components/Chat/ChatDumb";
import { useDebugEnabled } from "@components/DebugButton";
import { GroupAvatarDumb } from "@components/GroupAvatar";
import { useCurrentAccount } from "@data/store/accountsStore";
import { Text } from "@design-system/Text";
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
import { getMessageContentType } from "@utils/xmtpRN/contentTypes";
import { useCallback, useEffect, useMemo } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";

import { ConversationTitleDumb } from "./ConversationTitleDumb";

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
      console.log("group1111", isActive);
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
  console.log("messages", messages);
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
    ({ item }) => {
      const message = messages?.byId[item];
      if (!message) return null;
      const contentType = getMessageContentType(message?.contentTypeId);
      console.log("here1113", message?.contentTypeId);
      switch (contentType) {
        // case "groupUpdated":
        //   return <ChatGroupUpdatedMessage message={message} />;
        // case "text":
        //   return <Text preset="body">{message?.contentTypeId}</Text>;
        default:
          return <Text preset="body">{message?.contentTypeId}</Text>;
      }
    },
    [messages]
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

  return (
    <View style={styles.container}>
      <View style={styles.chatContainer}>
        <ChatDumb
          items={messages?.ids ?? []}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          onReadyToFocus={onReadyToFocus}
          transactionMode={false}
          frameTextInputFocused={false}
          showChatInput={showChatInput}
          showPlaceholder={showPlaceholder}
          displayList={displayList}
          refreshing={isRefetching}
          getItemType={getItemTypeCallback}
          itemToId={keyExtractor}
          ListFooterComponent={null}
          placeholderComponent={null}
        />
      </View>
    </View>
  );
};
