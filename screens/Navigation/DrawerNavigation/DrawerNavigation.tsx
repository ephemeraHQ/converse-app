import {
  DrawerNavigationProp,
  createDrawerNavigator,
} from "@react-navigation/drawer";
import {
  NavigationContainer,
  getStateFromPath,
} from "@react-navigation/native";
import * as Linking from "expo-linking";

import { initialURL } from "../../../components/StateHandlers/InitialStateHandler";
import config from "../../../config";
import { useAppStore } from "../../../data/store/appStore";
import DrawerLeftStackNavigation from "./DrawerLeftStackNavigation";
import DrawerRightStackNavigation from "./DrawerRightStackNavigation";

type DrawerParams = {
  Chats: undefined;
  Conversation: {
    topic?: string;
    message?: string;
    focus?: boolean;
    mainConversationWithPeer?: string;
  };
};
export let drawerNav: DrawerNavigationProp<DrawerParams> | undefined =
  undefined;

const Drawer = createDrawerNavigator<DrawerParams>();

const prefix = Linking.createURL("/");
const linking = {
  prefixes: [prefix, ...config.universalLinks],
  config: {
    initialRouteName: "Conversation",
    screens: {
      Conversation: {
        path: "/conversation",
        parse: {
          topic: decodeURIComponent,
        },
        stringify: {
          topic: encodeURIComponent,
        },
      },
    },
  },
  getStateFromPath: (path: string, options: any) => {
    // dm method must link to the Conversation Screen as well
    // but prefilling the parameters
    let pathForState = path;
    if (pathForState.startsWith("dm?peer=")) {
      const peer = pathForState.slice(8).trim().toLowerCase();
      pathForState = `conversation?mainConversationWithPeer=${peer}&focus=true`;
    } else if (pathForState.startsWith("dm/")) {
      const peer = pathForState.slice(3).trim().toLowerCase();
      pathForState = `conversation?mainConversationWithPeer=${peer}&focus=true`;
    }
    const state = getStateFromPath(pathForState, options);
    return state;
  },
  getInitialURL: () => {
    return initialURL;
  },
};

export default function DrawerNavigation() {
  const splashScreenHidden = useAppStore((s) => s.splashScreenHidden);
  const isLargeScreen = true;

  return (
    <NavigationContainer
      linking={splashScreenHidden ? (linking as any) : undefined}
    >
      <Drawer.Navigator
        backBehavior="none"
        defaultStatus="open"
        drawerContent={() => <DrawerLeftStackNavigation />}
        screenOptions={{
          headerShown: false,
          drawerType: isLargeScreen ? "permanent" : "back",
          drawerStyle: isLargeScreen ? null : { width: "100%" },
          drawerContentContainerStyle: { paddingTop: 4 },
          overlayColor: "transparent",
        }}
      >
        <Drawer.Screen name="Conversation">
          {(navigationProps) => {
            drawerNav =
              navigationProps.navigation as DrawerNavigationProp<DrawerParams>;
            return (
              <DrawerRightStackNavigation
                topic={navigationProps.route.params?.topic}
              />
            );
          }}
        </Drawer.Screen>
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

const i = 0;
