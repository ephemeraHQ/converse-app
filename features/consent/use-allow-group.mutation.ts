import { IXmtpConversationId, IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { MutationObserver, MutationOptions, useMutation } from "@tanstack/react-query"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import {
  addConversationToAllowedConsentConversationsQuery,
  removeConversationFromAllowedConsentConversationsQuery,
} from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import {
  addConversationToUnknownConsentConversationsQuery,
  removeConversationFromUnknownConsentConversationsQuery,
} from "@/features/conversation/conversation-requests-list/conversations-unknown-consent.query"
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group"
import {
  getGroupQueryData,
  getOrFetchGroupQuery,
  setGroupQueryData,
} from "@/features/groups/queries/group.query"
import { reactQueryClient } from "@/utils/react-query/react-query.client"
import { updateObjectAndMethods } from "@/utils/update-object-and-methods"
import { IGroup } from "../groups/group.types"
import {
  setXmtpConsentStateForInboxId,
  updateXmtpConsentForGroupsForInbox,
} from "../xmtp/xmtp-consent/xmtp-consent"

type IAllowGroupMutationOptions = {
  clientInboxId: IXmtpInboxId
  xmtpConversationId: IXmtpConversationId
}

type IAllowGroupReturnType = Awaited<ReturnType<typeof allowGroup>>

type IAllowGroupArgs = {
  includeAddedBy?: boolean
  includeCreator?: boolean
  clientInboxId: IXmtpInboxId
  xmtpConversationId: IXmtpConversationId
}

async function allowGroup({
  includeAddedBy,
  includeCreator,
  clientInboxId,
  xmtpConversationId,
}: IAllowGroupArgs) {
  const group = await getOrFetchGroupQuery({
    clientInboxId: getSafeCurrentSender().inboxId,
    xmtpConversationId,
    caller: "allowGroup",
  })

  if (!group) {
    throw new Error("Group not found")
  }

  if (!isConversationGroup(group)) {
    throw new Error("Group is not a valid group")
  }

  const groupCreator = group.creatorInboxId

  const inboxIdsToAllow: IXmtpInboxId[] = []
  if (includeAddedBy && group?.addedByInboxId) {
    inboxIdsToAllow.push(group.addedByInboxId)
  }

  if (includeCreator && groupCreator) {
    inboxIdsToAllow.push(groupCreator)
  }

  await Promise.all([
    updateXmtpConsentForGroupsForInbox({
      clientInboxId,
      groupIds: [xmtpConversationId],
      consent: "allowed",
    }),
    ...(inboxIdsToAllow.length > 0
      ? [
          setXmtpConsentStateForInboxId({
            peerInboxId: clientInboxId,
            consent: "allowed",
          }),
        ]
      : []),
  ])

  return "allowed" as const
}

export const getAllowGroupMutationOptions = (
  args: IAllowGroupMutationOptions,
): MutationOptions<
  IAllowGroupReturnType,
  unknown,
  IAllowGroupArgs,
  { previousGroup: IGroup } | undefined
> => {
  const { xmtpConversationId } = args

  return {
    mutationFn: allowGroup,
    onMutate: async (args) => {
      const { clientInboxId } = args

      const previousGroup = getGroupQueryData({ clientInboxId, xmtpConversationId })

      if (!previousGroup) {
        throw new Error("Previous group not found")
      }

      if (!isConversationGroup(previousGroup)) {
        throw new Error("Previous conversation is not a group")
      }

      const updatedGroup = updateObjectAndMethods(previousGroup, {
        consentState: "allowed",
      })

      setGroupQueryData({ clientInboxId, xmtpConversationId, group: updatedGroup })

      // Remove from requests
      removeConversationFromUnknownConsentConversationsQuery({
        clientInboxId,
        conversationId: xmtpConversationId,
      })

      // Add to main conversations list
      addConversationToAllowedConsentConversationsQuery({
        clientInboxId,
        conversationId: xmtpConversationId,
      })

      return { previousGroup }
    },
    onError: (_, variables, context) => {
      if (!context) {
        return
      }

      const { clientInboxId, xmtpConversationId } = variables

      setGroupQueryData({
        clientInboxId,
        xmtpConversationId,
        group: context.previousGroup,
      })

      // Add back in requests
      addConversationToUnknownConsentConversationsQuery({
        clientInboxId,
        conversationId: xmtpConversationId,
      })

      // Remove from main conversations list
      removeConversationFromAllowedConsentConversationsQuery({
        clientInboxId,
        conversationId: xmtpConversationId,
      })
    },
  }
}

export const createAllowGroupMutationObserver = (args: IAllowGroupMutationOptions) => {
  const allowGroupMutationObserver = new MutationObserver(
    reactQueryClient,
    getAllowGroupMutationOptions(args),
  )
  return allowGroupMutationObserver
}

export const useAllowGroupMutation = (args: IAllowGroupMutationOptions) => {
  return useMutation(getAllowGroupMutationOptions(args))
}
