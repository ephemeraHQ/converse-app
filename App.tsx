import "expo-dev-client";
import "./polyfills";

import { configure as configureCoinbase } from "@coinbase/wallet-mobile-sdk";
import DebugButton from "@components/DebugButton";
import { BottomSheetModalProvider } from "@design-system/BottomSheet/BottomSheetModalProvider";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { useAppStateHandlers } from "@hooks/useAppStateHandlers";
import { PrivyProvider } from "@privy-io/expo";
import { queryClient } from "@queries/queryClient";
import { MaterialDarkTheme, MaterialLightTheme } from "@styles/colors";
import { QueryClientProvider } from "@tanstack/react-query";
import { useAppTheme, useThemeProvider } from "@theme/useAppTheme";
import { useCoinbaseWalletListener } from "@utils/coinbaseWallet";
import { converseEventEmitter } from "@utils/events";
import logger from "@utils/logger";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  LogBox,
  Platform,
  StyleSheet,
  View,
  useColorScheme,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { Provider as PaperProvider } from "react-native-paper";
import { ThirdwebProvider } from "thirdweb/react";

import { Snackbars } from "@components/Snackbar/Snackbars";
import { xmtpEngine } from "./components/XmtpEngine";
import config from "./config";
import {
  TEMPORARY_ACCOUNT_NAME,
  useAccountsStore,
} from "./data/store/accountsStore";
import { setAuthStatus } from "./data/store/authStore";
import Main from "./screens/Main";
import { registerBackgroundFetchTask } from "./utils/background";
import { privySecureStorage } from "./utils/keychain/helpers";
import { initSentry } from "./utils/sentry";
import "./utils/splash/splash";
import "./features/notifications/utils";
import { setupAppAttest } from "@utils/appCheck";
import { saveApiURI } from "./utils/sharedData";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { MMKV } from "react-native-mmkv";
import { v } from "@privy-io/expo/dist/EmbeddedWalletState-d3db6772";

LogBox.ignoreLogs([
  "Privy: Expected status code 200, received 400", // Privy
  "Error destroying session", // Privy
  'event="noNetwork', // ethers
]);

configureCoinbase({
  callbackURL: new URL(`https://${config.websiteDomain}/coinbase`),
  hostURL: new URL("https://wallet.coinbase.com/wsegue"),
  hostPackageName: "org.toshi",
});

initSentry();

saveApiURI();

const coinbaseUrl = new URL(`https://${config.websiteDomain}/coinbase`);

xmtpEngine.start();

const App = () => {
  const styles = useStyles();
  const debugRef = useRef();

  useEffect(() => {
    setupAppAttest();
  }, []);

  useCoinbaseWalletListener(true, coinbaseUrl);

  useEffect(() => {
    registerBackgroundFetchTask();
  }, []);

  const showDebugMenu = useCallback(() => {
    if (!debugRef.current || !(debugRef.current as any).showDebugMenu) {
      return;
    }
    (debugRef.current as any).showDebugMenu();
  }, []);

  useEffect(() => {
    converseEventEmitter.on("showDebugMenu", showDebugMenu);
    return () => {
      converseEventEmitter.off("showDebugMenu", showDebugMenu);
    };
  }, [showDebugMenu]);

  // For now we use persit with zustand to get the accounts when the app launch so here is okay to see if we're logged in or not
  useEffect(() => {
    const currentAccount = useAccountsStore.getState().currentAccount;
    if (currentAccount && currentAccount !== TEMPORARY_ACCOUNT_NAME) {
      setAuthStatus("signedIn");
    } else {
      setAuthStatus("signedOut");
    }
  }, []);

  useAppStateHandlers({
    onBackground() {
      logger.debug("App is in background");
    },
    onForeground() {
      logger.debug("App is in foreground");
    },
    onInactive() {
      logger.debug("App is inactive");
    },
  });

  return (
    <View style={styles.safe}>
      <Main />
      <DebugButton ref={debugRef} />
    </View>
  );
};

// On Android we use the default keyboard "animation"
const AppKeyboardProvider =
  Platform.OS === "ios" ? KeyboardProvider : React.Fragment;

const mmkvStorage = new MMKV({
  id: "persist-query-client",
});

/**
 * Recursively removes 'client' keys from all objects in the data structure.
 *
 * @param obj - The object to sanitize
 * @returns A sanitized copy without any 'client' keys
 */
function sanitizeForSerialization(obj: unknown): unknown {
  logger.debug("[sanitizeForSerialization] Processing:", {
    type: typeof obj,
    isArray: Array.isArray(obj),
  });

  // Handle primitives
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForSerialization(item));
  }

  // Handle objects
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === "client") {
      logger.debug("[sanitizeForSerialization] Removing client key");
      continue;
    }
    result[key] = sanitizeForSerialization(value);
  }

  return result;
}

export default function AppWithProviders() {
  const colorScheme = useColorScheme();

  const paperTheme = useMemo(() => {
    return colorScheme === "dark" ? MaterialDarkTheme : MaterialLightTheme;
  }, [colorScheme]);

  const { themeScheme, setThemeContextOverride, ThemeProvider } =
    useThemeProvider();

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        hydrateOptions: {
          defaultOptions: {
            deserializeData(data) {
              logger.debug("[deserializeData] Starting:", {
                dataType: typeof data,
                dataLength: typeof data === "string" ? data.length : "N/A",
              });

              try {
                const result =
                  typeof data === "string" ? JSON.parse(data) : data;
                logger.debug("[deserializeData] Success:", {
                  resultType: typeof result,
                  resultKeys:
                    result && typeof result === "object"
                      ? Object.keys(result)
                      : [],
                });
                return result;
              } catch (error) {
                logger.error(
                  "[PersistQueryClientProvider] Failed to deserialize:",
                  {
                    error,
                    dataSnippet:
                      typeof data === "string" ? data.slice(0, 100) : "N/A",
                  }
                );
                return {};
              }
            },
          },
        },
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            return true;
            // const shouldPersist =
            //   query.queryKey.includes("conversations") &&
            //   query.queryKey.includes(
            //     "0x9aefd0c98e67d3470f1c46df758a2c9ec504d57a"
            //   );
            // logger.debug("[shouldDehydrateQuery]:", {
            //   queryKey: query.queryKey,
            //   shouldPersist,
            // });
            // return shouldPersist;
          },
          serializeData: (data) => {
            logger.debug("[serializeData] Starting:", {
              dataType: typeof data,
              isArray: Array.isArray(data),
              topLevelKeys:
                data && typeof data === "object" ? Object.keys(data) : [],
            });

            try {
              const sanitized = sanitizeForSerialization(data);
              const result = JSON.stringify(sanitized);
              logger.debug("[serializeData] Success:", {
                sanitizedKeys:
                  sanitized && typeof sanitized === "object"
                    ? Object.keys(sanitized as object)
                    : [],
                resultLength: result.length,
              });
              return result;
            } catch (error) {
              logger.error(
                "[PersistQueryClientProvider] Failed to serialize:",
                {
                  error,
                  dataKeys:
                    data && typeof data === "object" ? Object.keys(data) : [],
                }
              );
              return JSON.stringify({});
            }
          },
        },
        persister: createSyncStoragePersister({
          storage: {
            getItem: (key) => {
              logger.debug("[storage] getItem:", { key });
              const value = mmkvStorage.getString(key);
              logger.debug("[storage] getItem result:", {
                key,
                hasValue: Boolean(value),
                valueLength: value?.length,
              });
              return value || null;
            },
            setItem: (key, value) => {
              logger.debug("[storage] setItem:", {
                key,
                valueLength: value?.length,
              });
              return mmkvStorage.set(key, value);
            },
            removeItem: (key) => {
              logger.debug("[storage] removeItem:", { key });
              return mmkvStorage.delete(key);
            },
          },
        }),
      }}
    >
      <PrivyProvider appId={config.privy.appId} storage={privySecureStorage}>
        <ThirdwebProvider>
          <AppKeyboardProvider>
            <ActionSheetProvider>
              <ThemeProvider value={{ themeScheme, setThemeContextOverride }}>
                <PaperProvider theme={paperTheme}>
                  <GestureHandlerRootView style={{ flex: 1 }}>
                    <BottomSheetModalProvider>
                      <App />
                      <Snackbars />
                    </BottomSheetModalProvider>
                  </GestureHandlerRootView>
                </PaperProvider>
              </ThemeProvider>
            </ActionSheetProvider>
          </AppKeyboardProvider>
        </ThirdwebProvider>
      </PrivyProvider>
    </PersistQueryClientProvider>
  );
}

const useStyles = () => {
  // const { theme } = useAppTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        safe: {
          flex: 1,
          // backgroundColor: theme.colors.background.surface,
        },
      }),
    []
  );
};
