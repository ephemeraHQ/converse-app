import { logger } from "@/utils/logger"
import { getXmtpClientByEthAddress } from "../xmtp-client/xmtp-client.service"

export type UpdateConsentForAddressesForAccountParams = {
  account: string
  addresses: string[]
  consent: "allow" | "deny"
}

export const updateConsentForAddressesForAccount = async ({
  account,
  addresses,
  consent,
}: UpdateConsentForAddressesForAccountParams) => {
  const client = await getXmtpClientByEthAddress({
    ethAddress: account,
  })

  if (!client) {
    throw new Error("Client not found")
  }

  logger.debug(`[XMTPRN Contacts] Consenting to addresses on protocol: ${addresses.join(", ")}`)
  const start = new Date().getTime()

  if (consent === "allow") {
    for (const address of addresses) {
      await client.preferences.setConsentState({
        value: address,
        entryType: "address",
        state: "allowed",
      })
    }
  } else if (consent === "deny") {
    for (const address of addresses) {
      await client.preferences.setConsentState({
        value: address,
        entryType: "address",
        state: "denied",
      })
    }
  } else {
    throw new Error(`Invalid consent type: ${consent}`)
  }

  const end = new Date().getTime()
  logger.debug(
    `[XMTPRN Contacts] Consented to addresses on protocol in ${(end - start) / 1000} sec`,
  )
}
