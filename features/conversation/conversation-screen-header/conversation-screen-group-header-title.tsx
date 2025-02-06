import { GroupAvatarMembers } from "@/components/group-avatar";
import { Text } from "@/design-system/Text";
import { ConversationHeaderTitle } from "@/features/conversation/conversation-screen-header/conversation-screen-header-title";
import { useGroupNameForCurrentAccount } from "@/hooks/useGroupName";
import { useGroupPendingRequests } from "@/hooks/useGroupPendingRequests";
import { useProfilesSocials } from "@/hooks/useProfilesSocials";
import { useGroupMembersQuery } from "@/queries/useGroupMembersQuery";
import { copyToClipboard } from "@/utils/clipboard";
import { getPreferredAvatar, getPreferredName } from "@/utils/profile";
import { Avatar } from "@components/Avatar";
import { useCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
import { translate } from "@i18n";
import { useRouter } from "@navigation/useNavigation";
import { useGroupPhotoQuery } from "@queries/useGroupPhotoQuery";
import { useAppTheme } from "@theme/useAppTheme";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import React, { memo, useCallback, useMemo } from "react";

type GroupConversationTitleProps = {
  conversationTopic: ConversationTopic;
};

export const GroupConversationTitle = memo(
  ({ conversationTopic }: GroupConversationTitleProps) => {
    const currentAccount = useCurrentAccount()!;

    const { data: groupPhoto, isLoading: groupPhotoLoading } =
      useGroupPhotoQuery({
        account: currentAccount,
        topic: conversationTopic,
      });

    const { data: members } = useGroupMembersQuery({
      account: currentAccount,
      topic: conversationTopic,
    });

    const { data: memberData } = useGroupMembersAvatarData({
      topic: conversationTopic,
    });

    const { groupName, isLoading: groupNameLoading } =
      useGroupNameForCurrentAccount({ conversationTopic });

    const navigation = useRouter();

    const { theme } = useAppTheme();

    const onPress = useCallback(() => {
      navigation.push("Group", { topic: conversationTopic });
    }, [navigation, conversationTopic]);

    const onLongPress = useCallback(() => {
      copyToClipboard(JSON.stringify(conversationTopic));
    }, [conversationTopic]);

    const requestsCount = useGroupPendingRequests(conversationTopic).length;

    const avatarComponent = useMemo(() => {
      return groupPhoto ? (
        <Avatar uri={groupPhoto} size={theme.avatarSize.md} />
      ) : (
        <GroupAvatarMembers members={memberData} size={theme.avatarSize.md} />
      );
    }, [groupPhoto, memberData, theme]);

    if (groupPhotoLoading || groupNameLoading) {
      return null;
    }

    const memberText =
      members?.ids.length === 1
        ? translate("member_count", { count: members?.ids.length })
        : translate("members_count", { count: members?.ids.length });
    const displayMemberText = members?.ids.length;

    return (
      <ConversationHeaderTitle
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

type IMemberData = {
  address: string;
  uri?: string;
  name?: string;
};

const useGroupMembersAvatarData = (args: { topic: ConversationTopic }) => {
  const { topic } = args;
  const currentAccount = useCurrentAccount()!;
  const { data: members, ...query } = useGroupMembersQuery({
    account: currentAccount,
    topic,
  });

  const memberAddresses = useMemo(() => {
    if (!members?.ids) {
      return [];
    }

    return members.ids.reduce<string[]>((addresses, memberId) => {
      const memberAddress = members.byId[memberId]?.addresses[0];
      if (
        memberAddress &&
        memberAddress.toLowerCase() !== currentAccount?.toLowerCase()
      ) {
        addresses.push(memberAddress);
      }
      return addresses;
    }, []);
  }, [members, currentAccount]);

  const data = useProfilesSocials(memberAddresses);

  const memberData = useMemo<IMemberData[]>(() => {
    return data.map(({ data: socials }, index) => {
      const address = memberAddresses[index];
      if (!socials) {
        return {
          address,
          name: address,
        };
      }

      return {
        address,
        uri: getPreferredAvatar(socials),
        name: getPreferredName(socials, address),
      };
    });
  }, [data, memberAddresses]);

  return { data: memberData, ...query };
};
