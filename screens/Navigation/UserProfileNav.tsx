import {
  headerTitleStyle,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { Platform, useColorScheme } from "react-native";

import { useRouter } from "@navigation/useNavigation";
import { UserProfileScreen } from "@screens/UserProfileScreen";
import { NativeStack } from "./Navigation";
import { translate } from "@/i18n";

export default function UserProfileNav() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  return (
    <NativeStack.Screen
      name="UserProfile"
      component={UserProfileScreen}
      options={{
        headerTitle: translate("userProfile.modify"),
        headerTitleStyle: headerTitleStyle(colorScheme),
        headerTintColor:
          Platform.OS === "android"
            ? textSecondaryColor(colorScheme)
            : textPrimaryColor(colorScheme),
      }}
    />
  );
}
