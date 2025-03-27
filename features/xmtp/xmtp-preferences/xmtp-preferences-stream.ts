import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { config } from "@/config"
import { getAllowedConsentConversationsQueryData } from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import { XMTPError } from "@/utils/error"
import { xmtpLogger } from "@/utils/logger"
import { getXmtpClientByInboxId } from "../xmtp-client/xmtp-client"

export const streamXmtpConsent = async (args: { inboxId: IXmtpInboxId }) => {
  const { inboxId } = args

  xmtpLogger.debug(`Streaming consent for ${inboxId}`)

  const client = await getXmtpClientByInboxId({
    inboxId,
  })

  try {
    await client.preferences.streamConsent(async () => {
      xmtpLogger.debug(`Consent has been updated for ${inboxId}`)

      const conversations = getAllowedConsentConversationsQueryData({
        clientInboxId: inboxId,
      })

      // TODO: Consent Has Been Updated, resubscribe to notifications
      if (!conversations) {
        return
      }
    })
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: "Failed to stream consent",
    })
  }
}

export const stopStreamingConsent = async (args: { inboxId: IXmtpInboxId }) => {
  const { inboxId } = args

  const client = await getXmtpClientByInboxId({
    inboxId,
  })

  xmtpLogger.debug(`Stopping consent stream for ${inboxId}`)

  try {
    const startTime = Date.now()
    await client.preferences.cancelStreamConsent()
    const duration = Date.now() - startTime

    if (duration > config.xmtp.maxMsUntilLogError) {
      xmtpLogger.warn(`Canceling consent stream took longer than expected`, {
        duration,
        inboxId,
      })
    }

    xmtpLogger.debug(`Stopped consent stream for ${inboxId}`)
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: "Failed to stop consent stream",
    })
  }
}

// export const streamPreferences = async (account: string) => {
//   const client = await getXmtpClientByEthAddress({
//     ethAddress: account,
//   })

//   xmtpLogger.debug(`Streaming preferences for ${client.address}`)

//   try {
//     await client.preferences.streamPreferenceUpdates(async (preference) => {
//       xmtpLogger.debug(`Preference updated for ${client.address}`, {
//         preference,
//       })
//     })
//   } catch (error) {
//     throw new XMTPError({
//       error,
//       additionalMessage: "Failed to stream preferences",
//     })
//   }
// }

// export const stopStreamingPreferences = async (account: string) => {
//   const client = await getXmtpClientByEthAddress({
//     ethAddress: account,
//   })

//   xmtpLogger.debug(`Stopping preferences stream for ${client.address}`)

//   try {
//     const startTime = Date.now()
//     await client.preferences.cancelStreamPreferenceUpdates()
//     const duration = Date.now() - startTime

//     if (duration > config.xmtp.maxMsUntilLogError) {
//       xmtpLogger.warn(`Canceling preferences stream took longer than expected`, {
//         duration,
//         address: client.address,
//       })
//     }

//     xmtpLogger.debug(`Stopped preferences stream for ${client.address}`)
//   } catch (error) {
//     throw new XMTPError({
//       error,
//       additionalMessage: "Failed to stop preferences stream",
//     })
//   }
// }
