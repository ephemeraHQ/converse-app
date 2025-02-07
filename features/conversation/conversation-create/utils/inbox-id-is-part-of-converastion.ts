import { getCurrentAccount } from "@/data/store/accountsStore";
import { getDmPeerInboxIdQueryData } from "@/queries/use-dm-peer-inbox-id-query";
import { getGroupMembersQueryData } from "@/queries/useGroupMembersQuery";
import { ConversationTopic, InboxId } from "@xmtp/react-native-sdk";

export function inboxIdIsPartOfConversation(args: {
  inboxId: InboxId;
  conversationTopic: ConversationTopic;
}) {
  const { inboxId, conversationTopic } = args;

  const members = getGroupMembersQueryData({
    account: getCurrentAccount()!,
    topic: conversationTopic,
  });

  const peerInboxId = getDmPeerInboxIdQueryData({
    account: getCurrentAccount()!,
    topic: conversationTopic,
  });

  return (
    peerInboxId === inboxId ||
    members?.ids.some((_inboxId) => _inboxId === inboxId)
  );
}
