/**
 * TODO: Maybe delete this and just use the conversation query instead and add a "peer" argument?
 */
import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { queryOptions } from "@tanstack/react-query"
import { getXmtpDmByInboxId } from "@/features/xmtp/xmtp-conversations/xmtp-conversations-dm"
import { reactQueryClient } from "@/utils/react-query/react-query.client"
import { setConversationQueryData } from "../conversation/queries/conversation.query"

type IDmQueryArgs = {
  ethAccountAddress: string
  inboxId: IXmtpInboxId
}

type IDmQueryData = Awaited<ReturnType<typeof getXmtpDmByInboxId>>

async function getDm(args: IDmQueryArgs) {
  const { ethAccountAddress: ethAccountAddress, inboxId } = args

  const conversation = await getXmtpDmByInboxId({
    clientInboxId: ethAccountAddress,
    inboxId,
  })

  if (conversation) {
    // Update the main conversation query because it's a 1-1
    setConversationQueryData({
      inboxId: ethAccountAddress,
      topic: conversation.topic,
      conversation,
    })
  }

  return conversation
}

export function getDmQueryOptions(args: IDmQueryArgs) {
  const { ethAccountAddress, inboxId } = args
  return queryOptions({
    queryKey: ["dm", ethAccountAddress, inboxId],
    queryFn: () => getDm({ ethAccountAddress: ethAccountAddress, inboxId }),
    enabled: !!inboxId,
  })
}

export function setDmQueryData(args: IDmQueryArgs & { dm: IDmQueryData }) {
  const { ethAccountAddress, inboxId, dm } = args
  reactQueryClient.setQueryData(getDmQueryOptions({ ethAccountAddress, inboxId }).queryKey, dm)

  // Update the main conversation query because it's a 1-1
  if (dm) {
    setConversationQueryData({
      inboxId: ethAccountAddress,
      topic: dm.topic,
      conversation: dm,
    })
  }
}

export function getDmQueryData(args: IDmQueryArgs) {
  return reactQueryClient.getQueryData(getDmQueryOptions(args).queryKey)
}
