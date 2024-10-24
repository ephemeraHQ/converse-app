import { backgroundColor } from "@styles/colors";
import { useColorScheme } from "react-native";

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
        headerTitle: "",
        presentation: "modal",
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: backgroundColor(colorScheme),
        } as any,
        animation: navigationAnimation,
      }}
    />
  );
}
