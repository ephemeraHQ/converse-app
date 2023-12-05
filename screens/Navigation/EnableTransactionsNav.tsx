import { useColorScheme } from "react-native";

import { navigationSecondaryBackgroundColor } from "../../utils/colors";
import EnableTransactionsScreen from "../EnableTransactions";
import { NativeStack, navigationAnimation } from "./Navigation";

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
