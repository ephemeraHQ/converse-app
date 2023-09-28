import { Platform, useColorScheme } from "react-native";

import { textSecondaryColor } from "../../utils/colors";
import ProfileScreen from "../Profile";
import { NativeStack, navigationAnimation } from "./Navigation";

export default function ProfileNav() {
  const colorScheme = useColorScheme();
  return (
    <NativeStack.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        headerTitle: "Contact details",
        headerTintColor:
          Platform.OS === "android"
            ? textSecondaryColor(colorScheme)
            : undefined,
        animation: navigationAnimation,
      }}
    />
  );
}
