import { Signer as XmtpSigner } from "@xmtp/react-native-sdk";
import { ethers } from "ethers";
import { ethereum } from "thirdweb/chains";
import logger from "../logger";

export const ethersSignerToXmtpSigner = (
  signer: ethers.Signer,
  isSCW?: boolean
): XmtpSigner => ({
  getAddress: () => signer.getAddress(),
  getChainId: () => ethereum.id, // We don't really care about the chain id because we support https://eips.ethereum.org/EIPS/eip-6492
  getBlockNumber: () => undefined,
  walletType: () => (isSCW ? "SCW" : "EOA"),
  signMessage: (message: string) => signer.signMessage(message),
});

export type ViemAccount = {
  address: string;
  chainId: number;
  signMessage: ({ message }: { message: string }) => Promise<string>;
};

export const viemAccountToXmtpSigner = (account: ViemAccount): XmtpSigner => ({
  getAddress: () => Promise.resolve(account.address),
  getChainId: () => account.chainId,
  getBlockNumber: () => undefined,
  walletType: () => "SCW",
  signMessage: async (message: string) => {
    try {
      logger.debug("Signing message", message);
      const signature = await account.signMessage({ message });
      return signature;
    } catch (error) {
      logger.error("Error signing message", error);
      throw error;
    }
  },
});
