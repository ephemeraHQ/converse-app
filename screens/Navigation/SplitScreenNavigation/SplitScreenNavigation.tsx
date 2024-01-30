import { createDrawerNavigator } from "@react-navigation/drawer";
import { NavigationContainer } from "@react-navigation/native";
import * as Linking from "expo-linking";
import { useEffect, useRef } from "react";
import { useColorScheme } from "react-native";

import config from "../../../config";
import {
  getChatStore,
  useCurrentAccount,
} from "../../../data/store/accountsStore";
import { useAppStore } from "../../../data/store/appStore";
import { listItemSeparatorColor } from "../../../utils/colors";
import { converseNavigations } from "../../../utils/navigation";
import {
  ConversationNavParams,
  ConversationScreenConfig,
} from "../ConversationNav";
import { getConverseInitialURL, getConverseStateFromPath } from "../navHelpers";
import SplitLeftStackNavigation from "./SplitLeftStackNavigation";
import SplitRightStackNavigation from "./SplitRightStackNavigation";

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

  return (
    <NavigationContainer
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
    </NavigationContainer>
  );
}
