import { queryOptions } from "@tanstack/react-query"
import { IXmtpClient } from "@/features/xmtp/xmtp.types"
import { queryClient } from "@/queries/queryClient"
import { validateClientInstallation } from "../xmtp-installations/xmtp-installations"
import { buildXmtpClientInstance } from "./xmtp-client"

// Query key now uses ethAddress instead of inboxId
const xmtpClientQueryKey = (args: { ethAddress: string }) => ["xmtp-client", args.ethAddress]

export const getXmtpClientQueryOptions = (args: { ethAddress: string }) => {
  return queryOptions({
    queryKey: xmtpClientQueryKey(args),
    queryFn: async () => {
      const client = await buildXmtpClientInstance({
        ethereumAddress: args.ethAddress,
      })

      const isValid = await validateClientInstallation({
        client,
      })

      if (!isValid) {
        throw new Error("Invalid client installation")
      }

      return client
    },
    enabled: !!args.ethAddress,
  })
}

export function setXmtpClientQueryData(args: { ethAddress: string; client: IXmtpClient }) {
  return queryClient.setQueryData(xmtpClientQueryKey(args), args.client)
}
