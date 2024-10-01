import UserProfile from "@components/Onboarding/UserProfile";
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from "@react-navigation/native-stack";
import { stackGroupScreenOptions } from "@screens/Navigation/navHelpers";
import { NotificationsScreen } from "@screens/NotificationsScreen";
import { ConnectWalletScreen } from "@screens/Onboarding/ConnectWalletScreen";
import { EphemeraLoginScreen } from "@screens/Onboarding/EphemeraLoginScreen";
import { GetStartedScreen } from "@screens/Onboarding/GetStartedScreen";
import { PrivyConnectScreen } from "@screens/Onboarding/PrivyConnectScreen";
import React from "react";
import { useColorScheme } from "react-native";

import { colors } from "../theme";

export type AuthStackParamList = {
  GetStarted: undefined;
  PrivyConnect: undefined;
  ConnectWallet: undefined;
  Notifications: undefined;
  EphemeralLogin: undefined;
  Profile: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigation() {
  const colorScheme = useColorScheme();

  return (
    <AuthStack.Navigator
      screenOptions={{
        contentStyle: {
          backgroundColor: colors.background,
        },
        // headerShown: false,
      }}
    >
      <AuthStack.Group screenOptions={stackGroupScreenOptions(colorScheme)}>
        <AuthStack.Screen
          options={{
            headerShown: false,
          }}
          name="GetStarted"
          component={GetStartedScreen}
        />
        <AuthStack.Screen
          options={sharedScreenOptions}
          name="PrivyConnect"
          component={PrivyConnectScreen}
        />
        <AuthStack.Screen
          name="ConnectWallet"
          options={sharedScreenOptions}
          component={ConnectWalletScreen}
        />
        <AuthStack.Screen
          name="Notifications"
          options={sharedScreenOptions}
          component={NotificationsScreen}
        />
        <AuthStack.Screen name="Profile" component={UserProfile} />
        <AuthStack.Screen
          options={sharedScreenOptions}
          name="EphemeralLogin"
          component={EphemeraLoginScreen}
        />
      </AuthStack.Group>
    </AuthStack.Navigator>
  );
}

const sharedScreenOptions: NativeStackNavigationOptions = {
  headerTitle: "",
  headerBackTitle: "Back",
  headerBackTitleVisible: false,
  headerShadowVisible: false,
};
