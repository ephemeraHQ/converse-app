import {
  NativeStack,
  navigationAnimation,
} from "@screens/Navigation/Navigation";
import {
  headerTitleStyle,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { Platform, useColorScheme } from "react-native";

import GroupInviteScreen from "./GroupInviteScreen.old.screen";

export type GroupInviteNavParams = {
  groupInviteId: string;
};

export const GroupInviteScreenConfig = {
  path: "/group-invite/:groupInviteId",
};

export function GroupInviteNavigation() {
  const colorScheme = useColorScheme();
  return (
    <NativeStack.Screen
      name="GroupInvite"
      component={GroupInviteScreen}
      options={({ route }) => ({
        headerShadowVisible: false,
        headerTitle: "",
        headerTintColor:
          Platform.OS === "android" || Platform.OS === "web"
            ? textSecondaryColor(colorScheme)
            : textPrimaryColor(colorScheme),
        animation: navigationAnimation,
        headerTitleStyle: headerTitleStyle(colorScheme),
      })}
    />
  );
}
