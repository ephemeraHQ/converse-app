import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { memo } from "react";
import { useColorScheme } from "react-native";

import { authScreensSharedScreenOptions } from "./Navigation";
import { stackGroupScreenOptions } from "./navHelpers";
import { OnboardingConnectWalletScreen } from "../screens/Onboarding/OnboardingConnectWalletScreen";
import { OnboardingEphemeraScreen } from "../screens/Onboarding/OnboardingEphemeraScreen";
import { OnboardingGetStartedScreen } from "../screens/Onboarding/OnboardingGetStartedScreen";
import { OnboardingNotificationsScreen } from "../screens/Onboarding/OnboardingNotificationsScreen";
import { OnboardingPrivateKeyScreen } from "../screens/Onboarding/OnboardingPrivateKeyScreen";
import { OnboardingPrivyScreen } from "../screens/Onboarding/OnboardingPrivyScreen";
import { OnboardingUserProfileScreen } from "../screens/Onboarding/OnboardingUserProfileScreen";

export type OnboardingParamList = {
  OnboardingGetStarted: undefined;
  OnboardingPrivy: undefined;
  OnboardingConnectWallet: {
    address: string;
  };
  OnboardingNotifications: undefined;
  OnboardingUserProfile: undefined;
  OnboardingPrivateKey: undefined;
  OnboardingEphemeral: undefined;
};

const OnboardingNativeStack = createNativeStackNavigator<OnboardingParamList>();

export const OnboardingNavigator = memo(function OnboardingNavigator() {
  const colorScheme = useColorScheme();

  return (
    <OnboardingNativeStack.Navigator>
      {/* Auth / Onboarding */}
      <OnboardingNativeStack.Group
        screenOptions={{
          ...stackGroupScreenOptions(colorScheme),
          ...authScreensSharedScreenOptions,
        }}
      >
        <OnboardingNativeStack.Screen
          options={{
            headerShown: false,
          }}
          name="OnboardingGetStarted"
          component={OnboardingGetStartedScreen}
        />
        <OnboardingNativeStack.Screen
          name="OnboardingPrivy"
          component={OnboardingPrivyScreen}
        />
        <OnboardingNativeStack.Screen
          name="OnboardingConnectWallet"
          component={OnboardingConnectWalletScreen}
        />
        <OnboardingNativeStack.Screen
          name="OnboardingNotifications"
          component={OnboardingNotificationsScreen}
        />
        <OnboardingNativeStack.Screen
          name="OnboardingUserProfile"
          component={OnboardingUserProfileScreen}
        />
        <OnboardingNativeStack.Screen
          name="OnboardingPrivateKey"
          component={OnboardingPrivateKeyScreen}
        />
        <OnboardingNativeStack.Screen
          name="OnboardingEphemeral"
          component={OnboardingEphemeraScreen}
        />
      </OnboardingNativeStack.Group>
    </OnboardingNativeStack.Navigator>
  );
});
