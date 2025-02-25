import { queryOptions, useQuery } from "@tanstack/react-query";
import { getInboxIdFromEthAddress } from "@/features/xmtp/xmtp-inbox-id/xmtp-inbox-id-from-eth-address";
import { IEthereumAddress } from "@/utils/evm/address";

export function getXmtpInboxIdFromEthAddressQueryOptions(args: {
  clientEthAddress: IEthereumAddress;
  targetEthAddress: IEthereumAddress;
}) {
  const { clientEthAddress, targetEthAddress } = args;

  return queryOptions({
    queryKey: [
      "xmtp-inbox-id-from-eth-address",
      clientEthAddress,
      targetEthAddress,
    ],
    queryFn: () =>
      getInboxIdFromEthAddress({ clientEthAddress, targetEthAddress }),
  });
}

export function useXmtpInboxIdFromEthAddressQuery(args: {
  clientEthAddress: IEthereumAddress;
  targetEthAddress: IEthereumAddress;
}) {
  return useQuery(getXmtpInboxIdFromEthAddressQueryOptions(args));
}
