import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { getCurrentInboxId } from "../data/store/accountsStore";
import { useGroupMembersQuery } from "../queries/useGroupMembersQuery";
import { useGroupNameMutation } from "../queries/useGroupNameMutation";
import { useGroupNameQuery } from "../queries/useGroupNameQuery";
import { usePreferredNames } from "./usePreferredNames";

export const useGroupNameForCurrentUser = ({
  topic,
}: {
  topic: ConversationTopic | undefined;
}) => {
  const inboxId = getCurrentInboxId()!;

  const {
    data: groupName,
    isLoading: groupNameLoading,
    isError,
  } = useGroupNameQuery({
    inboxId,
    topic: topic!,
  });

  const { data: members, isLoading: membersLoading } = useGroupMembersQuery({
    inboxId,
    topic: topic!, // ! because we have enabled in the useQuery
    queryOptions: {
      enabled: !groupName, // If we have the group name, we don't need to fetch the members
    },
  });

  // const memberAddresses = members?.ids
  //   .map((id) => members?.byId[id]?.addresses[0])
  //   .filter((address) => address !== account);

  const names = usePreferredNames({
    peerInboxIds: members?.ids ?? [],
  });

  const { mutateAsync } = useGroupNameMutation({
    inboxId,
    topic: topic!,
  });

  return {
    groupName: groupName || names.join(", "),
    isLoading: groupNameLoading || membersLoading,
    isError,
    updateGroupName: mutateAsync,
  };
};
