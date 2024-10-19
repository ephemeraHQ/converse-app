import "@expo/metro-runtime";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { PrivyProvider } from "@privy-io/react-auth";
import { MaterialDarkTheme, MaterialLightTheme } from "@styles/colors";
import { createWeb3Modal, defaultConfig } from "@web3modal/ethers5/react";
import { useColorScheme } from "react-native";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "./assets/web.css";
import "./polyfills";

import { XmtpCron } from "./components/XmtpEngine";
import config from "./config";
import Main from "./screens/Main";

const mainnet = {
  chainId: 1,
  name: "Ethereum",
  currency: "ETH",
  explorerUrl: "https://etherscan.io",
  rpcUrl: config.evm.rpcEndpoint,
};

createWeb3Modal({
  ethersConfig: defaultConfig({
    metadata: config.walletConnectConfig.appMetadata,
  }),
  chains: [mainnet],
  projectId: config.walletConnectConfig.projectId,
});

export default function App() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider key={`app-${colorScheme}`}>
      <ActionSheetProvider>
        <PaperProvider
          theme={
            colorScheme === "dark" ? MaterialDarkTheme : MaterialLightTheme
          }
        >
          <PrivyProvider
            appId={config.privy.appId}
            config={{
              loginMethods: ["sms"],
              embeddedWallets: {
                createOnLogin: "users-without-wallets",
                noPromptOnSignature: true,
              },
              defaultChain: config.privy.defaultChain,
              supportedChains: [config.privy.defaultChain],
              appearance: {
                theme: colorScheme || "light",
                logo: "https://converse.xyz/icon.png",
              },
            }}
          >
            <>
              <Main />
              <XmtpCron />
            </>
          </PrivyProvider>
        </PaperProvider>
      </ActionSheetProvider>
    </SafeAreaProvider>
  );
}
