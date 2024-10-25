import {
  headerTitleStyle,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { Platform, useColorScheme } from "react-native";

import { ScreenHeaderModalCloseButton } from "../../components/Screen/ScreenHeaderModalCloseButton";
import { UserProfileScreen } from "../../screens/UserProfileScreen";
import { NativeStack } from "../Navigation";
import { useRouter } from "../useNavigation";

export default function UserProfileNav() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  return (
    <NativeStack.Screen
      name="UserProfile"
      component={UserProfileScreen}
      options={{
        headerTitle: "Modify profile",
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
