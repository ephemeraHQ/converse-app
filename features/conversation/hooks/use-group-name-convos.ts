/**
 * Will return the group name if exists OR it will create a default name
 * based on members name
 */

import { usePreferredNames } from "@/hooks/usePreferredNames";
import { useGroupMembersQuery } from "@/queries/useGroupMembersQuery";
import { useGroupNameQuery } from "@/queries/useGroupNameQuery";
import { ConversationTopic } from "@xmtp/react-native-sdk";

export function useGroupNameConvos(args: {
  topic: ConversationTopic;
  account: string;
}) {
  const { topic, account } = args;

  const { data: groupName, isLoading: groupNameLoading } = useGroupNameQuery({
    account,
    topic,
  });

  const { data: members, isLoading: membersLoading } = useGroupMembersQuery(
    account,
    topic
  );

  const memberAddresses = members?.ids
    .map((id) => members?.byId[id]?.addresses[0])
    .filter((address) => address !== account);

  const names = usePreferredNames(memberAddresses ?? []);

  return {
    groupName: groupName || names.join(", "),
    isLoading: groupNameLoading || membersLoading,
  };
}
