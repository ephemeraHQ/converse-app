import { Platform, useColorScheme } from "react-native";

import { useCurrentAccount } from "../../data/store/accountsStore";
import { textSecondaryColor } from "../../utils/colors";
import ProfileScreen from "../Profile";
import { NativeStack, navigationAnimation } from "./Navigation";

export type ProfileNavParams = {
  address: string;
};

export const ProfileScreenConfig = {
  path: "/profile",
};

export default function ProfileNav() {
  const colorScheme = useColorScheme();
  const account = useCurrentAccount();
  return (
    <NativeStack.Screen
      name="Profile"
      component={ProfileScreen}
      options={({ route }) => ({
        headerTitle:
          route.params.address === account ? "Profile" : "Contact details",
        headerTintColor:
          Platform.OS === "android" || Platform.OS === "web"
            ? textSecondaryColor(colorScheme)
            : undefined,
        animation: navigationAnimation,
        headerTitleStyle: Platform.select({
          default: {},
          web: { left: -20 } as any,
        }),
      })}
    />
  );
}
