import {
  listItemSeparatorColor,
  navigationSecondaryBackgroundColor,
} from "@styles/colors";
import { Platform, useColorScheme } from "react-native";

import { NativeStack, navigationAnimation } from "./Navigation";
import ConverseMatchMaker from "../ConverseMatchMaker";

export default function ConverseMatchMakerNav() {
  const colorScheme = useColorScheme();
  return (
    <NativeStack.Screen
      name="ConverseMatchMaker"
      component={ConverseMatchMaker}
      options={{
        headerTitle: "Converse Match Maker",
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
