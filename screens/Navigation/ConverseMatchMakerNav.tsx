import { navigationSecondaryBackgroundColor } from "@styles/colors";
import { useColorScheme } from "react-native";

import ConverseMatchMaker from "../ConverseMatchMaker";
import { NativeStack, navigationAnimation } from "./Navigation";

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
        } as any,
        animation: navigationAnimation,
      }}
    />
  );
}
