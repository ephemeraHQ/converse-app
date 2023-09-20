import { useColorScheme } from "react-native";

import { navigationSecondaryBackgroundColor } from "../../utils/colors";
import ShareProfileScreen from "../ShareProfile";
import { NativeStack, navigationAnimation } from "./Navigation";

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
        },
        animation: navigationAnimation,
      }}
    />
  );
}
