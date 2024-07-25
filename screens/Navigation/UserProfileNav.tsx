import {
  headerTitleStyle,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { Platform, useColorScheme } from "react-native";

import { NativeStack } from "./Navigation";
import UserProfile from "../../components/Onboarding/UserProfile";

export default function UserProfileNav() {
  const colorScheme = useColorScheme();
  return (
    <NativeStack.Screen
      name="UserProfile"
      component={UserProfile}
      options={{
        headerTitle: "Modify profile",
        headerTitleStyle: headerTitleStyle(colorScheme),
        headerTintColor:
          Platform.OS === "android" || Platform.OS === "web"
            ? textSecondaryColor(colorScheme)
            : textPrimaryColor(colorScheme),
      }}
    />
  );
}
