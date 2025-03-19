import { LinkingOptions, NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import * as Linking from "expo-linking"
import React, { memo, useEffect } from "react"
import { config } from "@/config"
import { AppSettingsScreen } from "@/features/app-settings/app-settings.screen"
import { useIsCurrentVersionEnough } from "@/features/app-settings/hooks/use-is-current-version-enough"
import { AuthOnboardingContactCardImportInfoScreen } from "@/features/auth-onboarding/screens/auth-onboarding-contact-card-import-info.screen"
import { AuthScreen } from "@/features/auth-onboarding/screens/auth-onboarding.screen"
import { useAuthenticationStore } from "@/features/authentication/authentication.store"
import { hydrateAuth } from "@/features/authentication/hydrate-auth"
import { useSignoutIfNoPrivyUser } from "@/features/authentication/use-logout-if-no-privy-user"
import { useRefreshJwtAxiosInterceptor } from "@/features/authentication/use-refresh-jwt.axios-interceptor"
import { BlockedConversationsScreen } from "@/features/blocked-conversations/blocked-conversations.screen"
import {
  ConversationNav,
  ConversationScreenConfig,
} from "@/features/conversation/conversation-chat/conversation.nav"
import { ConversationListScreen } from "@/features/conversation/conversation-list/conversation-list.screen"
import { ConversationRequestsListNav } from "@/features/conversation/conversation-requests-list/conversation-requests-list.nav"
import { useCreateUserIfNoExist } from "@/features/current-user/use-create-user-if-no-exist"
import { DeepLinkHandler } from "@/features/deep-linking/deep-link-handler.component"
import {
  AddGroupMembersNav,
  AddGroupMembersScreenConfig,
} from "@/features/groups/group-details/add-group-members/add-group-members.nav"
import {
  GroupDetailsNav,
  GroupDetailsScreenConfig,
} from "@/features/groups/group-details/group-details.nav"
import {
  GroupMembersListNav,
  GroupMembersListScreenConfig,
} from "@/features/groups/group-details/members-list/group-members-list.nav"
import { ProfileImportInfoScreen } from "@/features/profiles/profile-import-info.screen"
import { ProfileNav, ProfileScreenConfig } from "@/features/profiles/profile.nav"
import { NavigationParamList } from "@/navigation/navigation.types"
import { navigationRef } from "@/navigation/navigation.utils"
import { WebviewPreviewNav } from "@/screens/WebviewPreviewNav"
import { useAppTheme, useThemeProvider } from "@/theme/use-app-theme"
import { captureError } from "@/utils/capture-error"
import { useUpdateSentryUser } from "@/utils/sentry"
import { hideSplashScreen } from "@/utils/splash/splash"
import { ShareProfileNav, ShareProfileScreenConfig } from "../screens/ShareProfileNav"
import { getStateFromPath } from "@/features/deep-linking/navigation-handlers"

const prefix = Linking.createURL("/")
const schemes = [prefix, ...config.universalLinks]

// Add custom app URL schemes for each environment
if (config.scheme) {
  schemes.push(`${config.scheme}://`)
}

const linking: LinkingOptions<NavigationParamList> = {
  prefixes: schemes,
  config: {
    initialRouteName: "Chats",
    screens: {
      Chats: "/",
      Conversation: ConversationScreenConfig,
      Profile: ProfileScreenConfig,
      ShareProfile: ShareProfileScreenConfig,
      GroupDetails: GroupDetailsScreenConfig,
      AddGroupMembers: AddGroupMembersScreenConfig,
      GroupMembersList: GroupMembersListScreenConfig,
    },
  },
  getStateFromPath,
}

export function AppNavigator() {
  const { themeScheme, navigationTheme, setThemeContextOverride, ThemeProvider } =
    useThemeProvider()

  useUpdateSentryUser()
  useIsCurrentVersionEnough()
  useRefreshJwtAxiosInterceptor()
  useSignoutIfNoPrivyUser()
  useCreateUserIfNoExist()

  // Hydrate auth when the app is loaded
  useEffect(() => {
    hydrateAuth().catch(captureError)
  }, [])

  return (
    <>
      <ThemeProvider value={{ themeScheme, setThemeContextOverride }}>
        <NavigationContainer<NavigationParamList>
          theme={navigationTheme}
          linking={linking}
          ref={navigationRef}
          onUnhandledAction={() => {
            // Since we're handling multiple navigators,
            // let's silence errors when the action
            // is not meant for this one
          }}
        >
          <DeepLinkHandler />
          <AppStacks />
        </NavigationContainer>
      </ThemeProvider>
    </>
  )
}

export const AppNativeStack = createNativeStackNavigator<NavigationParamList>()

const AppStacks = memo(function AppStacks() {
  const { theme } = useAppTheme()

  const authStatus = useAuthenticationStore((state) => state.status)

  useEffect(() => {
    if (authStatus !== "undetermined") {
      hideSplashScreen().catch(captureError)
    }
  }, [authStatus])

  const isUndetermined = authStatus === "undetermined"
  // const isOnboarding = authStatus === "onboarding"
  const isSignedOut = authStatus === "signedOut"

  return (
    <AppNativeStack.Navigator
      screenOptions={{
        // Since we handle with useHeader hook
        header: () => null,
      }}
    >
      {isUndetermined ? (
        // Show idle screen during restoration
        <AppNativeStack.Screen
          name="Idle"
          component={IdleScreen}
          // Fade animation for auth state changes
          options={{ animation: "fade" }}
        />
      ) : isSignedOut ? (
        <AppNativeStack.Group>
          <AppNativeStack.Screen
            name="Auth"
            component={AuthScreen}
            // Fade animation when transitioning to signed out state
            options={{ animation: "fade" }}
          />
          <AppNativeStack.Screen
            name="OnboardingCreateContactCardImportName"
            component={AuthOnboardingContactCardImportInfoScreen}
            options={{
              presentation: "formSheet",
              sheetAllowedDetents: [0.5],
              // sheetCornerRadius: theme.borderRadius.sm, // Not sure why but adding this breaks the animation between different height transitions
              contentStyle: {
                backgroundColor: theme.colors.background.raised,
              },
            }}
          />
        </AppNativeStack.Group>
      ) : (
        //  : isOnboarding ? (
        //   <AppNativeStack.Group>
        //     <AppNativeStack.Screen
        //       name="OnboardingCreateContactCard"
        //       component={OnboardingContactCardScreen}
        //       // Fade animation when transitioning to onboarding state
        //       options={{ animation: "fade" }}
        //     />

        //     {/* <NativeStack.Screen
        //       name="OnboardingNotifications"
        //       component={OnboardingNotificationsScreen}
        //     /> */}
        //   </AppNativeStack.Group>
        // )
        // Main app screens
        <AppNativeStack.Group>
          <AppNativeStack.Screen
            name="Chats"
            component={ConversationListScreen}
            // Fade animation when transitioning to authenticated state
            options={{ animation: "fade" }}
          />
          <AppNativeStack.Screen name="Blocked" component={BlockedConversationsScreen} />
          {ConversationRequestsListNav()}
          {ConversationNav()}
          {ShareProfileNav()}
          {WebviewPreviewNav()}
          {ProfileNav()}
          {GroupDetailsNav()}
          {AddGroupMembersNav()}
          {GroupMembersListNav()}
          <AppNativeStack.Screen
            name="ProfileImportInfo"
            component={ProfileImportInfoScreen}
            options={{
              presentation: "formSheet",
              sheetAllowedDetents: [0.5],
              // sheetCornerRadius: theme.borderRadius.sm, // Not sure why but adding this breaks the animation between different height transitions
              contentStyle: {
                backgroundColor: theme.colors.background.raised,
              },
            }}
          />
          <AppNativeStack.Screen name="AppSettings" component={AppSettingsScreen} />
        </AppNativeStack.Group>
      )}
    </AppNativeStack.Navigator>
  )
})

// TODO: Maybe show animated splash screen or something
function IdleScreen() {
  return null
}
