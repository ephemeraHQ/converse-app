import { ConversationTopic, InboxId } from "@xmtp/react-native-sdk"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { useGroupMembersQuery } from "@/features/groups/useGroupMembersQuery"

export function useGroupMember(args: {
  memberInboxId: InboxId | undefined
  topic: ConversationTopic
}) {
  const { memberInboxId, topic } = args

  const currentSender = useSafeCurrentSender()

  const { data: members, isLoading: isLoadingMembers } = useGroupMembersQuery({
    clientInboxId: currentSender.inboxId,
    topic,
    caller: "useGroupMember",
  })

  return {
    groupMember: memberInboxId ? members?.byId[memberInboxId] : undefined,
    isLoadingGroupMember: isLoadingMembers,
  }
}
