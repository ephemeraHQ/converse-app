import { InboxId } from "@xmtp/react-native-sdk"
import { useMultiInboxStore } from "@/features/authentication/multi-inbox.store"
import { createXmtpClientInstance } from "@/features/xmtp/xmtp-client/xmtp-client"
import { validateClientInstallation } from "@/features/xmtp/xmtp-installations/xmtp-installations"
import { IXmtpSigner } from "@/features/xmtp/xmtp.types"
import { reactQueryClient } from "@/utils/react-query/react-query.client"
import { getXmtpClientQueryOptions, setXmtpClientQueryData } from "./xmtp-client.query"

export async function getXmtpClientByEthAddress(args: { ethAddress: string }) {
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

export async function getXmtpClientByInboxId(args: { inboxId: InboxId }) {
  const { inboxId } = args

  const sender = useMultiInboxStore.getState().senders.find((s) => s.inboxId === inboxId)

  if (!sender) {
    throw new Error(`No sender found for inboxId: ${inboxId}`)
  }

  return getXmtpClientByEthAddress({ ethAddress: sender.ethereumAddress })
}
