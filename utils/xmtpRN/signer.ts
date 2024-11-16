import type { Signer as XmtpSigner } from "@xmtp/react-native-sdk";
import type { Signer } from "ethers";
import { ethereum } from "thirdweb/chains";

export const convertEthersSignerToXmtpSigner = (
  signer: Signer,
  isSCW: boolean = false
): XmtpSigner => {
  return {
    getAddress: () => signer.getAddress(),
    signMessage: (message: string) => signer.signMessage(message),
    getChainId: () => ethereum.id,
    getBlockNumber: () => undefined,
    walletType: () => (isSCW ? "SCW" : "EOA"),
  };
};
