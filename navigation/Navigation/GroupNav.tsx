import {
  headerTitleStyle,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { Platform, useColorScheme } from "react-native";

import GroupScreen from "../../screens/Group";
import { NativeStack, navigationAnimation } from "../Navigation";

export type GroupNavParams = {
  topic: string;
};

export const GroupScreenConfig = {
  path: "/group",
};

export default function GroupNav() {
  const colorScheme = useColorScheme();
  return (
    <NativeStack.Screen
      name="Group"
      component={GroupScreen}
      options={({ route }) => ({
        headerTitle: "Group info",
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
