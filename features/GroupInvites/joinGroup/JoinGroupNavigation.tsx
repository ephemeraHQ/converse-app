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

import { JoinGroupScreen } from "./JoinGroup.screen";
import { stackGroupScreenOptions } from "@/screens/Navigation/navHelpers";

export type JoinGroupNavigationParams = {
  groupInviteId: string;
};

export const JoinGroupScreenConfig = {
  path: "/group-invite/:groupInviteId",
};

export function JoinGroupNavigation() {
  const colorScheme = useColorScheme();

  return (
    <NativeStack.Group screenOptions={stackGroupScreenOptions(colorScheme)}>
      <NativeStack.Screen
        name="GroupInvite"
        component={JoinGroupScreen}
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
    </NativeStack.Group>
  );
}
