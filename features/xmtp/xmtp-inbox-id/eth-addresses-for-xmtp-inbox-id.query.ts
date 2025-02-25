/**
 * Maybe need to move this file somewhere else? Not sure which specific feature it belongs to.
 */
import { queryOptions, useQuery } from "@tanstack/react-query";
import { InboxId } from "@xmtp/react-native-sdk";
import { create, windowScheduler } from "@yornaath/batshit";
import { XMTPError } from "@/utils/error";
import { IEthereumAddress } from "@/utils/evm/address";
import { getEthAddressesFromInboxIds } from "./eth-addresses-from-xmtp-inbox-id";

type IArgs = {
  clientEthAddress: string;
  inboxId: InboxId;
};

export function getEthAddressesForXmtpInboxIdQueryOptions(args: IArgs) {
  const { clientEthAddress, inboxId } = args;

  return queryOptions({
    enabled: !!clientEthAddress && !!inboxId,
    queryKey: ["eth-addresses-for-xmtp-inbox-id", clientEthAddress, inboxId],
    queryFn: () => {
      return batchedGetEthAddressesForXmtpInboxId.fetch({
        clientEthAddress,
        inboxId,
      });
    },
  });
}

export function useEthAddressesForXmtpInboxId(args: IArgs) {
  const { clientEthAddress, inboxId } = args;

  return useQuery(
    getEthAddressesForXmtpInboxIdQueryOptions({
      clientEthAddress,
      inboxId,
    }),
  );
}

type BatchArgs = IArgs;

// Batch multiple requests together
const batchedGetEthAddressesForXmtpInboxId = create({
  scheduler: windowScheduler(50),
  resolver: (items, query: BatchArgs) => {
    return (
      items.find(
        (item) =>
          item.clientEthAddress === query.clientEthAddress &&
          item.inboxId === query.inboxId,
      )?.addresses ?? null
    );
  },
  fetcher: async (args: BatchArgs[]) => {
    try {
      // Group requests by clientEthAddress
      const groupedByClient = args.reduce(
        (acc, arg) => {
          if (!acc[arg.clientEthAddress]) {
            acc[arg.clientEthAddress] = [];
          }
          acc[arg.clientEthAddress].push(arg.inboxId);
          return acc;
        },
        {} as Record<string, InboxId[]>,
      );

      // Fetch addresses for each client in parallel
      const results = await Promise.all(
        Object.entries(groupedByClient).map(
          async ([clientEthAddress, inboxIds]) => {
            const addresses = await getEthAddressesFromInboxIds({
              clientEthAddress,
              inboxIds,
            });

            // Map results back to individual requests for this client
            return args
              .filter((arg) => arg.clientEthAddress === clientEthAddress)
              .map((arg) => ({
                clientEthAddress: arg.clientEthAddress,
                inboxId: arg.inboxId,
                addresses: addresses,
              }));
          },
        ),
      );

      return results.flat();
    } catch (error) {
      throw new XMTPError({
        error,
        additionalMessage: "Failed to fetch XMTP addresses for inbox IDs",
      });
    }
  },
});
