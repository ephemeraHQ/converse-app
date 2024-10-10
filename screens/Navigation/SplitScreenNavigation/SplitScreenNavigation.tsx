import { createDrawerNavigator } from "@react-navigation/drawer";
import { NavigationContainer } from "@react-navigation/native";
import { listItemSeparatorColor } from "@styles/colors";
import * as Linking from "expo-linking";
import { useEffect, useRef } from "react";
import { useColorScheme } from "react-native";

import config from "../../../config";
import {
  getChatStore,
  useCurrentAccount,
} from "../../../data/store/accountsStore";
import { useAppStore } from "../../../data/store/appStore";
import { useAuthStatus } from "../../../data/store/authStore";
import { OnboardingNavigator } from "../../../navigation/OnboardingNavigator";
import { converseNavigations } from "../../../utils/navigation";
import {
  ConversationNavParams,
  ConversationScreenConfig,
} from "../ConversationNav";
import { getConverseInitialURL, getConverseStateFromPath } from "../navHelpers";
import SplitLeftStackNavigation from "./SplitLeftStackNavigation";
import SplitRightStackNavigation from "./SplitRightStackNavigation";
import { useThemeProvider } from "../../../theme/useAppTheme";

export type SplitScreenDrawerParams = {
  Chats: undefined;
  Conversation: ConversationNavParams;
};

const Drawer = createDrawerNavigator<SplitScreenDrawerParams>();

const prefix = Linking.createURL("/");
const linking = {
  prefixes: [prefix, ...config.universalLinks],
  config: {
    initialRouteName: "Conversation",
    screens: {
      Conversation: ConversationScreenConfig,
    },
  },
  getStateFromPath: getConverseStateFromPath,
  getInitialURL: getConverseInitialURL,
};

export default function SplitScreenNavigation() {
  const splashScreenHidden = useAppStore((s) => s.splashScreenHidden);
  const currentAccount = useCurrentAccount();
  const accountRef = useRef(currentAccount);
  const colorScheme = useColorScheme();
  const authStatus = useAuthStatus();

  const { navigationTheme } = useThemeProvider();

  useEffect(() => {
    if (accountRef.current !== currentAccount) {
      converseNavigations["splitScreen"]?.reset({
        index: 0,
        routes: [
          {
            name: "Conversation",
          },
        ],
        type: "stack",
      });
      if (currentAccount) {
        getChatStore(currentAccount).getState().setOpenedConversationTopic("");
      }
    }

    accountRef.current = currentAccount;
  }, [currentAccount]);

  if (!splashScreenHidden) {
    return null;
  }

  if (authStatus === "idle") {
    return null;
  }

  return (
    <NavigationContainer
      theme={navigationTheme}
      linking={splashScreenHidden ? (linking as any) : undefined}
      ref={(r) => {
        if (r) {
          converseNavigations["splitScreen"] = r;
        }
      }}
      onUnhandledAction={() => {
        // Since we're handling multiple navigators,
        // let's silence errors when the action
        // is not meant for this one
      }}
    >
      {authStatus === "signedOut" && <OnboardingNavigator />}

      {authStatus === "signedIn" && (
        <Drawer.Navigator
          backBehavior="none"
          defaultStatus="open"
          drawerContent={() => <SplitLeftStackNavigation />}
          screenOptions={{
            headerShown: false,
            drawerType: "permanent",
            drawerStyle: {
              width: 400,
              borderRightColor: listItemSeparatorColor(colorScheme),
            },
            drawerContentContainerStyle: { paddingTop: 4 },
            overlayColor: "transparent",
          }}
        >
          <Drawer.Screen name="Conversation">
            {(navigationProps) => (
              <SplitRightStackNavigation route={navigationProps.route} />
            )}
          </Drawer.Screen>
        </Drawer.Navigator>
      )}
    </NavigationContainer>
  );
}
