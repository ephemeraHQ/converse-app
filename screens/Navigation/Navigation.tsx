import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import { Platform, useColorScheme } from "react-native";

import config from "../../config";
import { useAppStore } from "../../data/store/appStore";
import { isDesktop } from "../../utils/device";
import { converseNavigations } from "../../utils/navigation";
import AccountsNav from "./AccountsNav";
import ConversationListNav from "./ConversationListNav";
import ConversationNav, {
  ConversationNavParams,
  ConversationScreenConfig,
} from "./ConversationNav";
import ConversationRequestsListNav from "./ConversationRequestsListNav";
import ConverseMatchMakerNav from "./ConverseMatchMakerNav";
import EnableTransactionsNav from "./EnableTransactionsNav";
import NewConversationNav, {
  NewConversationNavParams,
  NewConversationScreenConfig,
} from "./NewConversationNav";
import ProfileNav, {
  ProfileNavParams,
  ProfileScreenConfig,
} from "./ProfileNav";
import ShareProfileNav, { ShareProfileScreenConfig } from "./ShareProfileNav";
import TopUpNav from "./TopUpNav";
import WebviewPreviewNav, {
  WebviewPreviewNavParams,
  WebviewPreviewScreenConfig,
} from "./WebviewPreviewNav";
import {
  getConverseInitialURL,
  getConverseStateFromPath,
  screenListeners,
  stackGroupScreenOptions,
} from "./navHelpers";

export type NavigationParamList = {
  Accounts: undefined;
  Chats: undefined;
  ChatsRequests: undefined;
  Conversation: ConversationNavParams;
  NewConversation: NewConversationNavParams;
  EnableTransactions: undefined;
  ConverseMatchMaker: undefined;
  ShareProfile: undefined;
  TopUp: undefined;
  Profile: ProfileNavParams;
  WebviewPreview: WebviewPreviewNavParams;
};

export const NativeStack = createNativeStackNavigator<NavigationParamList>();
const prefix = Linking.createURL("/");
const linking = {
  prefixes: [prefix, ...config.universalLinks],
  config: {
    initialRouteName: "Chats",
    screens: {
      Chats: "/",
      Conversation: ConversationScreenConfig,
      NewConversation: NewConversationScreenConfig,
      Profile: ProfileScreenConfig,
      ShareProfile: ShareProfileScreenConfig,
      WebviewPreview: WebviewPreviewScreenConfig,
    },
  },
  getStateFromPath: getConverseStateFromPath,
  getInitialURL: getConverseInitialURL,
};

export const navigationAnimation = Platform.OS === "ios" ? "default" : "none";

export default function Navigation() {
  const colorScheme = useColorScheme();
  const splashScreenHidden = useAppStore((s) => s.splashScreenHidden);
  return (
    <NavigationContainer
      linking={splashScreenHidden ? (linking as any) : undefined}
      initialState={
        Platform.OS === "ios"
          ? {
              // On iOS, the Accounts switcher is available through a back button
              index: 1,
              routes: [
                {
                  name: "Accounts",
                },
                {
                  name: "Chats",
                },
              ],
              type: "stack",
            }
          : {
              // On Android, the Accounts switcher is available through the drawer
              index: 0,
              routes: [
                {
                  name: "Chats",
                },
              ],
              type: "stack",
            }
      }
      ref={(r) => {
        converseNavigations["mainStack"] = r;
      }}
      onUnhandledAction={() => {
        // Since we're handling multiple navigators,
        // let's silence errors when the action
        // is not meant for this one
      }}
    >
      <NativeStack.Navigator
        screenOptions={{ gestureEnabled: !isDesktop }}
        screenListeners={screenListeners("fullStackNavigation")}
      >
        <NativeStack.Group screenOptions={stackGroupScreenOptions(colorScheme)}>
          {AccountsNav()}
          {ConversationListNav()}
          {ConversationRequestsListNav()}
          {ConversationNav()}
          {NewConversationNav()}
          {ConverseMatchMakerNav()}
          {ShareProfileNav()}
          {WebviewPreviewNav()}
          {ProfileNav()}
          {TopUpNav()}
          {EnableTransactionsNav()}
        </NativeStack.Group>
      </NativeStack.Navigator>
    </NavigationContainer>
  );
}
