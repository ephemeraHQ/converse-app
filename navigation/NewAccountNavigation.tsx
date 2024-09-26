import UserProfile from "@components/Onboarding/UserProfile";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { stackGroupScreenOptions } from "@screens/Navigation/navHelpers";
import NotificationsScreen from "@screens/NotificationsScreen";
import Onboarding from "@screens/Onboarding";
import React from "react";
import { useColorScheme } from "react-native";

export type NewAccountStackParamList = {
  Onboarding: undefined;
  Notifications: undefined;
  Profile: undefined;
};

const NewAccountStack = createNativeStackNavigator<NewAccountStackParamList>();

export default function NewAccountNavigation() {
  const colorScheme = useColorScheme();

  return (
    <NewAccountStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <NewAccountStack.Group
        screenOptions={stackGroupScreenOptions(colorScheme)}
      >
        <NewAccountStack.Screen name="Onboarding" component={Onboarding} />
        <NewAccountStack.Screen
          name="Notifications"
          component={NotificationsScreen}
        />
        <NewAccountStack.Screen name="Profile" component={UserProfile} />
      </NewAccountStack.Group>
    </NewAccountStack.Navigator>
  );
}
