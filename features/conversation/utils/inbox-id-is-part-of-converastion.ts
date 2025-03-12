import { ConversationTopic, InboxId } from "@xmtp/react-native-sdk"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import {
  ensureDmPeerInboxIdQueryData,
  getDmPeerInboxIdQueryData,
} from "@/features/dm/use-dm-peer-inbox-id-query"
import {
  ensureGroupMembersQueryData,
  getGroupMembersQueryData,
} from "@/features/groups/useGroupMembersQuery"

export function inboxIdIsPartOfConversationUsingCacheData(args: {
  inboxId: InboxId
  conversationTopic: ConversationTopic
}) {
  const { inboxId, conversationTopic } = args

  const members = getGroupMembersQueryData({
    clientInboxId: getSafeCurrentSender().inboxId,
    topic: conversationTopic,
  })

  const peerInboxId = getDmPeerInboxIdQueryData({
    inboxId: getSafeCurrentSender().inboxId,
    topic: conversationTopic,
  })

  return peerInboxId === inboxId || members?.ids.some((_inboxId) => _inboxId === inboxId)
}

export async function inboxIdIsPartOfConversationUsingEnsure(args: {
  inboxId: InboxId
  conversationTopic: ConversationTopic
}) {
  const { inboxId, conversationTopic } = args

  const currentSender = getSafeCurrentSender()

  const [members, peerInboxId] = await Promise.all([
    ensureGroupMembersQueryData({
      caller: "inboxIdIsPartOfConversationUsingEnsure",
      clientInboxId: currentSender.inboxId,
      topic: conversationTopic,
    }),
    ensureDmPeerInboxIdQueryData({
      caller: "inboxIdIsPartOfConversationUsingEnsure",
      inboxId: currentSender.inboxId,
      topic: conversationTopic,
    }),
  ])

  return peerInboxId === inboxId || members?.ids.some((_inboxId) => _inboxId === inboxId)
}
