import { base } from "thirdweb/chains"
import {
  BASENAME_RESOLVER_ADDRESS,
  resolveAddress as resolveEnsAddress,
} from "thirdweb/extensions/ens"
import { resolveAddress as resolveUdAddress } from "thirdweb/extensions/unstoppable-domains"
import { thirdwebClient } from "@/utils/thirdweb"

export const identityResolutionApi = {
  resolveEnsName: async (args: { name: string }) => {
    return resolveEnsAddress({
      client: thirdwebClient,
      name: args.name,
    })
  },

  resolveBaseName: async (args: { name: string }) => {
    return resolveEnsAddress({
      client: thirdwebClient,
      name: args.name,
      resolverAddress: BASENAME_RESOLVER_ADDRESS,
      resolverChain: base,
    })
  },

  resolveUnstoppableDomainName: async (args: { name: string }) => {
    return resolveUdAddress({
      client: thirdwebClient,
      name: args.name,
    })
  },
}
