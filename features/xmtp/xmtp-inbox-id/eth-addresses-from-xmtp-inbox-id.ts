import { InboxId } from "@xmtp/react-native-sdk";
import { IEthereumAddress } from "@/utils/evm/address";
import { getXmtpClientByEthAddress } from "../xmtp-client/xmtp-client.service";

export async function getEthAddressesFromInboxIds(args: {
  clientEthAddress: IEthereumAddress;
  inboxIds: InboxId[];
}) {
  const { clientEthAddress: clientEthAddress, inboxIds } = args;

  const client = await getXmtpClientByEthAddress({
    ethereumAddress: clientEthAddress,
  });

  const inboxStates = await client.inboxStates(true, inboxIds);

  return inboxStates.map((inboxState) => inboxState.addresses).flat();
}
