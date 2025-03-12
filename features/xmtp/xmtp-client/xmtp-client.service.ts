import { IXmtpInboxId, IXmtpSigner } from "@features/xmtp/xmtp.types"
import { Client, PublicIdentity } from "@xmtp/react-native-sdk"
import { config } from "@/config"
import { useMultiInboxStore } from "@/features/authentication/multi-inbox.store"
import {
  createXmtpClientInstance,
  getDbEncryptionKey,
} from "@/features/xmtp/xmtp-client/xmtp-client"
import { ISupportedXmtpCodecs, supportedXmtpCodecs } from "@/features/xmtp/xmtp-codecs/xmtp-codecs"
import { xmtpIdentityIsEthereumAddress } from "@/features/xmtp/xmtp-identifier/xmtp-identifier"
import { validateClientInstallation } from "@/features/xmtp/xmtp-installations/xmtp-installations"
import { IEthereumAddress } from "@/utils/evm/address"
import { reactQueryClient } from "@/utils/react-query/react-query.client"
import { getXmtpClientQueryOptions, setXmtpClientQueryData } from "./xmtp-client.query"

export async function getXmtpClientByEthAddress(args: { ethAddress: IEthereumAddress }) {
  return reactQueryClient.ensureQueryData(getXmtpClientQueryOptions(args))
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

  const isValid = await validateClientInstallation({
    client,
  })

  setXmtpClientQueryData({
    ethAddress: identity.identifier,
    client,
  })

  if (!isValid) {
    throw new Error("Invalid client installation")
  }

  return client
}

export async function getXmtpClientByInboxId(args: { inboxId: IXmtpInboxId }) {
  const { inboxId } = args

  const sender = useMultiInboxStore.getState().senders.find((s) => s.inboxId === inboxId)

  if (!sender) {
    throw new Error(`No sender found for inboxId: ${inboxId}`)
  }

  return getXmtpClientByEthAddress({ ethAddress: sender.ethereumAddress })
}

async function test() {
  const client = await Client.create<ISupportedXmtpCodecs>(
    {
      getIdentifier: async () =>
        new PublicIdentity("0x3F11b27F323b62B159D2642964fa27C46C841897", "ETHEREUM"),
      getChainId: () => 1,
      getBlockNumber: () => undefined,
      signerType: () => "EOA",
      signMessage: async (message: string) => Promise.resolve("0x"),
    },
    {
      env: config.xmtpEnv,
      dbEncryptionKey: await getDbEncryptionKey(),
      codecs: supportedXmtpCodecs,
    },
  )

  console.log("client:", client)

  // const client = await Client.createRandom({
  //   env: "local",
  //   codecs: supportedXmtpCodecs,
  //   dbEncryptionKey: await getDbEncryptionKey(),
  // })
  // console.log("client:", client)
}

test().catch((error) => {
  console.log("error:", error)
})
