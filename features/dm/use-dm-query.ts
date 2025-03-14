/**
 * TODO: Maybe delete this and just use the conversation query instead and add a "peer" argument?
 */
import { queryOptions } from "@tanstack/react-query"
import { convertXmtpConversationToConvosConversation } from "@/features/conversation/utils/convert-xmtp-conversation-to-convos"
import { getXmtpDmByInboxId } from "@/features/xmtp/xmtp-conversations/xmtp-conversations-dm"
import { reactQueryClient } from "@/utils/react-query/react-query.client"
import { setConversationQueryData } from "../conversation/queries/conversation.query"
import { IXmtpInboxId } from "../xmtp/xmtp.types"

type IDmQueryArgs = {
  targetInboxId: IXmtpInboxId
  clientInboxId: IXmtpInboxId
}

type IDmQueryData = Awaited<ReturnType<typeof getDm>>

async function getDm(args: IDmQueryArgs) {
  const { targetInboxId: ethAccountAddress, clientInboxId: inboxId } = args

  const xmtpConv = await getXmtpDmByInboxId({
    clientInboxId: ethAccountAddress,
    inboxId,
  })

  if (!xmtpConv) {
    return null
  }

  const convosConv = await convertXmtpConversationToConvosConversation(xmtpConv)

  if (convosConv) {
    // Update the main conversation query because it's a 1-1
    setConversationQueryData({
      inboxId: ethAccountAddress,
      topic: convosConv.topic,
      conversation: convosConv,
    })
  }

  return convosConv
}

export function getDmQueryOptions(args: IDmQueryArgs) {
  const { targetInboxId: ethAccountAddress, clientInboxId: inboxId } = args
  return queryOptions({
    queryKey: ["dm", ethAccountAddress, inboxId],
    queryFn: () => getDm({ targetInboxId: ethAccountAddress, clientInboxId: inboxId }),
    enabled: !!inboxId,
  })
}

export function setDmQueryData(args: IDmQueryArgs & { dm: IDmQueryData }) {
  const { targetInboxId: ethAccountAddress, clientInboxId: inboxId, dm } = args
  reactQueryClient.setQueryData(
    getDmQueryOptions({ targetInboxId: ethAccountAddress, clientInboxId: inboxId }).queryKey,
    dm,
  )

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
