import { queryOptions } from "@tanstack/react-query"
import { getXmtpClientByInboxId } from "@/features/xmtp/xmtp-client/xmtp-client"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { reactQueryClient } from "@/utils/react-query/react-query.client"

type IArgs = {
  inboxId: IXmtpInboxId
}

export const getXmtpInstallationQueryOptions = (args: IArgs) => {
  const { inboxId } = args

  return queryOptions({
    enabled: !!inboxId,
    queryKey: ["xmtp-installation", inboxId],
    queryFn: async () => {
      const client = await getXmtpClientByInboxId({
        inboxId,
      })

      return client.installationId
    },
  })
}

export function getXmtpInstallationQueryData(args: IArgs) {
  return reactQueryClient.getQueryData(getXmtpInstallationQueryOptions(args).queryKey)
}

export function ensureXmtpInstallationQueryData(args: IArgs) {
  return reactQueryClient.ensureQueryData(getXmtpInstallationQueryOptions(args))
}
