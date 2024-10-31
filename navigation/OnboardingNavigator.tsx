import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { memo } from "react";

import { authScreensSharedScreenOptions } from "../screens/Navigation/Navigation";
import { stackGroupScreenOptions } from "../screens/Navigation/navHelpers";
import { OnboardingConnectWalletScreen } from "../screens/Onboarding/OnboardingConnectWalletScreen";
import { OnboardingEphemeraScreen } from "../screens/Onboarding/OnboardingEphemeraScreen";
import { OnboardingGetStartedScreen } from "../screens/Onboarding/OnboardingGetStartedScreen";
import { OnboardingNotificationsScreen } from "../screens/Onboarding/OnboardingNotificationsScreen";
import { OnboardingPrivateKeyScreen } from "../screens/Onboarding/OnboardingPrivateKeyScreen";
import { OnboardingPrivyScreen } from "../screens/Onboarding/OnboardingPrivyScreen";
import { OnboardingUserProfileScreen } from "../screens/Onboarding/OnboardingUserProfileScreen";

type OnboardingParamList = {
  OnboardingGetStarted: undefined;
  OnboardingPrivy: undefined;
  OnboardingNotifications: undefined;
  OnboardingUserProfile: undefined;
  OnboardingPrivateKey: undefined;
  OnboardingEphemeral: undefined;
  OnboardingConnectWallet: {
    address: string;
  };
};
const OnboardingNativeStack = createNativeStackNavigator<OnboardingParamList>();

export const OnboardingNavigator = memo(function OnboardingNavigator() {
  return (
    <OnboardingNativeStack.Navigator>
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
