import { Platform, useColorScheme } from "react-native";

import { headerTitleStyle, textSecondaryColor } from "../../utils/colors";
import GroupLinkScreen from "../GroupLink";
import { NativeStack, navigationAnimation } from "./Navigation";

export type GroupLinkNavParams = {
  groupLinkId: string;
};

export const GroupLinkScreenConfig = {
  path: "/groupLink/:groupLinkId",
};

export default function GroupLinkNav() {
  const colorScheme = useColorScheme();
  return (
    <NativeStack.Screen
      name="GroupLink"
      component={GroupLinkScreen}
      options={({ route }) => ({
        headerTitle: "Loading...",
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
