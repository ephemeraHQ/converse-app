import UserProfile from "@components/Onboarding/UserProfile";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { stackGroupScreenOptions } from "@screens/Navigation/navHelpers";
import NotificationsScreen from "@screens/NotificationsScreen";
import ConnectWalletScreen from "@screens/Onboarding/ConnectWalletScreen";
import EphemeralLoginScreen from "@screens/Onboarding/EphemeraLoginScreen";
import GetStartedScreen from "@screens/Onboarding/GetStartedScreen";
import PhoneLoginScreen from "@screens/Onboarding/PhoneLoginScreen";
import PrivyConnectScreen from "@screens/Onboarding/PrivyConnectScreen";
import React from "react";
import { useColorScheme } from "react-native";

export type AuthStackParamList = {
  GetStarted: undefined;
  PrivyConnect: undefined;
  ConnectWallet: undefined;
  Notifications: undefined;
  EphemeralLogin: undefined;
  Profile: undefined;
  PhoneLogin: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigation() {
  const colorScheme = useColorScheme();

  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Group screenOptions={stackGroupScreenOptions(colorScheme)}>
        <AuthStack.Screen name="GetStarted" component={GetStartedScreen} />
        <AuthStack.Screen name="PrivyConnect" component={PrivyConnectScreen} />
        <AuthStack.Screen
          name="ConnectWallet"
          component={ConnectWalletScreen}
        />
        <AuthStack.Screen
          name="Notifications"
          component={NotificationsScreen}
        />
        <AuthStack.Screen name="Profile" component={UserProfile} />
        <AuthStack.Screen name="PhoneLogin" component={PhoneLoginScreen} />
        <AuthStack.Screen
          name="EphemeralLogin"
          component={EphemeralLoginScreen}
        />
      </AuthStack.Group>
    </AuthStack.Navigator>
  );
}
