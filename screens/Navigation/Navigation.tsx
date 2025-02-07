import { ScreenHeaderModalCloseButton } from "@/components/Screen/ScreenHeaderModalCloseButton";
import { JoinGroupNavigationParams } from "@/features/GroupInvites/joinGroup/JoinGroupNavigation";
import { ConversationNavParams } from "@/features/conversation/conversation.nav";
import { InviteUsersToExistingGroupParams } from "@/features/groups/invite-to-group/InviteUsersToExistingGroup.nav";
import { OnboardingWelcomeScreen } from "@/features/onboarding/screens/onboarding-welcome-screen";
import { ProfileNavParams } from "@/features/profiles/profile.nav";
import { translate } from "@/i18n";
import { useRouter } from "@/navigation/useNavigation";
import { OnboardingContactCardScreen } from "@features/onboarding/screens/onboarding-contact-card-screen";
import { OnboardingNotificationsScreen } from "@features/onboarding/screens/onboarding-notifications-screen";
import {
  NativeStackNavigationOptions,
  createNativeStackNavigator,
} from "@react-navigation/native-stack";
import React, { memo } from "react";
import { Platform, useColorScheme, Text, Button } from "react-native";
import { IdleScreen } from "../IdleScreen";
import { NewAccountCreateContactCardScreen } from "../NewAccount/new-account-create-contact-card-screen";
import { NewAccountScreen } from "../NewAccount/new-account-screen";
import { GroupNavParams } from "./GroupNav";
import { WebviewPreviewNavParams } from "./WebviewPreviewNav";
import { screenListeners, stackGroupScreenOptions } from "./navHelpers";
import { SignupWithPasskeyProvider } from "@/features/onboarding/contexts/signup-with-passkey.context";
import { usePrivy } from "@privy-io/expo";
import {
  useAccountsStore,
  useCurrentSender,
} from "@/features/multi-inbox/multi-inbox.store";
import { Center } from "@/design-system/Center";
import { VStack } from "@/design-system/VStack";
import { MultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";
import { queryClient } from "@/queries/queryClient";
import logger from "@/utils/logger";

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

const FakeScreen = () => {
  const currentSender = useCurrentSender();
  console.log("currentSender", currentSender);
  const { logout: privyLogout } = usePrivy();

  return (
    <Center style={{ flex: 1 }}>
      <VStack>
        <Text>Fake Screen</Text>
        <Text>ETH: {currentSender?.ethereumAddress}</Text>
        <Text>INBOX: {currentSender?.xmtpInboxId}</Text>
        <Button
          title="Logout"
          onPress={async () => {
            queryClient.removeQueries({
              queryKey: ["embeddedWallet"],
            });
            MultiInboxClient.instance.logoutMessagingClients();
            await privyLogout();
          }}
        />
      </VStack>
    </Center>
  );
};

export function SignedInNavigation() {
  return (
    <NativeStack.Navigator
      screenListeners={screenListeners("fullStackNavigation")}
    >
      <NativeStack.Group>
        {/* <NativeStack.Group screenOptions={stackGroupScreenOptions(colorScheme)}>
          <NativeStack.Screen name="Chats" component={ConversationListScreen} />
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
        </NativeStack.Group> */}
        <NativeStack.Group>
          <NativeStack.Screen
            name="FakeScreen"
            component={FakeScreen}
            options={{ headerShown: false }}
          />
        </NativeStack.Group>

        <NativeStack.Group>
          {/* {UserProfileNav()}
          <NativeStack.Screen
            name="AppSettings"
            component={AppSettingsScreen}
          /> */}
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
  const state = useAccountsStore();
  logger.debug(`[SignedOutNavigation] state`, state);

  return (
    <SignupWithPasskeyProvider>
      <NativeStack.Navigator
        screenListeners={screenListeners("fullStackNavigation")}
        initialRouteName="OnboardingWelcome"
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
    </SignupWithPasskeyProvider>
  );
}

const NewAccountStack = createNativeStackNavigator<NavigationParamList>();

const NewAccountNavigator = memo(function NewAccountNavigator() {
  const colorScheme = useColorScheme();

  const router = useRouter();
  const { logout: privyLogout } = usePrivy();

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
                onPress={() => {
                  router.goBack();
                  privyLogout();
                }}
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
