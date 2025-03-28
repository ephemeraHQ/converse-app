/**
 * This is derived from conversation.query.ts.
 */
import type { IXmtpConversationId, IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { queryOptions, useQuery, UseQueryOptions } from "@tanstack/react-query"
import {
  ensureConversationQueryData,
  getConversationQueryData,
  getConversationQueryOptions,
  invalidateConversationQuery,
  setConversationQueryData,
  updateConversationQueryData,
} from "@/features/conversation/queries/conversation.query"
import { IGroup, IGroupMember } from "@/features/groups/group.types"

type IArgs = {
  clientInboxId: IXmtpInboxId
  xmtpConversationId: IXmtpConversationId
}

type IArgsWithCaller = IArgs & {
  caller: string
}

export function useGroupQuery(args: IArgs) {
  const { clientInboxId, xmtpConversationId } = args

  return useQuery(
    getGroupQueryOptions({
      clientInboxId,
      xmtpConversationId,
      caller: "useGroupQuery",
    }),
  )
}

export function getGroupQueryData(args: IArgs) {
  return getConversationQueryData({
    clientInboxId: args.clientInboxId,
    xmtpConversationId: args.xmtpConversationId,
  }) as IGroup | null
}

export function setGroupQueryData(args: IArgs & { group: IGroup }) {
  const { clientInboxId, xmtpConversationId, group } = args
  setConversationQueryData({
    clientInboxId,
    xmtpConversationId,
    conversation: group,
  })
}

export function getGroupQueryOptions(args: IArgsWithCaller) {
  const { clientInboxId, xmtpConversationId, caller } = args

  return queryOptions({
    ...(getConversationQueryOptions({
      clientInboxId,
      xmtpConversationId,
      caller,
    }) as UseQueryOptions<IGroup | null, Error, IGroup | null, string[]>),
  })
}

export function updateGroupQueryData(args: IArgs & { updates: Partial<IGroup> }) {
  return updateConversationQueryData({
    clientInboxId: args.clientInboxId,
    xmtpConversationId: args.xmtpConversationId,
    conversationUpdate: args.updates,
  })
}

export function getOrFetchGroupQuery(args: IArgsWithCaller) {
  return ensureConversationQueryData(args)
}

export async function addGroupMemberToGroupQueryData(args: IArgs & { member: IGroupMember }) {
  const { clientInboxId, xmtpConversationId, member } = args

  const group = await ensureGroupQueryData({
    ...args,
    caller: "addGroupMemberToGroupQuery",
  })

  if (!group) {
    throw new Error(`Couldn't add member because the group doesn't exist`)
  }

  setGroupQueryData({
    clientInboxId,
    xmtpConversationId,
    group: {
      ...group,
      members: {
        ...group.members,
        byId: {
          ...group.members.byId,
          [member.inboxId]: member,
        },
        ids: [...group.members.ids, member.inboxId],
      },
    },
  })
}

export async function removeGroupMemberToGroupQuery(args: IArgs & { memberInboxId: IXmtpInboxId }) {
  const { clientInboxId, xmtpConversationId, memberInboxId } = args

  const group = await ensureGroupQueryData({
    ...args,
    caller: "removeGroupMemberToGroupQuery",
  })

  if (!group) {
    throw new Error(`Couldn't remove member because the group doesn't exist`)
  }

  setGroupQueryData({
    clientInboxId,
    xmtpConversationId,
    group: {
      ...group,
      members: {
        ...group.members,
        byId: {
          ...group.members.byId,
          [memberInboxId]: undefined,
        },
      },
    },
  })
}

export function invalidateGroupQuery(args: IArgs) {
  return invalidateConversationQuery(args)
}

export async function ensureGroupQueryData(args: IArgsWithCaller) {
  return (await ensureConversationQueryData(args)) as IGroup | null
}
