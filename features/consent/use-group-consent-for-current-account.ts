import { useQuery } from "@tanstack/react-query"
import { ConversationTopic, InboxId } from "@xmtp/react-native-sdk"
import { useCallback } from "react"
import { showSnackbar } from "@/components/snackbar/snackbar.service"
import { useAllowGroupMutation } from "@/features/consent/use-allow-group.mutation"
import { useDenyGroupMutation } from "@/features/consent/use-deny-group.mutation"
import { useGroupCreatorQuery } from "@/features/groups/useGroupCreatorQuery"
import { getGroupQueryOptions, useGroupQuery } from "@/features/groups/useGroupQuery"
import { translate } from "@/i18n"
import { useSafeCurrentSender } from "../authentication/multi-inbox.store"
import { setXmtpConsentStateForInboxId } from "../xmtp/xmtp-consent/xmtp-consent"

export type IGroupConsentOptions = {
  includeCreator?: boolean
  includeAddedBy?: boolean
}

export const useGroupConsentForCurrentAccount = (topic: ConversationTopic) => {
  const currentSender = useSafeCurrentSender()

  const { data: group, isLoading: isGroupLoading } = useGroupQuery({
    inboxId: currentSender.inboxId,
    topic,
  })

  const { data: groupCreator, isLoading: isGroupCreatorLoading } = useGroupCreatorQuery(topic)

  const {
    data: groupConsent,
    isLoading: isGroupConsentLoading,
    isError,
  } = useQuery({
    ...getGroupQueryOptions({ inboxId: currentSender.inboxId, topic }),
    select: (group) => group?.state,
  })

  const { mutateAsync: allowGroupMutation, isPending: isAllowingGroup } = useAllowGroupMutation({
    clientInboxId: currentSender.inboxId,
    topic,
  })

  const { mutateAsync: denyGroupMutation, isPending: isDenyingGroup } = useDenyGroupMutation({
    clientInboxId: currentSender.inboxId,
    topic,
  })

  const allowGroup = useCallback(
    async (args: IGroupConsentOptions) => {
      const { includeAddedBy, includeCreator } = args

      if (!group) {
        throw new Error("Group is required")
      }

      await allowGroupMutation({
        clientInboxId: currentSender.inboxId,
        topic,
        includeAddedBy,
        includeCreator,
      })
    },
    [allowGroupMutation, group, currentSender, topic],
  )

  const denyGroup = useCallback(
    async (args: IGroupConsentOptions) => {
      const { includeAddedBy, includeCreator } = args

      if (!group) {
        showSnackbar({
          type: "error",
          message: translate("group_not_found"),
        })
        return
      }

      await denyGroupMutation()

      const inboxIdsToDeny: InboxId[] = []

      if (includeAddedBy && group.addedByInboxId) {
        inboxIdsToDeny.push(group.addedByInboxId)
      }

      if (includeCreator && groupCreator) {
        inboxIdsToDeny.push(groupCreator)
      }

      if (inboxIdsToDeny.length > 0) {
        await Promise.all(
          inboxIdsToDeny.map((inboxId) =>
            setXmtpConsentStateForInboxId({
              inboxId,
              consent: "denied",
            }),
          ),
        )
      }
    },
    [denyGroupMutation, groupCreator, group],
  )

  const isLoading = isGroupLoading || isGroupCreatorLoading || isGroupConsentLoading

  return {
    consent: groupConsent,
    isLoading,
    isError,
    allowGroup,
    denyGroup,
    isAllowingGroup,
    isDenyingGroup,
  }
}
