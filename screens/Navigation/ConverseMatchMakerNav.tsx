import { navigationSecondaryBackgroundColor } from "@styles/colors";
import { useColorScheme } from "react-native";

import ConverseMatchMaker from "../ConverseMatchMaker";
import { NativeStack, navigationAnimation } from "./Navigation";
import { translate } from "@/i18n";

export default function ConverseMatchMakerNav() {
  const colorScheme = useColorScheme();
  return (
    <NativeStack.Screen
      name="ConverseMatchMaker"
      component={ConverseMatchMaker}
      options={{
        headerTitle: translate("converse_match_maker"),
        presentation: "modal",
        headerStyle: {
          backgroundColor: navigationSecondaryBackgroundColor(colorScheme),
        } as any,
        animation: navigationAnimation,
      }}
    />
  );
}
