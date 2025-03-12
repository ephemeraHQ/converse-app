import { queryOptions } from "@tanstack/react-query"
import { IXmtpClient } from "@/features/xmtp/xmtp.types"
import { IEthereumAddress } from "@/utils/evm/address"
import { reactQueryClient } from "@/utils/react-query/react-query.client"
import { buildXmtpClientInstance } from "./xmtp-client"

// Query key now uses ethAddress instead of inboxId
export const getXmtpClientQueryOptions = (args: { ethAddress: IEthereumAddress }) => {
  const { ethAddress } = args

  return queryOptions({
    enabled: !!ethAddress,
    queryKey: ["xmtp-client", ethAddress],
    queryFn: async () => {
      const client = await buildXmtpClientInstance({
        ethereumAddress: ethAddress,
      })

      return client
    },
  })
}

export function setXmtpClientQueryData(args: {
  ethAddress: IEthereumAddress
  client: IXmtpClient
}) {
  return reactQueryClient.setQueryData(
    getXmtpClientQueryOptions({ ethAddress: args.ethAddress }).queryKey,
    args.client,
  )
}
