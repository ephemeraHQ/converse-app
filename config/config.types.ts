// import { IXmtpEnv } from "@/utils/xmtpRN/xmtp.types";

import type { IXmtpEnv } from "@/utils/xmtpRN/xmtp.types";

type IWalletConnectConfig = {
  projectId: string | undefined;
  appMetadata: {
    name: string;
    description: string;
    url: string;
    logoUrl: string;
    icons: string[];
  };
};

type IEvmConfig = {
  rpcEndpoint: string;
  transactionChainId: string;
  USDC: {
    contractAddress: string;
    name: string;
    version: string;
    decimals: number;
  };
};

type IPrivyConfig = {
  appId: string;
  clientId: string;
};

export type ILoggerColorScheme = "light" | "dark";

export type IConfig = {
  loggerColorScheme: ILoggerColorScheme;
  debugMenu: boolean;
  debugAddresses: string[];
  lensApiDomain: string;
  lensSuffix: string;
  sentryDSN: string;
  framesAllowedSchemes: ("http" | "https" | "ethereum")[];
  walletConnectConfig: IWalletConnectConfig;
  thirdwebClientId: string;
  xmtpEnv: IXmtpEnv;
  apiURI: string;
  bundleId: string;
  scheme: string;
  websiteDomain: string;
  usernameSuffix: string;
  universalLinks: string[];
  privy: IPrivyConfig;
  evm: IEvmConfig;
  appCheckDebugToken?: string;
  reactQueryEncryptionKey: string;
};
