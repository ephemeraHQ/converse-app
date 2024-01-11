import "@expo/metro-runtime";
import "./polyfills";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { createWeb3Modal, defaultConfig } from "@web3modal/ethers5/react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import XmtpEngine from "./components/XmtpEngine";
import config from "./config";
import Main from "./screens/Main";

const mainnet = {
  chainId: 1,
  name: "Ethereum",
  currency: "ETH",
  explorerUrl: "https://etherscan.io",
  rpcUrl: "https://cloudflare-eth.com",
};

createWeb3Modal({
  ethersConfig: defaultConfig({
    metadata: config.walletConnectConfig.dappMetadata,
  }),
  chains: [mainnet],
  projectId: config.walletConnectConfig.projectId,
});

export default function App() {
  return (
    <SafeAreaProvider>
      <ActionSheetProvider>
        <>
          <Main />
          <XmtpEngine />
        </>
      </ActionSheetProvider>
    </SafeAreaProvider>
  );
}
