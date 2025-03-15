/**
 * TODO: Maybe delete this and just use the conversation query instead and add a "peer" argument?
 */
import { queryOptions } from "@tanstack/react-query"
import { IConversationTopic } from "@/features/conversation/conversation.types"
import { isConversationDm } from "@/features/conversation/utils/is-conversation-dm"
import { IDm } from "@/features/dm/dm.types"
import { reactQueryClient } from "@/utils/react-query/react-query.client"
import { getConversationQueryOptions } from "../conversation/queries/conversation.query"
import { IXmtpInboxId } from "../xmtp/xmtp.types"

type IDmQueryArgs = {
  // targetInboxId: IXmtpInboxId
  clientInboxId: IXmtpInboxId
  topic: IConversationTopic
}

// type IDmQueryData = Awaited<ReturnType<typeof getDm>>

// async function getDm(args: IDmQueryArgs) {
//   const { targetInboxId: ethAccountAddress, clientInboxId: inboxId } = args

//   const xmtpDm = await getXmtpDmByInboxId({
//     clientInboxId: ethAccountAddress,
//     inboxId,
//   })

//   if (!xmtpDm) {
//     return null
//   }

//   const convosConv = await convertXmtpConversationToConvosConversation(xmtpDm)

//   if (convosConv) {
//     // Update the main conversation query because it's a 1-1
//     setConversationQueryData({
//       clientInboxId: ethAccountAddress,
//       topic: convosConv.topic,
//       conversation: convosConv,
//     })
//   }

//   return convosConv as IDm
// }

export function getDmQueryOptions(args: IDmQueryArgs) {
  const { clientInboxId, topic } = args
  return queryOptions({
    // queryKey: ["dm", ethAccountAddress, inboxId],
    // queryFn: () => getDm({ targetInboxId: ethAccountAddress, clientInboxId: inboxId }),
    // enabled: !!inboxId,
    ...getConversationQueryOptions({
      clientInboxId,
      topic,
      caller: "getDmQueryOptions",
    }),
    select: (data) => {
      if (!data) {
        return null
      }
      if (!isConversationDm(data)) {
        throw new Error("Expected dm conversation but received different type")
      }
      return data as IDm
    },
  })
}

export function setDmQueryData(args: IDmQueryArgs & { dm: IDm }) {
  const { clientInboxId, topic, dm } = args
  return reactQueryClient.setQueryData(getDmQueryOptions({ clientInboxId, topic }).queryKey, dm)
}

export function getDmQueryData(args: IDmQueryArgs) {
  return reactQueryClient.getQueryData(getDmQueryOptions(args).queryKey) as IDm | null
}
