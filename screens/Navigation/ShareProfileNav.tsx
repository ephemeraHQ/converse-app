import { ShareProfileScreen } from "../ShareProfile";
import { NativeStack, navigationAnimation } from "./Navigation";

export const ShareProfileScreenConfig = {
  path: "/shareProfile",
};

export function ShareProfileNav() {
  return (
    <NativeStack.Screen
      name="ShareProfile"
      component={ShareProfileScreen}
      options={{
        headerTitle: "",
        presentation: "modal",
        headerShadowVisible: false,
        animation: navigationAnimation,
      }}
    />
  );
}
