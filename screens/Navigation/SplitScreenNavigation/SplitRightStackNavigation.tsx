import { NavigationContainer, RouteProp } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import { Platform, useColorScheme } from "react-native";

import config from "../../../config";
import { useAppStore } from "../../../data/store/appStore";
import { isDesktop } from "../../../utils/device";
import { converseNavigations } from "../../../utils/navigation";
import ConversationNav, {
  ConversationNavParams,
  ConversationScreenConfig,
} from "../ConversationNav";
import EnableTransactionsNav from "../EnableTransactionsNav";
import NewConversationNav, {
  NewConversationNavParams,
  NewConversationScreenConfig,
} from "../NewConversationNav";
import ProfileNav, {
  ProfileNavParams,
  ProfileScreenConfig,
} from "../ProfileNav";
import ShareProfileNav, { ShareProfileScreenConfig } from "../ShareProfileNav";
import TopUpNav from "../TopUpNav";
import WebviewPreviewNav, {
  WebviewPreviewNavParams,
  WebviewPreviewScreenConfig,
} from "../WebviewPreviewNav";
import { stackGroupScreenOptions } from "../navHelpers";
import { SplitScreenDrawerParams } from "./SplitScreenNavigation";

export type NavigationParamList = {
  Conversation: ConversationNavParams;
  NewConversation: NewConversationNavParams;
  EnableTransactions: undefined;
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
    initialRouteName: "Conversation",
    screens: {
      Conversation: ConversationScreenConfig,
      NewConversation: NewConversationScreenConfig,
      Profile: ProfileScreenConfig,
      ShareProfile: ShareProfileScreenConfig,
      WebviewPreview: WebviewPreviewScreenConfig,
    },
  },
};

export const navigationAnimation = Platform.OS === "ios" ? "default" : "none";

export default function SplitRightStackNavigation({
  route,
}: {
  route: RouteProp<SplitScreenDrawerParams, "Conversation">;
}) {
  const colorScheme = useColorScheme();
  const splashScreenHidden = useAppStore((s) => s.splashScreenHidden);
  return (
    <NavigationContainer
      linking={splashScreenHidden ? (linking as any) : undefined}
      independent
      ref={(r) => {
        converseNavigations["splitRightStack"] = r;
      }}
      onUnhandledAction={() => {
        // Since we're handling multiple navigators,
        // let's silence errors when the action
        // is not meant for this one
      }}
    >
      <NativeStack.Navigator screenOptions={{ gestureEnabled: !isDesktop }}>
        <NativeStack.Group screenOptions={stackGroupScreenOptions(colorScheme)}>
          {ConversationNav(route.params)}
          {NewConversationNav()}
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
