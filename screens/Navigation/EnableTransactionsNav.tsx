import { navigationSecondaryBackgroundColor } from "@styles/colors";
import { useColorScheme } from "react-native";

import { NativeStack, navigationAnimation } from "./Navigation";
import EnableTransactionsScreen from "../EnableTransactions";

export default function EnableTransactionsNav() {
  const colorScheme = useColorScheme();
  return (
    <NativeStack.Screen
      name="EnableTransactions"
      component={EnableTransactionsScreen}
      options={{
        headerTitle: "Enable transactions",
        presentation: "modal",
        headerStyle: {
          backgroundColor: navigationSecondaryBackgroundColor(colorScheme),
        },
        animation: navigationAnimation,
      }}
    />
  );
}
