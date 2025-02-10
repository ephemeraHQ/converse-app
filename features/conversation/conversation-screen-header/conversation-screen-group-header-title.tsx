import { GroupAvatar } from "@/components/group-avatar";
import { Text } from "@/design-system/Text";
import { ConversationHeaderTitle } from "@/features/conversation/conversation-screen-header/conversation-screen-header-title";
import { useGroupNameForCurrentAccount } from "@/hooks/useGroupName";
import { useGroupPendingRequests } from "@/hooks/useGroupPendingRequests";
import { useProfilesSocials } from "@/hooks/useProfilesSocials";
import { useGroupMembersQuery } from "@/queries/useGroupMembersQuery";
import { copyToClipboard } from "@/utils/clipboard";
import { getPreferredAvatar, getPreferredName } from "@/utils/profile";
import { useCurrentAccount } from "@data/store/accountsStore";
import { translate } from "@i18n";
import { useRouter } from "@navigation/useNavigation";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import React, { memo, useCallback, useMemo } from "react";

type GroupConversationTitleProps = {
  conversationTopic: ConversationTopic;
};

export const GroupConversationTitle = memo(
  ({ conversationTopic }: GroupConversationTitleProps) => {
    const currentAccount = useCurrentAccount()!;

    const { data: members } = useGroupMembersQuery({
      caller: "GroupConversationTitle",
      account: currentAccount,
      topic: conversationTopic,
    });

    const { groupName, isLoading: groupNameLoading } =
      useGroupNameForCurrentAccount({ conversationTopic });

    const navigation = useRouter();

    const onPress = useCallback(() => {
      navigation.push("Group", { topic: conversationTopic });
    }, [navigation, conversationTopic]);

    const onLongPress = useCallback(() => {
      copyToClipboard(JSON.stringify(conversationTopic));
    }, [conversationTopic]);

    const requestsCount = useGroupPendingRequests(conversationTopic).length;

    if (groupNameLoading) {
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
        avatarComponent={
          <GroupAvatar groupTopic={conversationTopic} size="md" />
        }
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
    caller: "useGroupMembersAvatarData",
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
