import { AppNativeStack } from "@/navigation/app-navigator";
import { ShareProfileScreen } from "./ShareProfile";

export const ShareProfileScreenConfig = {
  path: "/shareProfile",
};

export function ShareProfileNav() {
  return (
    <AppNativeStack.Screen name="ShareProfile" component={ShareProfileScreen} />
  );
}
