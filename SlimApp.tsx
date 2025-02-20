import { Snackbars } from "@/components/snackbar/snackbars";
import { config } from "@/config";
import { BottomSheetModalProvider } from "@design-system/BottomSheet/BottomSheetModalProvider";
import { useReactQueryDevTools } from "@dev-plugins/react-query";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { PrivyProvider } from "@privy-io/expo";
import { SmartWalletsProvider } from "@privy-io/expo/smart-wallets";
import { queryClient } from "@queries/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { useThemeProvider } from "@theme/useAppTheme";
import { setupAppAttest } from "@utils/appCheck";
import * as Clipboard from "expo-clipboard";
import "expo-dev-client";
import React, { useEffect } from "react";
import { SafeAreaView } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider as PaperProvider } from "react-native-paper";
import { DevToolsBubble } from "react-native-react-query-devtools";
import { ThirdwebProvider } from "thirdweb/react";
import { useMonitorNetworkConnectivity } from "./dependencies/NetworkMonitor/use-monitor-network-connectivity";
import { useInitializeMultiInboxClient } from "./features/multi-inbox/multi-inbox.client";
import { PrivyPlaygroundLandingScreen } from "./features/privy-playground/privy-playground-landing.screen";

export function SlimApp() {
  useInitializeMultiInboxClient();
  useReactQueryDevTools(queryClient);
  useMonitorNetworkConnectivity();
  useEffect(() => {
    setupAppAttest();
  }, []);

  const { themeScheme, setThemeContextOverride, ThemeProvider } =
    useThemeProvider();

  const onCopy = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider
        appId={config.privy.appId}
        clientId={config.privy.clientId}
      >
        <SmartWalletsProvider>
          <ThirdwebProvider>
            <ActionSheetProvider>
              <ThemeProvider value={{ themeScheme, setThemeContextOverride }}>
                <PaperProvider>
                  <GestureHandlerRootView style={{ flex: 1 }}>
                    <BottomSheetModalProvider>
                      <SafeAreaView style={{ flex: 1 }}>
                        <PrivyPlaygroundLandingScreen />
                      </SafeAreaView>
                      {__DEV__ && <DevToolsBubble onCopy={onCopy} />}
                      <Snackbars />
                    </BottomSheetModalProvider>
                  </GestureHandlerRootView>
                </PaperProvider>
              </ThemeProvider>
            </ActionSheetProvider>
          </ThirdwebProvider>
        </SmartWalletsProvider>
      </PrivyProvider>
    </QueryClientProvider>
  );
}
