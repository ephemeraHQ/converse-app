import { IXmtpInboxId, IXmtpSigner } from "@features/xmtp/xmtp.types"
import { useMultiInboxStore } from "@/features/authentication/multi-inbox.store"
import { createXmtpClientInstance } from "@/features/xmtp/xmtp-client/xmtp-client"
import { xmtpIdentityIsEthereumAddress } from "@/features/xmtp/xmtp-identifier/xmtp-identifier"
import { IEthereumAddress } from "@/utils/evm/address"
import { reactQueryClient } from "@/utils/react-query/react-query.client"
import { getXmtpClientQueryOptions, setXmtpClientQueryData } from "./xmtp-client.query"

// Temporary mapping of inboxId to ethAddress
const inboxToEthAddressMap = new Map<IXmtpInboxId, IEthereumAddress>()

function registerXmtpClientMapping(args: { inboxId: IXmtpInboxId; ethAddress: IEthereumAddress }) {
  inboxToEthAddressMap.set(args.inboxId, args.ethAddress)
}

export async function getXmtpClientByEthAddress(args: { ethAddress: IEthereumAddress }) {
  const client = await reactQueryClient.ensureQueryData(getXmtpClientQueryOptions(args))

  if (client) {
    registerXmtpClientMapping({
      inboxId: client.inboxId,
      ethAddress: args.ethAddress,
    })
  }

  return client
}

export async function getXmtpClientByInboxId(args: { inboxId: IXmtpInboxId }) {
  const { inboxId } = args

  // First try current store state
  const sender = useMultiInboxStore.getState().senders.find((s) => s.inboxId === inboxId)
  if (sender) {
    return getXmtpClientByEthAddress({ ethAddress: sender.ethereumAddress })
  }

  // Fallback to temporary mapping
  const ethAddress = inboxToEthAddressMap.get(inboxId)
  if (!ethAddress) {
    throw new Error(`No ethereum address found for inboxId: ${inboxId}`)
  }

  return getXmtpClientByEthAddress({ ethAddress })
}

export async function createXmtpClient(args: { inboxSigner: IXmtpSigner }) {
  const { inboxSigner } = args

  const identity = await inboxSigner.getIdentifier()

  if (!xmtpIdentityIsEthereumAddress(identity)) {
    throw new Error("Identifier is not an Ethereum address")
  }

  const client = await createXmtpClientInstance({
    inboxSigner,
  })

  setXmtpClientQueryData({
    ethAddress: identity.identifier,
    client,
  })

  registerXmtpClientMapping({
    inboxId: client.inboxId as IXmtpInboxId,
    ethAddress: identity.identifier,
  })

  return client
}
