import { IXmtpSigner } from "../xmtp.types";

export function getXmtpSigner(args: {
  ethAddress: string;
  type: "EOA" | "SCW";
  chainId: number;
  signMessage: (message: string) => Promise<string>;
}): IXmtpSigner {
  return {
    getAddress: async () => args.ethAddress,
    getChainId: () => args.chainId,
    getBlockNumber: () => undefined,
    walletType: () => args.type,
    signMessage: async (message: string) => {
      return args.signMessage(message);
    },
  };
}
