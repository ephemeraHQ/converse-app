import { useQuery } from "@tanstack/react-query"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { getGroupQueryOptions } from "@/features/groups/queries/group.query"
import { getPreferredDisplayInfo } from "@/features/preferred-display-info/use-preferred-display-info"
import { usePreferredDisplayInfoBatch } from "@/features/preferred-display-info/use-preferred-display-info-batch"
import { IXmtpConversationId, IXmtpInboxId } from "@/features/xmtp/xmtp.types"

export function getGroupNameForGroupMembers(args: { memberInboxIds: IXmtpInboxId[] }) {
  const { memberInboxIds } = args

  const groupName = getGroupNameForMemberNames({
    names: memberInboxIds.map(
      (inboxId) =>
        getPreferredDisplayInfo({
          inboxId,
        }).displayName ?? "",
    ),
  })

  return groupName
}

export const useGroupName = (args: { xmtpConversationId: IXmtpConversationId }) => {
  const { xmtpConversationId } = args

  const currentSenderInboxId = useSafeCurrentSender().inboxId

  const { data: group, isLoading: isLoadingGroup } = useQuery({
    ...getGroupQueryOptions({
      clientInboxId: currentSenderInboxId,
      xmtpConversationId,
      caller: "useGroupName",
    }),
  })

  const preferredDisplayData = usePreferredDisplayInfoBatch({
    xmtpInboxIds: group?.members?.ids ?? [],
  })

  const memberPreferedDisplayNames = preferredDisplayData?.map(
    (profile) => profile?.displayName || "",
  )

  return {
    groupName: group?.name || getGroupNameForMemberNames({ names: memberPreferedDisplayNames }),
    isLoading: isLoadingGroup || preferredDisplayData.some((profile) => profile.isLoading),
  }
}

function getGroupNameForMemberNames(args: { names: string[] }) {
  return args.names.join(", ")
}
