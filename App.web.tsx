import "@expo/metro-runtime";
import "./polyfills";
import "./assets/web.css";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { PrivyProvider } from "@privy-io/react-auth";
import { createWeb3Modal, defaultConfig } from "@web3modal/ethers5/react";
import { useColorScheme } from "react-native";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import XmtpEngine from "./components/XmtpEngine";
import config from "./config";
import Main from "./screens/Main";
import { MaterialDarkTheme, MaterialLightTheme } from "./utils/colors";
import mmkv from "./utils/mmkv";
import { DEFAULT_EMOJIS, RECENT_EMOJI_STORAGE_KEY } from "./utils/reactions";
import { useRecentPicksPersistence } from "./vendor/rn-emoji-keyboard";

const mainnet = {
  chainId: 1,
  name: "Ethereum",
  currency: "ETH",
  explorerUrl: "https://etherscan.io",
  rpcUrl: config.evm.rpcEndpoint,
};

createWeb3Modal({
  ethersConfig: defaultConfig({
    metadata: config.walletConnectConfig.dappMetadata,
  }),
  chains: [mainnet],
  projectId: config.walletConnectConfig.projectId,
});

export default function App() {
  const colorScheme = useColorScheme();
  useRecentPicksPersistence({
    initialization: () =>
      JSON.parse(mmkv.getString(RECENT_EMOJI_STORAGE_KEY) || DEFAULT_EMOJIS),
    onStateChange: (next) => {
      mmkv.set(RECENT_EMOJI_STORAGE_KEY, JSON.stringify(next));
    },
  });
  return (
    <SafeAreaProvider key={`app-${colorScheme}`}>
      <ActionSheetProvider>
        <PaperProvider
          theme={
            colorScheme === "light" ? MaterialLightTheme : MaterialDarkTheme
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
              <XmtpEngine />
            </>
          </PrivyProvider>
        </PaperProvider>
      </ActionSheetProvider>
    </SafeAreaProvider>
  );
}
