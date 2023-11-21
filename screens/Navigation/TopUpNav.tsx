import { useColorScheme } from "react-native";

import { navigationSecondaryBackgroundColor } from "../../utils/colors";
import TopUpScreen from "../TopUp";
import { NativeStack, navigationAnimation } from "./Navigation";

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
        },
        animation: navigationAnimation,
      }}
    />
  );
}
