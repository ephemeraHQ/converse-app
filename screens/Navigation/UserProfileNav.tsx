import {
  headerTitleStyle,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { Platform, useColorScheme } from "react-native";

import { ScreenHeaderModalCloseButton } from "../../components/Screen/ScreenHeaderModalCloseButton";
import { useRouter } from "../../navigation/useNavigation";
import { UserProfileScreen } from "../UserProfileScreen";
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
        headerTitle: translate("profile.modify_profile"),
        headerTitleStyle: headerTitleStyle(colorScheme),
        headerLeft: () => (
          <ScreenHeaderModalCloseButton
            onPress={() => {
              router.goBack();
            }}
          />
        ),
        headerTintColor:
          Platform.OS === "android"
            ? textSecondaryColor(colorScheme)
            : textPrimaryColor(colorScheme),
      }}
    />
  );
}
