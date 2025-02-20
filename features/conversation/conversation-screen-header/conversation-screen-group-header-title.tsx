import { GroupAvatar } from "@/components/group-avatar";
import { Text } from "@/design-system/Text";
import { ConversationHeaderTitle } from "@/features/conversation/conversation-screen-header/conversation-screen-header-title";
import { useGroupName } from "@/hooks/useGroupName";
// import { useGroupPendingRequests } from "@/hooks/useGroupPendingRequests";
import { useGroupMembersQuery } from "@/queries/useGroupMembersQuery";
import { copyToClipboard } from "@/utils/clipboard";
import { useCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
import { translate } from "@i18n";
import { useRouter } from "@/navigation/use-navigation";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import React, { memo, useCallback } from "react";

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

    const { groupName, isLoading: groupNameLoading } = useGroupName({
      conversationTopic,
    });

    const navigation = useRouter();

    const onPress = useCallback(() => {
      navigation.push("Conversation", { topic: conversationTopic });
    }, [navigation, conversationTopic]);

    const onLongPress = useCallback(() => {
      copyToClipboard(JSON.stringify(conversationTopic));
    }, [conversationTopic]);

    const requestsCount = 0; // TODO useGroupPendingRequests(conversationTopic).length;

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
