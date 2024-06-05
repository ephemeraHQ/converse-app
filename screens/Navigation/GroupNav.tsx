import { Platform, useColorScheme } from "react-native";

import { headerTitleStyle, textSecondaryColor } from "../../utils/colors";
import GroupScreen from "../Group";
import { NativeStack, navigationAnimation } from "./Navigation";

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
            : undefined,
        animation: navigationAnimation,
        headerTitleStyle: headerTitleStyle(colorScheme),
      })}
    />
  );
}
