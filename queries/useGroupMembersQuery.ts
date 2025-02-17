import { getOrFetchConversation } from "@/queries/conversation-query";
import {
  queryOptions as reactQueryOptions,
  useQuery,
  skipToken,
} from "@tanstack/react-query";
import { getCleanAddress } from "@utils/evm/getCleanAddress";
import { ConversationTopic, Member } from "@xmtp/react-native-sdk";
import { InboxId } from "@xmtp/react-native-sdk/build/lib/Client";
import { groupMembersQueryKey } from "./QueryKeys";
import { EntityObjectWithAddress, entifyWithAddress } from "./entify";
import { queryClient } from "./queryClient";
import { Optional } from "@/types/general";

export type GroupMembersSelectData = EntityObjectWithAddress<Member, InboxId>;

type IGroupMembersArgs = {
  account: string;
  topic: ConversationTopic;
};

type IGroupMembersArgsWithCaller = IGroupMembersArgs & { caller: string };

const fetchGroupMembers = async (
  args: IGroupMembersArgsWithCaller
): Promise<EntityObjectWithAddress<Member, InboxId>> => {
  const { account, topic, caller } = args;

  const conversation = await getOrFetchConversation({
    account,
    topic,
    caller,
  });

  if (!conversation) {
    throw new Error(`Group ${topic} not found in query data cache`);
  }

  const members = await conversation.members();

  /**
   * We can't really have an empty group...
   * And when a group is created on the SDK, the members are added in a separate call
   * So it can lead that we try to fetch the members before the group is created
   * So we retry a few times before giving up
   */
  if (members.length === 0) {
    throw new Error("Empty members list");
  }

  return entifyWithAddress(
    members,
    (member) => member.inboxId,
    (member) => getCleanAddress(member.addresses[0])
  );
};

export const getGroupMembersQueryOptions = (
  args: Optional<IGroupMembersArgsWithCaller, "caller">
) => {
  const { account, topic, caller } = args;
  const enabled = !!topic;
  return reactQueryOptions({
    meta: {
      caller,
    },
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: groupMembersQueryKey({ account, topic }),
    queryFn: enabled
      ? () => fetchGroupMembers({ account, topic, caller: caller ?? "unknown" })
      : skipToken,
    enabled,
    /**
     * We can't really have an empty group...
     * And when a group is created on the SDK, the members are added in a separate call
     * So it can lead that we try to fetch the members before the group is created
     * So we retry a few times before giving up
     */
    retry: (failureCount) => {
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * (attemptIndex + 1), 3000),
  });
};

export const useGroupMembersQuery = (args: IGroupMembersArgsWithCaller) => {
  return useQuery(getGroupMembersQueryOptions(args));
};

export const getGroupMembersQueryData = (
  args: IGroupMembersArgs
): GroupMembersSelectData | undefined => {
  const { account, topic } = args;
  return queryClient.getQueryData(
    getGroupMembersQueryOptions({ account, topic }).queryKey
  );
};

export const setGroupMembersQueryData = (
  args: IGroupMembersArgs & {
    members: GroupMembersSelectData;
  }
) => {
  const { account, topic, members } = args;
  queryClient.setQueryData(
    getGroupMembersQueryOptions({ account, topic }).queryKey,
    members
  );
};

export const cancelGroupMembersQuery = async (args: IGroupMembersArgs) => {
  const { account, topic } = args;
  return queryClient.cancelQueries({
    queryKey: getGroupMembersQueryOptions({ account, topic }).queryKey,
  });
};

export const invalidateGroupMembersQuery = (args: IGroupMembersArgs) => {
  const { account, topic } = args;
  return queryClient.invalidateQueries({
    queryKey: getGroupMembersQueryOptions({ account, topic }).queryKey,
  });
};

export function refetchGroupMembersQuery(args: IGroupMembersArgs) {
  const { account, topic } = args;
  return queryClient.refetchQueries({
    queryKey: getGroupMembersQueryOptions({ account, topic }).queryKey,
  });
}

export async function ensureGroupMembersQueryData(
  args: IGroupMembersArgsWithCaller
) {
  const { account, topic, caller } = args;
  return queryClient.ensureQueryData(
    getGroupMembersQueryOptions({
      account,
      topic,
      caller,
    })
  );
}
