import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from "@react-navigation/native-stack";
import { Platform, useColorScheme } from "react-native";

import UserProfile from "../../components/Onboarding/UserProfile";
import { useCurrentAccount } from "../../data/store/accountsStore";
import { isDesktop } from "../../utils/device";
import { NotificationsScreen } from "../NotificationsScreen";
import { ConnectWalletScreen } from "../Onboarding/ConnectWalletScreen";
import { EphemeraLoginScreen } from "../Onboarding/EphemeraLoginScreen";
import { GetStartedScreen } from "../Onboarding/GetStartedScreen";
import { PrivyConnectScreen } from "../Onboarding/PrivyConnectScreen";
import AccountsNav from "./AccountsNav";
import ConversationBlockedListNav from "./ConversationBlockedListNav";
import ConversationListNav from "./ConversationListNav";
import ConversationNav, { ConversationNavParams } from "./ConversationNav";
import ConversationRequestsListNav from "./ConversationRequestsListNav";
import ConverseMatchMakerNav from "./ConverseMatchMakerNav";
import EnableTransactionsNav from "./EnableTransactionsNav";
import GroupInviteNav, { GroupInviteNavParams } from "./GroupInviteNav";
import GroupLinkNav, { GroupLinkNavParams } from "./GroupLinkNav";
import GroupNav, { GroupNavParams } from "./GroupNav";
import { NewAccountNav } from "./NewAccountNav";
import NewConversationNav, {
  NewConversationNavParams,
} from "./NewConversationNav";
import ProfileNav, { ProfileNavParams } from "./ProfileNav";
import ShareFrameNav, { ShareFrameNavParams } from "./ShareFrameNav";
import ShareProfileNav from "./ShareProfileNav";
import TopUpNav from "./TopUpNav";
import WebviewPreviewNav, {
  WebviewPreviewNavParams,
} from "./WebviewPreviewNav";
import { screenListeners, stackGroupScreenOptions } from "./navHelpers";

export type NavigationParamList = {
  // Auth / Account creation
  GetStarted: undefined;
  PrivyConnect: undefined;
  ConnectWallet: undefined;
  Notifications: undefined;
  EphemeralLogin: undefined;

  Accounts: undefined;
  Blocked: undefined;
  Chats: undefined;
  ChatsRequests: undefined;
  Conversation: ConversationNavParams;
  NewConversation: NewConversationNavParams;
  NewGroupSummary: undefined;
  EnableTransactions: undefined;
  ConverseMatchMaker: undefined;
  ShareProfile: undefined;
  ShareFrame: ShareFrameNavParams;
  TopUp: undefined;
  Profile: ProfileNavParams;
  Group: GroupNavParams;
  GroupLink: GroupLinkNavParams;
  GroupInvite: GroupInviteNavParams;
  UserProfile: undefined;
  WebviewPreview: WebviewPreviewNavParams;
  NewAccount: undefined;
};

const authScreensSharedScreenOptions: NativeStackNavigationOptions = {
  headerTitle: "",
  headerBackTitle: "Back",
  headerBackTitleVisible: false,
  headerShadowVisible: false,
};

export const NativeStack = createNativeStackNavigator<NavigationParamList>();

export const navigationAnimation = Platform.OS === "ios" ? "default" : "none";

export default function MainNavigation() {
  const colorScheme = useColorScheme();

  const isSignedIn = !!useCurrentAccount();

  return (
    <NativeStack.Navigator
      screenOptions={{ gestureEnabled: !isDesktop }}
      initialRouteName={isSignedIn ? "Chats" : "GetStarted"}
      // TODO: Do we still need this?
      screenListeners={screenListeners("fullStackNavigation")}
    >
      <NativeStack.Group screenOptions={stackGroupScreenOptions(colorScheme)}>
        {AccountsNav()}
        {ConversationListNav()}
        {ConversationRequestsListNav()}
        {ConversationBlockedListNav()}
        {ConversationNav()}
        {NewConversationNav()}
        {ConverseMatchMakerNav()}
        {ShareProfileNav()}
        {ShareFrameNav()}
        {WebviewPreviewNav()}
        {ProfileNav()}
        {GroupNav()}
        {GroupLinkNav()}
        {GroupInviteNav()}
        {TopUpNav()}
        {EnableTransactionsNav()}
        {NewAccountNav()}
      </NativeStack.Group>

      <NativeStack.Group screenOptions={stackGroupScreenOptions(colorScheme)}>
        <NativeStack.Screen
          options={{
            headerShown: false,
          }}
          name="GetStarted"
          component={GetStartedScreen}
        />
        <NativeStack.Screen
          options={authScreensSharedScreenOptions}
          name="PrivyConnect"
          component={PrivyConnectScreen}
        />
        <NativeStack.Screen
          name="ConnectWallet"
          options={authScreensSharedScreenOptions}
          component={ConnectWalletScreen}
        />
        <NativeStack.Screen
          name="Notifications"
          options={authScreensSharedScreenOptions}
          component={NotificationsScreen}
        />
        <NativeStack.Screen name="UserProfile" component={UserProfile} />
        <NativeStack.Screen
          options={authScreensSharedScreenOptions}
          name="EphemeralLogin"
          component={EphemeraLoginScreen}
        />
      </NativeStack.Group>
    </NativeStack.Navigator>
  );
}
