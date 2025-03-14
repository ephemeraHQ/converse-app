import { IXmtpClientWithCodecs } from "@/features/xmtp/xmtp.types"

export const getOtherInstallations = async (args: { client: IXmtpClientWithCodecs }) => {
  const { client } = args

  const inboxState = await client.inboxState(true)
  const installationIds = inboxState.installations.map((i) => i.id)

  const otherInstallations = installationIds.filter((id) => id !== client.installationId)

  return otherInstallations
}

export async function validateClientInstallation(args: { client: IXmtpClientWithCodecs }) {
  const { client } = args
  const inboxState = await client.inboxState(true)
  const installationsIds = inboxState.installations.map((i) => i.id)
  return installationsIds.includes(client.installationId)
}
