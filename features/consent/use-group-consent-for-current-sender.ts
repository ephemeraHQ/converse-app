import { IXmtpConversationId, IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { useQuery } from "@tanstack/react-query"
import { useCallback } from "react"
import { showSnackbar } from "@/components/snackbar/snackbar.service"
import { useAllowGroupMutation } from "@/features/consent/use-allow-group.mutation"
import { useDenyGroupMutation } from "@/features/consent/use-deny-group.mutation"
import { getGroupQueryOptions, useGroupQuery } from "@/features/groups/queries/group.query"
import { translate } from "@/i18n"
import { useSafeCurrentSender } from "../authentication/multi-inbox.store"
import { IConversationTopic } from "../conversation/conversation.types"
import { setXmtpConsentStateForInboxId } from "../xmtp/xmtp-consent/xmtp-consent"

export type IGroupConsentOptions = {
  includeCreator?: boolean
  includeAddedBy?: boolean
}

export const useGroupConsentForCurrentSender = (args: {
  xmtpConversationId: IXmtpConversationId
}) => {
  const { xmtpConversationId } = args

  const currentSender = useSafeCurrentSender()

  const { data: group, isLoading: isGroupLoading } = useGroupQuery({
    clientInboxId: currentSender.inboxId,
    xmtpConversationId,
  })

  const {
    data: groupConsent,
    isLoading: isGroupConsentLoading,
    isError,
  } = useQuery({
    ...getGroupQueryOptions({
      clientInboxId: currentSender.inboxId,
      xmtpConversationId,
      caller: "useGroupConsentForCurrentAccount",
    }),
    select: (group) => group?.consentState,
  })

  const { mutateAsync: allowGroupMutation, isPending: isAllowingGroup } = useAllowGroupMutation({
    clientInboxId: currentSender.inboxId,
    xmtpConversationId,
  })

  const { mutateAsync: denyGroupMutation, isPending: isDenyingGroup } = useDenyGroupMutation({
    clientInboxId: currentSender.inboxId,
    xmtpConversationId,
  })

  const allowGroup = useCallback(
    async (args: IGroupConsentOptions) => {
      const { includeAddedBy, includeCreator } = args

      if (!group) {
        throw new Error("Group is required")
      }

      await allowGroupMutation({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId,
        includeAddedBy,
        includeCreator,
      })
    },
    [allowGroupMutation, group, currentSender, xmtpConversationId],
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

      const inboxIdsToDeny: IXmtpInboxId[] = []

      if (includeAddedBy && group.addedByInboxId) {
        inboxIdsToDeny.push(group.addedByInboxId)
      }

      if (includeCreator && group.creatorInboxId) {
        inboxIdsToDeny.push(group.creatorInboxId)
      }

      if (inboxIdsToDeny.length > 0) {
        await Promise.all(
          inboxIdsToDeny.map((inboxId) =>
            setXmtpConsentStateForInboxId({
              peerInboxId: inboxId,
              consent: "denied",
            }),
          ),
        )
      }
    },
    [denyGroupMutation, group],
  )

  const isLoading = isGroupLoading || isGroupConsentLoading

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
