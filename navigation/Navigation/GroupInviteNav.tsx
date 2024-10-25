import GroupInviteScreen from "@screens/GroupInvite";
import {
  headerTitleStyle,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { Platform, useColorScheme } from "react-native";

import { NativeStack, navigationAnimation } from "../Navigation";

export type GroupInviteNavParams = {
  groupInviteId: string;
};

export const GroupInviteScreenConfig = {
  path: "/group-invite/:groupInviteId",
};

export default function GroupInviteNav() {
  const colorScheme = useColorScheme();
  return (
    <NativeStack.Screen
      name="GroupInvite"
      component={GroupInviteScreen}
      options={({ route }) => ({
        headerShadowVisible: false,
        headerTitle: "",
        headerTintColor:
          Platform.OS === "android"
            ? textSecondaryColor(colorScheme)
            : textPrimaryColor(colorScheme),
        animation: navigationAnimation,
        headerTitleStyle: headerTitleStyle(colorScheme),
      })}
    />
  );
}
