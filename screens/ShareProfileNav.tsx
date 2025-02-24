import { AppNativeStack } from "@/navigation/app-navigator";
import { ShareProfileScreen } from "./ShareProfile";

export const ShareProfileScreenConfig = {
  path: "/shareProfile",
};

export function ShareProfileNav() {
  return (
    <AppNativeStack.Screen
      options={{ presentation: "modal" }}
      name="ShareProfile"
      component={ShareProfileScreen}
    />
  );
}
