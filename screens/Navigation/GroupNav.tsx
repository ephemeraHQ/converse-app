import {
  headerTitleStyle,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { Platform, useColorScheme } from "react-native";

import { NativeStack, navigationAnimation } from "./Navigation";
import GroupScreen from "../Group";

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
          Platform.OS === "android" || Platform.OS === "web"
            ? textSecondaryColor(colorScheme)
            : textPrimaryColor(colorScheme),
        animation: navigationAnimation,
        headerTitleStyle: headerTitleStyle(colorScheme),
      })}
    />
  );
}
