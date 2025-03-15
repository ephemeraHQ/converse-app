/**
 * useGroupQuery is derived from useConversationQuery. Like useDmQuery, maybe worth considering if we should just use useConversationQuery instead.
 */
import type { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { queryOptions, useQuery } from "@tanstack/react-query"
import {
  getConversationQueryData,
  getConversationQueryOptions,
  getOrFetchConversationQuery,
  setConversationQueryData,
  updateConversationQueryData,
} from "@/features/conversation/queries/conversation.query"
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group"
import { IGroup, IGroupMember } from "@/features/groups/group.types"
import type { IConversationTopic } from "../conversation/conversation.types"

type IArgs = {
  clientInboxId: IXmtpInboxId
  topic: IConversationTopic
}

type IArgsWithCaller = IArgs & {
  caller: string
}

// async function getGroup(args: IArgs) {
//   const { clientInboxId, topic } = args

//   const group = await getOrFetchConversationQuery({
//     clientInboxId,
//     topic,
//     caller: "getGroup",
//   })

//   if (!group) {
//     return null
//   }

//   if (!isConversationGroup(group)) {
//     throw new Error("Expected group conversation but received different type")
//   }

//   return group
// }

export function useGroupQuery(args: IArgs) {
  const { clientInboxId, topic } = args

  return useQuery(
    getGroupQueryOptions({
      clientInboxId,
      topic,
      caller: "useGroupQuery",
    }),
  )
}

export function getGroupQueryData(args: IArgs) {
  return getConversationQueryData({
    clientInboxId: args.clientInboxId,
    topic: args.topic,
  }) as IGroup | null
}

export function setGroupQueryData(args: IArgs & { group: IGroup }) {
  const { clientInboxId, topic, group } = args
  setConversationQueryData({
    clientInboxId,
    topic,
    conversation: group,
  })
}

export function getGroupQueryOptions(args: IArgsWithCaller) {
  const { clientInboxId, topic, caller } = args

  return queryOptions({
    // queryKey: ["group", clientInboxId, topic],
    // enabled: !!topic && !!clientInboxId,
    // meta: {
    //   caller,
    // },
    // queryFn: () =>
    //   getGroup({
    //     clientInboxId,
    //     topic,
    //   }),
    ...getConversationQueryOptions({
      clientInboxId,
      topic,
      caller,
    }),
    select: (data) => {
      if (!data) {
        return null
      }
      if (!isConversationGroup(data)) {
        throw new Error("Expected group conversation but received different type")
      }
      return data
    },
  })
}

export function updateGroupQueryData(args: IArgs & { updates: Partial<IGroup> }) {
  updateConversationQueryData({
    clientInboxId: args.clientInboxId,
    topic: args.topic,
    conversationUpdate: args.updates,
  })
}

export function getOrFetchGroupQuery(args: IArgsWithCaller) {
  return getOrFetchConversationQuery({
    clientInboxId: args.clientInboxId,
    topic: args.topic,
    caller: args.caller,
  })
}

export function addGroupMemberToGroupQuery(args: IArgs & { member: IGroupMember }) {
  const { clientInboxId, topic, member } = args

  const currentGroup = getGroupQueryData(args)

  if (!currentGroup) {
    throw new Error(`Couldn't add member because the group doesn't exist`)
  }

  setGroupQueryData({
    clientInboxId,
    topic,
    group: {
      ...currentGroup,
      members: [...currentGroup.members, member],
    },
  })
}

export function removeGroupMemberToGroupQuery(args: IArgs & { memberInboxId: IXmtpInboxId }) {
  const { clientInboxId, topic, memberInboxId } = args

  const currentGroup = getGroupQueryData(args)

  if (!currentGroup) {
    throw new Error(`Couldn't remove member because the group doesn't exist`)
  }

  setGroupQueryData({
    clientInboxId,
    topic,
    group: {
      ...currentGroup,
      members: currentGroup.members.filter(({ inboxId }) => inboxId !== memberInboxId),
    },
  })
}
