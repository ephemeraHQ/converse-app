import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { Platform, useColorScheme } from "react-native";

import { useCurrentAccount } from "../../data/store/accountsStore";
import { textSecondaryColor } from "../../utils/colors";
import ProfileScreen from "../Profile";
import { NativeStack, navigationAnimation } from "./Navigation";

export type ProfileNavParams = {
  address: string;
  fromGroup?: boolean;
};

export const ProfileScreenConfig = {
  path: "/profile",
};

export default function ProfileNav() {
  const colorScheme = useColorScheme();
  const account = useCurrentAccount();
  const options: NativeStackNavigationOptions = {
    headerTintColor:
      Platform.OS === "android" || Platform.OS === "web"
        ? textSecondaryColor(colorScheme)
        : undefined,
    animation: navigationAnimation,
  };
  if (Platform.OS === "web") {
    options.headerTitleStyle = { left: -20 } as any;
  }
  return (
    <NativeStack.Screen
      name="Profile"
      component={ProfileScreen}
      options={({ route }) => ({
        headerTitle:
          route.params.address === account ? "Profile" : "Contact details",
        ...options,
      })}
    />
  );
}
