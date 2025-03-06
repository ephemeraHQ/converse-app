import { InboxId } from "@xmtp/react-native-sdk"
import { useMultiInboxStore } from "@/features/authentication/multi-inbox.store"
import { createXmtpClientInstance } from "@/features/xmtp/xmtp-client/xmtp-client"
import { validateClientInstallation } from "@/features/xmtp/xmtp-installations/xmtp-installations"
import { IXmtpSigner } from "@/features/xmtp/xmtp.types"
import { enhanceError } from "@/utils/error"
import { reactQueryClient } from "@/utils/react-query/react-query-client"
import { getXmtpClientQueryOptions, setXmtpClientQueryData } from "./xmtp-client.query"

export async function getXmtpClient(args: { ethAddress: string }) {
  return reactQueryClient.ensureQueryData(getXmtpClientQueryOptions(args))
}

export async function createXmtpClient(args: { inboxSigner: IXmtpSigner }) {
  const { inboxSigner } = args

  const ethAddress = await inboxSigner.getAddress()

  const client = await createXmtpClientInstance({
    inboxSigner: args.inboxSigner,
  })

  const isValid = await validateClientInstallation({
    client,
  })

  setXmtpClientQueryData({
    ethAddress,
    client,
  })

  if (!isValid) {
    throw new Error("Invalid client installation")
  }

  return client
}

// Helper function while in lots of places we get the Xmtp client using the ethereum address
export async function getXmtpClientByEthAddress(args: { ethAddress: string }) {
  const { ethAddress } = args

  try {
    return getXmtpClient({
      ethAddress,
    })
  } catch (error) {
    throw enhanceError(error, `Failed to get or create XMTP client for address: ${ethAddress}`)
  }
}

export async function getXmtpClientByInboxId(args: { inboxId: InboxId }) {
  const { inboxId } = args

  const sender = useMultiInboxStore.getState().senders.find((s) => s.inboxId === inboxId)

  if (!sender) {
    throw new Error(`No sender found for inboxId: ${inboxId}`)
  }

  return getXmtpClient({ ethAddress: sender.ethereumAddress })
}
