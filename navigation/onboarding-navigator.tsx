import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { memo } from "react";
import { useColorScheme } from "react-native";

import { authScreensSharedScreenOptions } from "../screens/Navigation/Navigation";
import { stackGroupScreenOptions } from "../screens/Navigation/navHelpers";
import { OnboardingConnectWalletScreen } from "../features/onboarding/screens/OnboardingConnectWalletScreen";
import { OnboardingEphemeraScreen } from "../features/onboarding/screens/OnboardingEphemeraScreen";
import { OnboardingNotificationsScreen } from "../features/onboarding/screens/onboarding-notifications-screen";
import { OnboardingPrivateKeyScreen } from "../features/onboarding/screens/OnboardingPrivateKeyScreen";
import { OnboardingPrivyScreen } from "../features/onboarding/screens/OnboardingPrivyScreen";
import { OnboardingWelcomeScreen } from "@/features/onboarding/screens/onboarding-welcome-screen";
import { OnboardingContactCardScreen } from "@/features/onboarding/screens/onboarding-contact-card-screen";

type OnboardingParamList = {
  OnboardingWelcome: undefined;
  OnboardingCreateContactCard: undefined;

  OnboardingGetStarted: undefined;
  OnboardingPrivy: undefined;
  OnboardingConnectWallet: {
    address: string;
  };
  OnboardingNotifications: undefined;
  OnboardingPrivateKey: undefined;
  OnboardingEphemeral: undefined;
};

const OnboardingNativeStack = createNativeStackNavigator<OnboardingParamList>();

/**
 * Used for split screen layout
 */
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
          name="OnboardingWelcome"
          component={OnboardingWelcomeScreen}
        />
        <OnboardingNativeStack.Screen
          options={{
            headerShown: false,
          }}
          name="OnboardingCreateContactCard"
          component={OnboardingContactCardScreen}
        />
        <OnboardingNativeStack.Screen
          name="OnboardingNotifications"
          component={OnboardingNotificationsScreen}
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
