import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { textPrimaryColor, textSecondaryColor } from "@styles/colors";
import { PictoSizes } from "@styles/sizes";
import {
  Button,
  Platform,
  TouchableOpacity,
  useColorScheme,
} from "react-native";

import { NativeStack, navigationAnimation } from "./Navigation";
import Picto from "../../components/Picto/Picto";
import { useCurrentAccount } from "../../data/store/accountsStore";
import { navigate } from "../../utils/navigation";
import ProfileScreen from "../Profile";

export type ProfileNavParams = {
  address: string;
  fromGroupTopic?: string;
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
        : textPrimaryColor(colorScheme),
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
            if (Platform.OS === "ios") {
              return (
                <Button
                  title="Modify"
                  color={textPrimaryColor(colorScheme)}
                  onPress={() => {
                    navigate("UserProfile");
                  }}
                />
              );
            }
            return (
              <TouchableOpacity
                onPress={() => {
                  navigate("UserProfile");
                }}
              >
                <Picto
                  picto="square.and.pencil"
                  size={PictoSizes.navItem}
                  color={textSecondaryColor(colorScheme)}
                  style={{ marginRight: Platform.OS === "web" ? 30 : 0 }}
                />
              </TouchableOpacity>
            );
          }
          return null;
        },
        ...options,
      })}
    />
  );
}
