import { queryOptions as reactQueryOptions, skipToken, useQuery } from "@tanstack/react-query"
import { ConversationTopic, InboxId } from "@xmtp/react-native-sdk"
import { getOrFetchConversationQuery } from "@/features/conversation/queries/conversation.query"
import { IGroupMember } from "@/features/groups/group.types"
import { Optional } from "@/types/general"
import { entify } from "../../utils/entify"
import { reactQueryClient } from "../../utils/react-query/react-query.client"

const memberEntityConfig = {
  getId: (member: IGroupMember) => member.inboxId,
} as const

type IGroupMembersArgsStrict = {
  clientInboxId: InboxId
  topic: ConversationTopic
}

type IGroupMembersArgsWithCaller = IGroupMembersArgsStrict & { caller: string }

type IGroupMembersEntity = Awaited<ReturnType<typeof fetchGroupMembers>>

const fetchGroupMembers = async (args: IGroupMembersArgsWithCaller) => {
  const { clientInboxId: clientInboxId, topic, caller } = args

  const conversation = await getOrFetchConversationQuery({
    inboxId: clientInboxId,
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
  const { clientInboxId: clientInboxId, topic, caller } = args
  const enabled = !!topic
  return reactQueryOptions({
    meta: {
      caller,
    },
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: ["group-members", args.clientInboxId, args.topic],
    queryFn: enabled
      ? () =>
          fetchGroupMembers({ clientInboxId: clientInboxId, topic, caller: caller ?? "unknown" })
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
  const { clientInboxId: inboxId, topic } = args
  return reactQueryClient.getQueryData(
    getGroupMembersQueryOptions({ clientInboxId: inboxId, topic }).queryKey,
  )
}

export const setGroupMembersQueryData = (
  args: IGroupMembersArgsStrict & {
    members: IGroupMembersEntity
  },
) => {
  const { clientInboxId: clientInboxId, topic, members } = args
  reactQueryClient.setQueryData(
    getGroupMembersQueryOptions({ clientInboxId: clientInboxId, topic }).queryKey,
    members,
  )
}

export async function cancelGroupMembersQuery(args: IGroupMembersArgsStrict) {
  const { clientInboxId, topic } = args
  return reactQueryClient.cancelQueries({
    queryKey: getGroupMembersQueryOptions({ clientInboxId, topic }).queryKey,
  })
}

export async function invalidateGroupMembersQuery(args: IGroupMembersArgsStrict) {
  const { clientInboxId, topic } = args
  return reactQueryClient.invalidateQueries({
    queryKey: getGroupMembersQueryOptions({ clientInboxId, topic }).queryKey,
  })
}

export async function refetchGroupMembersQuery(args: IGroupMembersArgsStrict) {
  const { clientInboxId, topic } = args
  return reactQueryClient.refetchQueries({
    queryKey: getGroupMembersQueryOptions({ clientInboxId, topic }).queryKey,
  })
}

export async function ensureGroupMembersQueryData(args: IGroupMembersArgsWithCaller) {
  const { clientInboxId, topic, caller } = args
  return reactQueryClient.ensureQueryData(
    getGroupMembersQueryOptions({
      clientInboxId,
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
  const { clientInboxId: clientInboxId, topic, member } = args
  const members = getGroupMembersQueryData({ clientInboxId: clientInboxId, topic })
  if (!members) {
    return
  }

  const entifiedMembers = entify([...Object.values(members.byId), member], memberEntityConfig.getId)

  setGroupMembersQueryData({ clientInboxId: clientInboxId, topic, members: entifiedMembers })
}

export function removeMembersFromGroupQueryData(
  args: IGroupMembersArgsStrict & {
    memberInboxIds: InboxId[]
  },
) {
  const { clientInboxId: clientInboxId, topic, memberInboxIds } = args

  const members = getGroupMembersQueryData({ clientInboxId: clientInboxId, topic })

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

  setGroupMembersQueryData({ clientInboxId: clientInboxId, topic, members: newMembers })
}
