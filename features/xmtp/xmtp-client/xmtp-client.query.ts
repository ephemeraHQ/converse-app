import { queryOptions } from "@tanstack/react-query"
import { IXmtpClient } from "@/features/xmtp/xmtp.types"
import { IEthereumAddress } from "@/utils/evm/address"
import { reactQueryClient } from "@/utils/react-query/react-query.client"
import { validateClientInstallation } from "../xmtp-installations/xmtp-installations"
import { buildXmtpClientInstance } from "./xmtp-client"

// Query key now uses ethAddress instead of inboxId
const xmtpClientQueryKey = (args: { ethAddress: IEthereumAddress }) => [
  "xmtp-client",
  args.ethAddress,
]

export const getXmtpClientQueryOptions = (args: { ethAddress: IEthereumAddress }) => {
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

export function setXmtpClientQueryData(args: {
  ethAddress: IEthereumAddress
  client: IXmtpClient
}) {
  return reactQueryClient.setQueryData(xmtpClientQueryKey(args), args.client)
}
