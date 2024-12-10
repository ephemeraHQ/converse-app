import {
  headerTitleStyle,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { Platform, useColorScheme } from "react-native";

import { NativeStack, navigationAnimation } from "./Navigation";
import GroupScreen from "../Group";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { translate } from "@/i18n";

export type GroupNavParams = {
  topic: ConversationTopic;
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
        headerTitle: translate("group_info"),
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
