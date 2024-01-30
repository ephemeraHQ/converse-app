import { Platform, useColorScheme } from "react-native";

import {
  listItemSeparatorColor,
  navigationSecondaryBackgroundColor,
} from "../../utils/colors";
import ShareProfileScreen from "../ShareProfile";
import { NativeStack, navigationAnimation } from "./Navigation";

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
