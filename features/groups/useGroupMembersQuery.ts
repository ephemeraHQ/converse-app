import { queryOptions as reactQueryOptions, skipToken, useQuery } from "@tanstack/react-query"
import { ConversationTopic, InboxId } from "@xmtp/react-native-sdk"
import { getOrFetchConversation } from "@/features/conversation/queries/conversation.query"
import { IGroupMember } from "@/features/groups/group.types"
import { Optional } from "@/types/general"
import { groupMembersQueryKey } from "../../queries/QueryKeys"
import { entify } from "../../utils/entify"
import { reactQueryClient } from "../../utils/react-query/react-query.client"

const memberEntityConfig = {
  getId: (member: IGroupMember) => member.inboxId,
} as const

type IGroupMembersArgsStrict = {
  account: string
  topic: ConversationTopic
}

type IGroupMembersArgsWithCaller = IGroupMembersArgsStrict & { caller: string }

type IGroupMembersEntity = Awaited<ReturnType<typeof fetchGroupMembers>>

const fetchGroupMembers = async (args: IGroupMembersArgsWithCaller) => {
  const { account, topic, caller } = args

  const conversation = await getOrFetchConversation({
    account,
    topic,
    caller,
  })

  if (!conversation) {
    throw new Error(`Group ${topic} not found in query data cache`)
  }

  const members = await conversation.members()

  /**
   * We can't really have an empty group...
   * And when a group is created on the SDK, the members are added in a separate call
   * So it can lead that we try to fetch the members before the group is created
   * So we retry a few times before giving up
   */
  if (members.length === 0) {
    throw new Error("Empty members list")
  }

  const convosMembers = members.map(
    (member): IGroupMember => ({
      inboxId: member.inboxId,
      permission: member.permissionLevel,
      consentState: member.consentState,
    }),
  )

  return entify(convosMembers, memberEntityConfig.getId)
}

export const getGroupMembersQueryOptions = (
  args: Optional<IGroupMembersArgsWithCaller, "caller">,
) => {
  const { account, topic, caller } = args
  const enabled = !!topic
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
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => Math.min(1000 * (attemptIndex + 1), 3000),
  })
}

export const useGroupMembersQuery = (args: IGroupMembersArgsWithCaller) => {
  return useQuery(getGroupMembersQueryOptions(args))
}

export const getGroupMembersQueryData = (args: IGroupMembersArgsStrict) => {
  const { account, topic } = args
  return reactQueryClient.getQueryData(getGroupMembersQueryOptions({ account, topic }).queryKey)
}

export const setGroupMembersQueryData = (
  args: IGroupMembersArgsStrict & {
    members: IGroupMembersEntity
  },
) => {
  const { account, topic, members } = args
  reactQueryClient.setQueryData(getGroupMembersQueryOptions({ account, topic }).queryKey, members)
}

export const cancelGroupMembersQuery = async (args: IGroupMembersArgsStrict) => {
  const { account, topic } = args
  return reactQueryClient.cancelQueries({
    queryKey: getGroupMembersQueryOptions({ account, topic }).queryKey,
  })
}

export const invalidateGroupMembersQuery = (args: IGroupMembersArgsStrict) => {
  const { account, topic } = args
  return reactQueryClient.invalidateQueries({
    queryKey: getGroupMembersQueryOptions({ account, topic }).queryKey,
  })
}

export function refetchGroupMembersQuery(args: IGroupMembersArgsStrict) {
  const { account, topic } = args
  return reactQueryClient.refetchQueries({
    queryKey: getGroupMembersQueryOptions({ account, topic }).queryKey,
  })
}

export async function ensureGroupMembersQueryData(args: IGroupMembersArgsWithCaller) {
  const { account, topic, caller } = args
  return reactQueryClient.ensureQueryData(
    getGroupMembersQueryOptions({
      account,
      topic,
      caller,
    }),
  )
}

export function addGroupMembersToQueryData(
  args: IGroupMembersArgsStrict & {
    member: IGroupMember
  },
) {
  const { account, topic, member } = args
  const members = getGroupMembersQueryData({ account, topic })
  if (!members) {
    return
  }

  const entifiedMembers = entify([...Object.values(members.byId), member], memberEntityConfig.getId)

  setGroupMembersQueryData({ account, topic, members: entifiedMembers })
}

export function removeMembersFromGroupQueryData(
  args: IGroupMembersArgsStrict & {
    memberInboxIds: InboxId[]
  },
) {
  const { account, topic, memberInboxIds } = args

  const members = getGroupMembersQueryData({ account, topic })

  if (!members) {
    return
  }

  const newMembers = {
    ...members,
    ids: members.ids.filter((id) => !memberInboxIds.includes(id)),
    byId: Object.fromEntries(
      Object.entries(members.byId).filter(([id]) => !memberInboxIds.includes(id)),
    ),
  }

  setGroupMembersQueryData({ account, topic, members: newMembers })
}
