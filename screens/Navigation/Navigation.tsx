import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from "@react-navigation/native-stack";
import { memo } from "react";
import { Platform, useColorScheme } from "react-native";
import { ScreenHeaderModalCloseButton } from "../../components/Screen/ScreenHeaderModalCloseButton";
import { ConversationBlockedListNav } from "../../features/blocked-chats/ConversationBlockedListNav";
import { useRouter } from "../../navigation/useNavigation";
import Accounts from "../Accounts/Accounts";
import { IdleScreen } from "../IdleScreen";
import { NewAccountConnectWalletScreen } from "../NewAccount/NewAccountConnectWalletScreen";
import { NewAccountEphemeraScreen } from "../NewAccount/NewAccountEphemeraScreen";
import { NewAccountPrivateKeyScreen } from "../NewAccount/NewAccountPrivateKeyScreen";
import { NewAccountPrivyScreen } from "../NewAccount/NewAccountPrivyScreen";
import { NewAccountScreen } from "../NewAccount/NewAccountScreen";
import { NewAccountUserProfileScreen } from "../NewAccount/NewAccountUserProfileScreen";
import { OnboardingConnectWalletScreen } from "../Onboarding/OnboardingConnectWalletScreen";
import { OnboardingEphemeraScreen } from "../Onboarding/OnboardingEphemeraScreen";
import { OnboardingGetStartedScreen } from "../Onboarding/OnboardingGetStartedScreen";
import { OnboardingNotificationsScreen } from "../Onboarding/OnboardingNotificationsScreen";
import { OnboardingPrivateKeyScreen } from "../Onboarding/OnboardingPrivateKeyScreen";
import { OnboardingPrivyScreen } from "../Onboarding/OnboardingPrivyScreen";
import { OnboardingUserProfileScreen } from "../Onboarding/OnboardingUserProfileScreen";
import {
  JoinGroupNavigation,
  JoinGroupNavigationParams,
} from "@/features/GroupInvites/joinGroup/JoinGroupNavigation";
import { ConversationListNav } from "./ConversationListNav";
import {
  ConversationNavParams,
  ConversationNav,
} from "../../features/conversation/conversation.nav";
import ConversationRequestsListNav from "./ConversationRequestsListNav";
import ConverseMatchMakerNav from "./ConverseMatchMakerNav";
import GroupNav, { GroupNavParams } from "./GroupNav";
import { screenListeners, stackGroupScreenOptions } from "./navHelpers";
import NewConversationNav, {
  NewConversationNavParams,
} from "./NewConversationNav";
import ProfileNav, { ProfileNavParams } from "./ProfileNav";
import ShareProfileNav from "./ShareProfileNav";
import TopUpNav from "./TopUpNav";
import UserProfileNav from "./UserProfileNav";
import WebviewPreviewNav, {
  WebviewPreviewNavParams,
} from "./WebviewPreviewNav";
import { translate } from "@/i18n";

export type NavigationParamList = {
  Idle: undefined;

  // Auth / Onboarding
  OnboardingGetStarted: undefined;
  OnboardingPrivy: undefined;
  OnboardingConnectWallet: {
    address: string;
  };
  OnboardingPrivateKey: undefined;
  OnboardingNotifications: undefined;
  OnboardingEphemeral: undefined;
  OnboardingUserProfile: undefined;

  // Nwe account
  NewAccountNavigator: undefined;
  NewAccountUserProfile: undefined;
  NewAccountConnectWallet: {
    address: string;
  };
  NewAccountPrivy: undefined;
  NewAccountPrivateKey: undefined;
  NewAccountEphemera: undefined;

  // Main
  Accounts: undefined;
  Blocked: undefined;
  Chats: undefined;
  ChatsRequests: undefined;
  Conversation: ConversationNavParams;
  NewConversation: NewConversationNavParams;

  NewGroupSummary: undefined;
  ConverseMatchMaker: undefined;
  ShareProfile: undefined;
  TopUp: undefined;
  Profile: ProfileNavParams;
  Group: GroupNavParams;
  GroupInvite: JoinGroupNavigationParams;
  UserProfile: undefined;
  WebviewPreview: WebviewPreviewNavParams;
  NewAccount: undefined;

  // UI Tests
  Examples: undefined;
};

export const authScreensSharedScreenOptions: NativeStackNavigationOptions = {
  headerTitle: "",
  headerBackTitle: translate("back"),
  headerBackVisible: false,
  headerShadowVisible: false,
};

export const NativeStack = createNativeStackNavigator<NavigationParamList>();

export const navigationAnimation = Platform.OS === "ios" ? "default" : "none";

export function IdleNavigation() {
  return (
    <NativeStack.Navigator
      screenListeners={screenListeners("fullStackNavigation")}
    >
      <NativeStack.Screen
        options={{
          headerShown: false,
        }}
        name="Idle"
        component={IdleScreen}
      />
    </NativeStack.Navigator>
  );
}

export function SignedInNavigation() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  return (
    <NativeStack.Navigator
      screenListeners={screenListeners("fullStackNavigation")}
    >
      <NativeStack.Group>
        <NativeStack.Group screenOptions={stackGroupScreenOptions(colorScheme)}>
          {ConversationListNav()}
          {ConversationRequestsListNav()}
          {ConversationBlockedListNav()}
          {ConversationNav()}
          {NewConversationNav()}
          {ConverseMatchMakerNav()}
          {ShareProfileNav()}
          {WebviewPreviewNav()}
          {ProfileNav()}
          {GroupNav()}
          {JoinGroupNavigation()}
          {TopUpNav()}
        </NativeStack.Group>

        {/* Modals */}
        <NativeStack.Group
          screenOptions={{
            presentation: "modal",
            ...stackGroupScreenOptions(colorScheme),
          }}
        >
          {UserProfileNav()}
          <NativeStack.Screen
            name="Accounts"
            component={Accounts}
            options={{
              headerLargeTitle: true,
              headerShadowVisible: false,
              headerLeft: () => (
                <ScreenHeaderModalCloseButton onPress={router.goBack} />
              ),
            }}
          />
          <NativeStack.Screen
            name="NewAccountUserProfile"
            component={NewAccountUserProfileScreen}
            options={{
              headerLeft: () => (
                <ScreenHeaderModalCloseButton onPress={router.goBack} />
              ),
              headerTitle: translate("profile.modify_profile"),
            }}
          />
          <NativeStack.Screen
            name="NewAccountNavigator"
            component={NewAccountNavigator}
            options={{
              headerShown: false,
            }}
          />
        </NativeStack.Group>
      </NativeStack.Group>
    </NativeStack.Navigator>
  );
}

export function SignedOutNavigation() {
  const colorScheme = useColorScheme();

  return (
    <NativeStack.Navigator
      screenListeners={screenListeners("fullStackNavigation")}
    >
      <NativeStack.Group>
        {/* Auth / Onboarding */}
        <NativeStack.Group
          screenOptions={{
            ...stackGroupScreenOptions(colorScheme),
            ...authScreensSharedScreenOptions,
          }}
        >
          <NativeStack.Screen
            options={{
              headerShown: false,
            }}
            name="OnboardingGetStarted"
            component={OnboardingGetStartedScreen}
          />
          <NativeStack.Screen
            name="OnboardingPrivy"
            component={OnboardingPrivyScreen}
          />
          <NativeStack.Screen
            name="OnboardingConnectWallet"
            component={OnboardingConnectWalletScreen}
          />
          <NativeStack.Screen
            name="OnboardingNotifications"
            component={OnboardingNotificationsScreen}
          />
          <NativeStack.Screen
            name="OnboardingUserProfile"
            component={OnboardingUserProfileScreen}
          />
          <NativeStack.Screen
            name="OnboardingPrivateKey"
            component={OnboardingPrivateKeyScreen}
          />
          <NativeStack.Screen
            name="OnboardingEphemeral"
            component={OnboardingEphemeraScreen}
          />
        </NativeStack.Group>
      </NativeStack.Group>
    </NativeStack.Navigator>
  );
}

const NewAccountStack = createNativeStackNavigator<NavigationParamList>();

const NewAccountNavigator = memo(function NewAccountNavigator() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  return (
    <NewAccountStack.Navigator>
      <NewAccountStack.Group
        screenOptions={{
          headerTitle: "",
          headerBackTitle: translate("back"),
          ...stackGroupScreenOptions(colorScheme),
        }}
      >
        <NativeStack.Screen
          name="NewAccount"
          component={NewAccountScreen}
          options={{
            headerTitle: translate("new_account"),
            headerLeft: () => (
              <ScreenHeaderModalCloseButton
                title={translate("cancel")}
                onPress={router.goBack}
              />
            ),
          }}
        />
        <NewAccountStack.Screen
          name="NewAccountPrivy"
          component={NewAccountPrivyScreen}
        />
        <NewAccountStack.Screen
          name="NewAccountConnectWallet"
          component={NewAccountConnectWalletScreen}
        />
        <NewAccountStack.Screen
          name="NewAccountPrivateKey"
          component={NewAccountPrivateKeyScreen}
        />
        <NewAccountStack.Screen
          name="NewAccountUserProfile"
          component={NewAccountUserProfileScreen}
        />
        <NewAccountStack.Screen
          name="NewAccountEphemera"
          component={NewAccountEphemeraScreen}
        />
      </NewAccountStack.Group>
    </NewAccountStack.Navigator>
  );
});
