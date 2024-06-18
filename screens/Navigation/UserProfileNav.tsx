import { Platform, useColorScheme } from "react-native";

import UserProfile from "../../components/Onboarding/UserProfile";
import {
  textPrimaryColor,
  textSecondaryColor,
  headerTitleStyle,
} from "../../utils/colors";
import { NativeStack } from "./Navigation";

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
