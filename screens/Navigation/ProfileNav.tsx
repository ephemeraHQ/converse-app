import { NativeStack } from "@navigation/AppNavigator";
import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { textPrimaryColor, textSecondaryColor } from "@styles/colors";
import { Platform, useColorScheme } from "react-native";

import { ScreenHeaderButton } from "../../components/Screen/ScreenHeaderButton/ScreenHeaderButton";
import { ScreenHeaderIconButton } from "../../components/Screen/ScreenHeaderIconButton/ScreenHeaderIconButton";
import { ScreenHeaderModalCloseButton } from "../../components/Screen/ScreenHeaderModalCloseButton";
import { useCurrentAccount } from "../../data/store/accountsStore";
import { useRouter } from "../../navigation/useNavigation";
import { navigate } from "../../utils/navigation";
import ProfileScreen from "../Profile";
import { navigationAnimation } from "./Navigation";

export type ProfileNavParams = {
  address: string;
  fromGroupTopic?: string;
};

export const ProfileScreenConfig = {
  path: "/profile",
};

export default function ProfileNav() {
  const router = useRouter();

  const colorScheme = useColorScheme();
  const account = useCurrentAccount();
  const options: NativeStackNavigationOptions = {
    headerTintColor:
      Platform.OS === "android"
        ? textSecondaryColor(colorScheme)
        : textPrimaryColor(colorScheme),
    animation: navigationAnimation,
  };

  return (
    <NativeStack.Screen
      name="Profile"
      component={ProfileScreen}
      options={({ route }) => ({
        presentation: "modal",
        headerTitle: "",
        headerLeft: () => (
          <ScreenHeaderModalCloseButton onPress={router.goBack} />
        ),
        headerRight: () => {
          if (route.params.address === account) {
            if (Platform.OS === "ios") {
              return (
                <ScreenHeaderButton
                  title="Modify"
                  onPress={() => {
                    navigate("UserProfile");
                  }}
                />
              );
            }
            return (
              <ScreenHeaderIconButton
                iconName="square.and.pencil"
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
