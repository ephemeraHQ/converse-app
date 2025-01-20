import { IXmtpEnv } from "@/utils/xmtpRN/xmtp.types";

type IWalletConnectConfig = {
  projectId: string | undefined;
  appMetadata: {
    name: string;
    description: string;
    url: string;
    logoUrl: string;
    icons: string[];
  };
  optionalChains: number[];
};

type IEvm = "mainnet" | "sepolia";

type IEvmConfig = {
  rpcEndpoint: string | undefined;
} & {
  [key in IEvm]?: {
    transactionChainId: string;
    USDC: {
      contractAddress: string;
      name: string;
      version: string;
      decimals: number;
    };
  };
};

type IPrivyConfig = {
  appId: string | undefined;
  defaultChain: any; // Using 'any' here since the chain type comes from external lib
};

export type IConfig = {
  debugMenu: boolean;
  debugAddresses: string[];
  lensApiDomain: string;
  lensSuffix: string;
  sentryDSN: string | undefined;
  framesAllowedSchemes: ("http" | "https" | "ethereum")[];
  walletConnectConfig: IWalletConnectConfig;
  thirdwebClientId: string | undefined;
  env: string;
  xmtpEnv: IXmtpEnv;
  apiURI: string;
  bundleId: string;
  appleAppGroup: string;
  scheme: string;
  websiteDomain: string;
  usernameSuffix: string;
  universalLinks: string[];
  privy: IPrivyConfig;
  evm: IEvmConfig;
  appCheckDebugToken?: string | undefined;
  alphaGroupChatUrl?: string;
};
