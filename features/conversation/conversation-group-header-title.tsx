import { Text } from "@/design-system/Text";
import { ConversationTitle } from "@/features/conversation/conversation-title";
import { useGroupNameConvos } from "@/features/conversation/hooks/use-group-name-convos";
import { useGroupPendingRequests } from "@/hooks/useGroupPendingRequests";
import { useProfilesSocials } from "@/hooks/useProfilesSocials";
import {
  useGroupMembersConversationScreenQuery,
  useGroupMembersQuery,
} from "@/queries/useGroupMembersQuery";
import { copyToClipboard } from "@/utils/clipboard";
import { getPreferredAvatar, getPreferredName } from "@/utils/profile";
import Avatar from "@components/Avatar";
import { GroupAvatarDumb } from "@components/GroupAvatar";
import { useCurrentAccount } from "@data/store/accountsStore";
import { translate } from "@i18n";
import { useRouter } from "@navigation/useNavigation";
import { useGroupPhotoQuery } from "@queries/useGroupPhotoQuery";
import { AvatarSizes } from "@styles/sizes";
import { ThemedStyle, useAppTheme } from "@theme/useAppTheme";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import React, { memo, useCallback, useMemo } from "react";
import { ImageStyle, Platform } from "react-native";

type GroupConversationTitleProps = {
  topic: ConversationTopic;
};

export const GroupConversationTitle = memo(
  ({ topic }: GroupConversationTitleProps) => {
    const currentAccount = useCurrentAccount()!;

    const { data: groupPhoto, isLoading: groupPhotoLoading } =
      useGroupPhotoQuery(currentAccount, topic!);

    const { data: members } = useGroupMembersQuery(currentAccount, topic!);

    const { data: memberData } = useGroupMembersAvatarData({ topic });

    const { groupName, isLoading: groupNameLoading } = useGroupNameConvos({
      topic,
      account: currentAccount,
    });

    const navigation = useRouter();

    const { themed } = useAppTheme();

    const onPress = useCallback(() => {
      navigation.push("Group", { topic });
    }, [navigation, topic]);

    const onLongPress = useCallback(() => {
      copyToClipboard(JSON.stringify(topic));
    }, [topic]);

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
      <ConversationTitle
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

type UseGroupMembersAvatarDataProps = {
  topic: ConversationTopic;
};

const useGroupMembersAvatarData = ({
  topic,
}: UseGroupMembersAvatarDataProps) => {
  const currentAccount = useCurrentAccount()!;
  const { data: members, ...query } = useGroupMembersConversationScreenQuery(
    currentAccount,
    topic
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

  return { data: memberData, ...query };
};
