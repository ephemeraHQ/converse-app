import { navigationSecondaryBackgroundColor } from "@styles/colors";
import { useColorScheme } from "react-native";

import { NativeStack, navigationAnimation } from "./Navigation";
import TopUpScreen from "../TopUp";

export default function TopUpNav() {
  const colorScheme = useColorScheme();
  return (
    <NativeStack.Screen
      name="TopUp"
      component={TopUpScreen}
      options={{
        headerTitle: "Top up",
        presentation: "modal",
        headerStyle: {
          backgroundColor: navigationSecondaryBackgroundColor(colorScheme),
        } as any,
        animation: navigationAnimation,
      }}
    />
  );
}
