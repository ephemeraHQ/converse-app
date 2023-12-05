import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import {
  Platform,
  PlatformColor,
  TouchableOpacity,
  useColorScheme,
} from "react-native";

import { currentAccount } from "../../data/store/accountsStore";
import { NavigationParamList } from "../../screens/Navigation/Navigation";
import { textSecondaryColor } from "../../utils/colors";
import Picto from "../Picto/Picto";

export default function ProfileSettingsButton() {
  const navigation = useNavigation() as NativeStackNavigationProp<
    NavigationParamList,
    "Chats",
    undefined
  >;
  const colorScheme = useColorScheme();
  return (
    <TouchableOpacity
      activeOpacity={0.2}
      onPress={() => {
        navigation.navigate("Profile", { address: currentAccount() });
      }}
    >
      <Picto
        picto="gear"
        weight="medium"
        color={
          Platform.OS === "ios"
            ? PlatformColor("systemBlue")
            : textSecondaryColor(colorScheme)
        }
        size={Platform.OS === "ios" ? 16 : 24}
        style={{
          width: Platform.OS === "android" ? undefined : 32,
          height: Platform.OS === "android" ? undefined : 32,
          marginRight: Platform.OS === "android" ? 0 : 10,
          marginTop: Platform.OS === "ios" ? 3 : 0,
        }}
      />
    </TouchableOpacity>
  );
}
