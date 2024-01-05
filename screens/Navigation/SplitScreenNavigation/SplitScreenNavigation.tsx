import { createDrawerNavigator } from "@react-navigation/drawer";
import { NavigationContainer } from "@react-navigation/native";
import * as Linking from "expo-linking";

import config from "../../../config";
import { useAppStore } from "../../../data/store/appStore";
import {
  ConversationNavParams,
  ConversationScreenConfig,
} from "../ConversationNav";
import { getConverseInitialURL, getConverseStateFromPath } from "../navHelpers";
import SplitLeftStackNavigation from "./SplitLeftStackNavigation";
import SplitRightStackNavigation from "./SplitRightStackNavigation";

type DrawerParams = {
  Chats: undefined;
  Conversation: ConversationNavParams;
};

const Drawer = createDrawerNavigator<DrawerParams>();

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

  return (
    <NavigationContainer
      linking={splashScreenHidden ? (linking as any) : undefined}
    >
      <Drawer.Navigator
        backBehavior="none"
        defaultStatus="open"
        drawerContent={() => <SplitLeftStackNavigation />}
        screenOptions={{
          headerShown: false,
          drawerType: "permanent",
          drawerStyle: { width: "39%" },
          drawerContentContainerStyle: { paddingTop: 4 },
          overlayColor: "transparent",
        }}
      >
        <Drawer.Screen name="Conversation">
          {(navigationProps) => (
            <SplitRightStackNavigation
              topic={navigationProps.route.params?.topic}
            />
          )}
        </Drawer.Screen>
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

const i = 0;
