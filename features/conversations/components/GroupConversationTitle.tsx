import React, { memo, useCallback, useMemo } from "react";
import { useGroupNameQuery } from "@queries/useGroupNameQuery";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { useCurrentAccount } from "@data/store/accountsStore";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { NavigationParamList } from "@screens/Navigation/Navigation";
import { ImageStyle, Platform } from "react-native";
import { useRouter } from "@navigation/useNavigation";
import { useGroupPhotoQuery } from "@queries/useGroupPhotoQuery";
import Avatar from "@components/Avatar";
import { AvatarSizes } from "@styles/sizes";
import { ThemedStyle, useAppTheme } from "@theme/useAppTheme";
import { GroupAvatarDumb } from "@components/GroupAvatar";
import { useConversationTitleLongPress } from "../hooks/useConversationTitleLongPress";
import { useGroupMembersAvatarData } from "../hooks/useGroupMembersAvatarData";
import { ConversationTitleDumb } from "@components/Conversation/ConversationTitleDumb";
import { Text } from "@/design-system/Text";
import { translate } from "@i18n";
import { useGroupMembersQuery } from "@/queries/useGroupMembersQuery";
import { useGroupPendingRequests } from "@/hooks/useGroupPendingRequests";

type GroupConversationTitleProps = {
  topic: ConversationTopic;
};

type UseUserInteractionProps = {
  topic: ConversationTopic;
  navigation: NativeStackNavigationProp<NavigationParamList>;
};

const useUserInteraction = ({ navigation, topic }: UseUserInteractionProps) => {
  const onPress = useCallback(() => {
    // textInputRef?.current?.blur();
    navigation.push("Group", { topic });
  }, [navigation, topic]);

  const onLongPress = useConversationTitleLongPress(topic);

  return { onPress, onLongPress };
};

export const GroupConversationTitle = memo(
  ({ topic }: GroupConversationTitleProps) => {
    const currentAccount = useCurrentAccount()!;

    const { data: groupName, isLoading: groupNameLoading } = useGroupNameQuery(
      currentAccount,
      topic!
    );

    const { data: groupPhoto, isLoading: groupPhotoLoading } =
      useGroupPhotoQuery(currentAccount, topic!);

    const { data: members } = useGroupMembersQuery(currentAccount, topic!);

    const { data: memberData } = useGroupMembersAvatarData({ topic });

    const navigation = useRouter();

    const { themed } = useAppTheme();

    const { onPress, onLongPress } = useUserInteraction({
      topic,
      navigation,
    });

    const requestsCount = useGroupPendingRequests(topic).length;

    const displayAvatar = !groupPhotoLoading && !groupNameLoading;

    const avatarComponent = useMemo(() => {
      return groupPhoto ? (
        <Avatar
          uri={groupPhoto}
          size={AvatarSizes.conversationTitle}
          style={themed($avatar)}
        />
      ) : (
        <GroupAvatarDumb
          members={memberData}
          size={AvatarSizes.conversationTitle}
          style={themed($avatar)}
        />
      );
    }, [groupPhoto, memberData, themed]);

    const memberText =
      members?.ids.length === 1
        ? translate("member_count", { count: members?.ids.length })
        : translate("members_count", { count: members?.ids.length });
    const displayMemberText = members?.ids.length;

    if (!displayAvatar) return null;

    return (
      <ConversationTitleDumb
        title={groupName ?? undefined}
        onLongPress={onLongPress}
        onPress={onPress}
        subtitle={
          displayMemberText ? (
            <Text preset="formLabel">
              {memberText}
              {requestsCount > 0 && (
                <>
                  {" • "}
                  <Text preset="formLabel" color="action">
                    {translate("pending_count", { count: requestsCount })}
                  </Text>
                </>
              )}
            </Text>
          ) : null
        }
        avatarComponent={avatarComponent}
      />
    );
  }
);

const $avatar: ThemedStyle<ImageStyle> = (theme) => ({
  marginRight: Platform.OS === "android" ? theme.spacing.lg : theme.spacing.xxs,
  marginLeft: Platform.OS === "ios" ? theme.spacing.zero : -theme.spacing.xxs,
});
