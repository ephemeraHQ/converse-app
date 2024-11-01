import ExternalWalletPicker from "@components/ExternalWalletPicker";
import { ScreenHeaderModalCloseButton } from "@components/Screen/ScreenHeaderModalCloseButton";
import { useAuthStatus } from "@data/store/authStore";
import { textSizeStyles } from "@design-system/Text/Text.styles";
import { ConversationListScreen } from "@features/Conversation/ConversationList/ConversationList.screen";
import { useRouter } from "@navigation/useNavigation";
import { LinkingOptions, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Accounts from "@screens/Accounts/Accounts";
import ConversationBlockedListNav from "@screens/Navigation/ConversationBlockedListNav";
import ConversationNav from "@screens/Navigation/ConversationNav";
import ConversationRequestsListNav from "@screens/Navigation/ConversationRequestsListNav";
import ConverseMatchMakerNav from "@screens/Navigation/ConverseMatchMakerNav";
import GroupInviteNav from "@screens/Navigation/GroupInviteNav";
import GroupLinkNav from "@screens/Navigation/GroupLinkNav";
import GroupNav from "@screens/Navigation/GroupNav";
import ProfileNav from "@screens/Navigation/ProfileNav";
import ShareFrameNav from "@screens/Navigation/ShareFrameNav";
import TopUpNav from "@screens/Navigation/TopUpNav";
import UserProfileNav from "@screens/Navigation/UserProfileNav";
import WebviewPreviewNav from "@screens/Navigation/WebviewPreviewNav";
import { NewAccountUserProfileScreen } from "@screens/NewAccount/NewAccountUserProfileScreen";
import NewConversationModal from "@screens/NewConversation/NewConversationModal";
import { ShareProfileScreen } from "@screens/ShareProfile";
import * as Linking from "expo-linking";
import React, { memo, useEffect } from "react";
import { Platform } from "react-native";
import { TransactionPreview } from "../components/TransactionPreview/TransactionPreview";
import config from "../config";
import { ConversationScreenConfig } from "../screens/Navigation/ConversationNav";
import { GroupInviteScreenConfig } from "../screens/Navigation/GroupInviteNav";
import { GroupLinkScreenConfig } from "../screens/Navigation/GroupLinkNav";
import { GroupScreenConfig } from "../screens/Navigation/GroupNav";
import { NewConversationScreenConfig } from "../screens/Navigation/NewConversationNav";
import { ProfileScreenConfig } from "../screens/Navigation/ProfileNav";
import { ShareProfileScreenConfig } from "../screens/Navigation/ShareProfileNav";
import { WebviewPreviewScreenConfig } from "../screens/Navigation/WebviewPreviewNav";
import {
  getConverseInitialURL,
  getConverseStateFromPath,
  navigationRef,
  screenListeners,
} from "../screens/Navigation/navHelpers";
import { OnboardingConnectWalletScreen } from "../screens/Onboarding/OnboardingConnectWalletScreen";
import { OnboardingEphemeraScreen } from "../screens/Onboarding/OnboardingEphemeraScreen";
import { OnboardingGetStartedScreen } from "../screens/Onboarding/OnboardingGetStartedScreen";
import { OnboardingNotificationsScreen } from "../screens/Onboarding/OnboardingNotificationsScreen";
import { OnboardingPrivateKeyScreen } from "../screens/Onboarding/OnboardingPrivateKeyScreen";
import { OnboardingPrivyScreen } from "../screens/Onboarding/OnboardingPrivyScreen";
import { OnboardingUserProfileScreen } from "../screens/Onboarding/OnboardingUserProfileScreen";
import { useAppTheme, useThemeProvider } from "../theme/useAppTheme";
import { NewAccountNavigator } from "./NewAccountNavigator";

const prefix = Linking.createURL("/");

const linking: LinkingOptions<NavigationParamList> = {
  prefixes: [prefix, ...config.universalLinks],
  config: {
    initialRouteName: "Chats",
    screens: {
      Chats: "/",
      Conversation: ConversationScreenConfig,
      NewConversation: NewConversationScreenConfig,
      Profile: ProfileScreenConfig,
      Group: GroupScreenConfig,
      GroupLink: GroupLinkScreenConfig,
      GroupInvite: GroupInviteScreenConfig,
      ShareProfile: ShareProfileScreenConfig,
      WebviewPreview: WebviewPreviewScreenConfig,
      NewAccount: {
        screens: {},
      },
    },
  },
  getStateFromPath: getConverseStateFromPath,
  getInitialURL: getConverseInitialURL,
};

export function AppNavigator() {
  const {
    themeScheme,
    navigationTheme,
    setThemeContextOverride,
    ThemeProvider,
  } = useThemeProvider();

  const authStatus = useAuthStatus();

  // TODO: Remove this logic when we refactor all navigation to be able to render stack screen depending on the authStatus
  if (authStatus === "idle") {
    return null;
  }

  return (
    <>
      <ThemeProvider value={{ themeScheme, setThemeContextOverride }}>
        <NavigationContainer
          theme={navigationTheme}
          linking={linking}
          ref={navigationRef}
        >
          <AppStack />
        </NavigationContainer>
        {/* TODO: this should be closer to where it's used maybe?  */}
        <ExternalWalletPicker />
        <TransactionPreview />
      </ThemeProvider>
    </>
  );
}

export const NativeStack = createNativeStackNavigator<NavigationParamList>();

const AppStack = memo(() => {
  const { theme } = useAppTheme();

  const router = useRouter();

  const authStatus = useAuthStatus();

  // TODO: Remove this logic once we refactored all navigation to be able to render stack screen depending on the authStatus
  useEffect(() => {
    if (authStatus) {
      navigationRef.current?.resetRoot({
        index: 0,
        routes: [{ name: "Chats" }],
      });
    } else if (authStatus === "signedOut") {
      navigationRef.current?.resetRoot({
        index: 0,
        routes: [{ name: "OnboardingGetStarted" }],
      });
    }
  }, [authStatus]);

  return (
    <NativeStack.Navigator
      screenOptions={{
        navigationBarColor: theme.colors.background.raised,
        contentStyle: {
          backgroundColor: theme.colors.background.raised,
        },
        // All header style will go away once we refactored all navigations to use our Header component
        headerTitle: "",
        headerBackTitle: "Back",
        headerBackTitleVisible: true,
        headerShadowVisible: Platform.OS !== "android",
        headerStyle: {
          backgroundColor: theme.colors.background.surface,
        },
        headerTitleStyle: {
          fontSize: textSizeStyles.sm.fontSize,
          fontWeight: 600,
          color: theme.colors.text.primary,
        },
        headerTintColor:
          Platform.OS === "ios" ? theme.colors.text.primary : undefined,
      }}
      initialRouteName={authStatus ? "Chats" : "OnboardingGetStarted"}
      screenListeners={screenListeners}
    >
      <NativeStack.Group>
        <NativeStack.Screen
          name="OnboardingGetStarted"
          component={OnboardingGetStartedScreen}
          options={{
            headerShown: false,
          }}
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

      <NativeStack.Screen name="Chats" component={ConversationListScreen} />

      <NativeStack.Group>
        {ConversationRequestsListNav()}
        {ConversationBlockedListNav()}
        {ConversationNav()}
        {ConverseMatchMakerNav()}
        {ShareFrameNav()}
        {WebviewPreviewNav()}
        {ProfileNav()}
        {GroupNav()}
        {GroupLinkNav()}
        {GroupInviteNav()}
        {TopUpNav()}
      </NativeStack.Group>

      {/* Modals */}
      <NativeStack.Group
        screenOptions={{
          presentation: "modal",
        }}
      >
        {UserProfileNav()}
        <NativeStack.Screen
          name="NewConversation"
          component={NewConversationModal}
          options={{
            headerShown: false,
          }}
        />
        <NativeStack.Screen
          name="ShareProfile"
          component={ShareProfileScreen}
        />
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
            headerTitle: "Modify profile",
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

      {/* New account */}
      <NativeStack.Screen name="NewAccount" component={NewAccountNavigator} />
    </NativeStack.Navigator>
  );
});
