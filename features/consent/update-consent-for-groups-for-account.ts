import { logger } from "@/utils/logger"
import { getXmtpClientByEthAddress } from "../xmtp/xmtp-client/xmtp-client.service"

type UpdateConsentForGroupsForAccountArgs = {
  account: string
  groupIds: string[]
  consent: "allow" | "deny"
}

export const updateConsentForGroupsForAccount = async (
  args: UpdateConsentForGroupsForAccountArgs,
) => {
  const { account, groupIds, consent } = args

  const client = await getXmtpClientByEthAddress({
    ethAddress: account,
  })

  if (!client) {
    throw new Error("Client not found")
  }

  logger.debug(`[XMTPRN Contacts] Consenting to groups on protocol: ${groupIds.join(", ")}`)
  const start = new Date().getTime()

  const state = consent === "allow" ? "allowed" : "denied"

  for (const groupId of groupIds) {
    await client.preferences.setConsentState({
      value: groupId,
      entryType: "conversation_id",
      state,
    })
  }

  const end = new Date().getTime()
  logger.debug(`[XMTPRN Contacts] Consented to groups on protocol in ${(end - start) / 1000} sec`)
}
