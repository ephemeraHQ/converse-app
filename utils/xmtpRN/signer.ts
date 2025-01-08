import { Signer as XmtpSigner } from "@xmtp/react-native-sdk";
import { ethers } from "ethers";
import { ethereum } from "thirdweb/chains";
import { LocalAccount } from "viem/accounts";

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

export const viemAccountToXmtpSigner = (
  account: LocalAccount<any>
): XmtpSigner => ({
  getAddress: () => Promise.resolve(account.address),
  getChainId: () => ethereum.id, // We don't really care about the chain id because we support https://eips.ethereum.org/EIPS/eip-6492
  getBlockNumber: () => undefined,
  walletType: () => "SCW",
  signMessage: (message: string) => account.signMessage({ message }),
});
