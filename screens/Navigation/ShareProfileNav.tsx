import {
  listItemSeparatorColor,
  navigationSecondaryBackgroundColor,
} from "@styles/colors";
import { Platform, useColorScheme } from "react-native";

import { NativeStack, navigationAnimation } from "./Navigation";
import ShareProfileScreen from "../ShareProfile";

export const ShareProfileScreenConfig = {
  path: "/shareProfile",
};

export default function ShareProfileNav() {
  const colorScheme = useColorScheme();
  return (
    <NativeStack.Screen
      name="ShareProfile"
      component={ShareProfileScreen}
      options={{
        headerTitle: "Your Converse link",
        presentation: "modal",
        headerStyle: {
          backgroundColor: navigationSecondaryBackgroundColor(colorScheme),
          borderBottomColor:
            Platform.OS === "web"
              ? listItemSeparatorColor(colorScheme)
              : undefined,
        } as any,
        animation: navigationAnimation,
      }}
    />
  );
}
