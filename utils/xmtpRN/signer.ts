import type { Signer as XmtpSigner } from "@xmtp/react-native-sdk";
import type { Signer } from "ethers";
export const convertEthersSignerToXmtpSigner = (signer: Signer): XmtpSigner => {
  return {
    getAddress: signer.getAddress,
    signMessage: signer.signMessage,
    getChainId: () => undefined,
    getBlockNumber: () => undefined,
    walletType: () => "EOA",
  };
};
