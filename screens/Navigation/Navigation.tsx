import { ScreenHeaderModalCloseButton } from "@/components/Screen/ScreenHeaderModalCloseButton";
import {
  JoinGroupNavigation,
  JoinGroupNavigationParams,
} from "@/features/GroupInvites/joinGroup/JoinGroupNavigation";
import { AppSettingsScreen } from "@/features/app-settings/app-settings.screen";
import { BlockedConversationsScreen } from "@/features/blocked-conversations/blocked-conversations.screen";
import { ConversationListScreen } from "@/features/conversation-list/conversation-list.screen";
import { ConversationRequestsListNav } from "@/features/conversation-requests-list/conversation-requests-list.nav";
import {
  ConversationNav,
  ConversationNavParams,
} from "@/features/conversation/conversation.nav";
import { CreateConversationScreen } from "@/features/create-conversation/create-conversation-screen";
import {
  InviteUsersToExistingGroupNav,
  InviteUsersToExistingGroupParams,
} from "@/features/groups/invite-to-group/InviteUsersToExistingGroup.nav";
import { OnboardingWelcomeScreen } from "@/features/onboarding/screens/onboarding-welcome-screen";
import { ProfileNav, ProfileNavParams } from "@/features/profiles/profile.nav";
import { translate } from "@/i18n";
import { useRouter } from "@/navigation/useNavigation";
import UserProfileNav from "@/screens/Navigation/UserProfileNav";
import { OnboardingContactCardScreen } from "@features/onboarding/screens/onboarding-contact-card-screen";
import { OnboardingNotificationsScreen } from "@features/onboarding/screens/onboarding-notifications-screen";
import {
  NativeStackNavigationOptions,
  createNativeStackNavigator,
} from "@react-navigation/native-stack";
import { memo } from "react";
import { Platform, useColorScheme } from "react-native";
import { IdleScreen } from "../IdleScreen";
import { NewAccountCreateContactCardScreen } from "../NewAccount/new-account-create-contact-card-screen";
import { NewAccountScreen } from "../NewAccount/new-account-screen";
import GroupNav, { GroupNavParams } from "./GroupNav";
import ShareProfileNav from "./ShareProfileNav";
import TopUpNav from "./TopUpNav";
import WebviewPreviewNav, {
  WebviewPreviewNavParams,
} from "./WebviewPreviewNav";
import { screenListeners, stackGroupScreenOptions } from "./navHelpers";

export type NavigationParamList = {
  Idle: undefined;

  // Auth / Onboarding
  OnboardingWelcome: undefined;
  OnboardingCreateContactCard: undefined;
  OnboardingNotifications: undefined;
  OnboardingGetStarted: undefined;

  // New account
  NewAccountNavigator: undefined;
  NewAccountCreateContactCard: undefined;
  NewAccountConnectWallet: {
    address: string;
  };

  // Main
  Accounts: undefined;
  Blocked: undefined;
  Chats: undefined;
  ChatsRequests: undefined;
  Conversation: ConversationNavParams;
  CreateConversation: undefined;

  NewGroupSummary: undefined;
  ConverseMatchMaker: undefined;
  ShareProfile: undefined;
  TopUp: undefined;
  Profile: ProfileNavParams;
  Group: GroupNavParams;
  InviteUsersToExistingGroup: InviteUsersToExistingGroupParams;
  GroupInvite: JoinGroupNavigationParams;
  UserProfile: undefined;
  WebviewPreview: WebviewPreviewNavParams;
  NewAccount: undefined;

  // UI Tests
  Examples: undefined;

  AppSettings: undefined;
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
          <NativeStack.Screen name="Chats" component={ConversationListScreen} />
          <NativeStack.Screen
            name="CreateConversation"
            component={CreateConversationScreen}
          />
          <NativeStack.Screen
            name="Blocked"
            component={BlockedConversationsScreen}
          />
          {ConversationRequestsListNav()}
          {ConversationNav()}
          {ShareProfileNav()}
          {WebviewPreviewNav()}
          {ProfileNav()}
          {GroupNav()}
          {InviteUsersToExistingGroupNav()}
          {JoinGroupNavigation()}
          {TopUpNav()}
        </NativeStack.Group>

        <NativeStack.Group>
          {UserProfileNav()}
          <NativeStack.Screen
            name="AppSettings"
            component={AppSettingsScreen}
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
            name="OnboardingWelcome"
            component={OnboardingWelcomeScreen}
          />
          <NativeStack.Screen
            options={{
              headerShown: false,
            }}
            name="OnboardingCreateContactCard"
            component={OnboardingContactCardScreen}
          />

          <NativeStack.Screen
            options={{
              headerShown: false,
            }}
            name="OnboardingNotifications"
            component={OnboardingNotificationsScreen}
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
          options={{
            headerShown: false,
          }}
          name="NewAccountCreateContactCard"
          component={NewAccountCreateContactCardScreen}
        />
      </NewAccountStack.Group>
    </NewAccountStack.Navigator>
  );
});
