import { NavigationContainer, RouteProp } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import { Platform, useColorScheme } from "react-native";

import { SplitScreenDrawerParams } from "./SplitScreenNavigation";
import config from "../../../config";
import { useAppStore } from "../../../data/store/appStore";
import { isDesktop } from "../../../utils/device";
import { converseNavigations } from "../../../utils/navigation";
import ConversationNav, {
  ConversationNavParams,
  ConversationScreenConfig,
} from "../ConversationNav";
import EnableTransactionsNav from "../EnableTransactionsNav";
import GroupInviteNav from "../GroupInviteNav";
import GroupLinkNav, {
  GroupLinkNavParams,
  GroupLinkScreenConfig,
} from "../GroupLinkNav";
import GroupNav, { GroupNavParams, GroupScreenConfig } from "../GroupNav";
import NewConversationNav, {
  NewConversationNavParams,
  NewConversationScreenConfig,
} from "../NewConversationNav";
import ProfileNav, {
  ProfileNavParams,
  ProfileScreenConfig,
} from "../ProfileNav";
import ShareFrameNav, { ShareFrameNavParams } from "../ShareFrameNav";
import ShareProfileNav, { ShareProfileScreenConfig } from "../ShareProfileNav";
import TopUpNav from "../TopUpNav";
import UserProfileNav from "../UserProfileNav";
import WebviewPreviewNav, {
  WebviewPreviewNavParams,
  WebviewPreviewScreenConfig,
} from "../WebviewPreviewNav";
import {
  getConverseInitialURL,
  getConverseStateFromPath,
  stackGroupScreenOptions,
} from "../navHelpers";

export type NavigationParamList = {
  Conversation: ConversationNavParams;
  NewConversation: NewConversationNavParams;
  NewGroupSummary: undefined;
  EnableTransactions: undefined;
  ShareProfile: undefined;
  ShareFrame: ShareFrameNavParams;
  TopUp: undefined;
  Profile: ProfileNavParams;
  Group: GroupNavParams;
  GroupLink: GroupLinkNavParams;
  UserProfile: undefined;
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
      Group: GroupScreenConfig,
      GroupLink: GroupLinkScreenConfig,
      ShareProfile: ShareProfileScreenConfig,
      WebviewPreview: WebviewPreviewScreenConfig,
    },
  },
  getStateFromPath: getConverseStateFromPath("splitRightStack"),
  getInitialURL: getConverseInitialURL,
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
        if (r) {
          converseNavigations["splitRightStack"] = r;
        }
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
          {ShareFrameNav()}
          {WebviewPreviewNav()}
          {ProfileNav()}
          {GroupNav()}
          {GroupLinkNav()}
          {UserProfileNav()}
          {GroupInviteNav()}
          {TopUpNav()}
          {EnableTransactionsNav()}
        </NativeStack.Group>
      </NativeStack.Navigator>
    </NavigationContainer>
  );
}
