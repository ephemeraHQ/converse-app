import { Snackbars } from "@components/Snackbar/Snackbars";
import { BottomSheetModalProvider } from "@design-system/BottomSheet/BottomSheetModalProvider";
import { useReactQueryDevTools } from "@dev-plugins/react-query";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { SmartWalletsProvider } from "@privy-io/expo/smart-wallets";
import { queryClient } from "@queries/queryClient";
import { MaterialDarkTheme, MaterialLightTheme } from "@styles/colors";
import { focusManager, QueryClientProvider } from "@tanstack/react-query";
import { useThemeProvider } from "@theme/useAppTheme";
import { setupAppAttest } from "@utils/appCheck";
import { useCoinbaseWalletListener } from "@utils/coinbaseWallet";
import { converseEventEmitter } from "@utils/events";
import "expo-dev-client";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { Provider as PaperProvider } from "react-native-paper";
import { config } from "@/config";
import { useColorScheme } from "react-native";
import { useInitializeMultiInboxClient } from "./features/multi-inbox/multi-inbox.client";
import { PrivyProvider } from "@privy-io/expo";
import { ThirdwebProvider } from "thirdweb/react";
import { AuthenticateWithPasskeyProvider } from "./features/onboarding/contexts/signup-with-passkey.context";
import { PrivyPlaygroundLandingScreen } from "./features/privy-playground/privy-playground-landing.screen";
import { DevToolsBubble } from "react-native-react-query-devtools";
import * as Clipboard from "expo-clipboard";
import { logger } from "@/utils/logger";
import { PrivyPlaygroundLoginScreen } from "./features/privy-playground/privy-login-screen";
export function SlimApp() {
  const colorScheme = useColorScheme();

  const paperTheme = useMemo(() => {
    return colorScheme === "dark" ? MaterialDarkTheme : MaterialLightTheme;
  }, [colorScheme]);

  useInitializeMultiInboxClient();
  useReactQueryDevTools(queryClient);

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

  logger.debug(JSON.stringify(config, null, 2));
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
                <PaperProvider theme={paperTheme}>
                  <GestureHandlerRootView style={{ flex: 1 }}>
                    <BottomSheetModalProvider>
                      <AuthenticateWithPasskeyProvider>
                        <PrivyPlaygroundLoginScreen />
                      </AuthenticateWithPasskeyProvider>
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
