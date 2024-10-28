import {
  headerTitleStyle,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { Platform, useColorScheme } from "react-native";

import { NativeStack, navigationAnimation } from "./Navigation";
import GroupLinkScreen from "../GroupLink";

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
          Platform.OS === "android"
            ? textSecondaryColor(colorScheme)
            : textPrimaryColor(colorScheme),
        animation: navigationAnimation,
        headerTitleStyle: headerTitleStyle(colorScheme),
      })}
    />
  );
}
