import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { Button, Platform, useColorScheme } from "react-native";

import { useCurrentAccount } from "../../data/store/accountsStore";
import { textSecondaryColor } from "../../utils/colors";
import { navigate } from "../../utils/navigation";
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
  const options: NativeStackNavigationOptions = {
    headerTintColor:
      Platform.OS === "android" || Platform.OS === "web"
        ? textSecondaryColor(colorScheme)
        : undefined,
    animation: navigationAnimation,
  };
  if (Platform.OS === "web") {
    options.headerTitleStyle = { left: -20 } as any;
  }
  return (
    <NativeStack.Screen
      name="Profile"
      component={ProfileScreen}
      options={({ route }) => ({
        headerBackTitle: "Back",
        headerTitle: "Profile",
        headerRight: () => {
          if (route.params.address === account) {
            return (
              <Button
                title="Modify"
                onPress={() => {
                  navigate("UserProfile");
                }}
              />
            );
          }
          return null;
        },
        ...options,
      })}
    />
  );
}
