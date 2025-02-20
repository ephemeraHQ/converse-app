import {
  getCurrentSenderEthAddress,
  getSafeCurrentSender,
} from "@/features/multi-inbox/multi-inbox.store";
import {
  ensureDmPeerInboxIdQueryData,
  getDmPeerInboxIdQueryData,
} from "@/queries/use-dm-peer-inbox-id-query";
import {
  ensureGroupMembersQueryData,
  getGroupMembersQueryData,
} from "@/queries/useGroupMembersQuery";
import { ConversationTopic, InboxId } from "@xmtp/react-native-sdk";

export function inboxIdIsPartOfConversationUsingCacheData(args: {
  inboxId: InboxId;
  conversationTopic: ConversationTopic;
}) {
  const { inboxId, conversationTopic } = args;

  const members = getGroupMembersQueryData({
    account: getSafeCurrentSender().ethereumAddress,
    topic: conversationTopic,
  });

  const peerInboxId = getDmPeerInboxIdQueryData({
    account: getSafeCurrentSender().ethereumAddress,
    topic: conversationTopic,
  });

  return (
    peerInboxId === inboxId ||
    members?.ids.some((_inboxId) => _inboxId === inboxId)
  );
}

export async function inboxIdIsPartOfConversationUsingEnsure(args: {
  inboxId: InboxId;
  conversationTopic: ConversationTopic;
}) {
  const { inboxId, conversationTopic } = args;

  const account = getSafeCurrentSender().ethereumAddress;

  const [members, peerInboxId] = await Promise.all([
    ensureGroupMembersQueryData({
      caller: "inboxIdIsPartOfConversationUsingEnsure",
      account: account,
      topic: conversationTopic,
    }),
    ensureDmPeerInboxIdQueryData({
      caller: "inboxIdIsPartOfConversationUsingEnsure",
      account: account,
      topic: conversationTopic,
    }),
  ]);

  return (
    peerInboxId === inboxId ||
    members?.ids.some((_inboxId) => _inboxId === inboxId)
  );
}
