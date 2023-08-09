import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import {
  Platform,
  PlatformColor,
  TouchableOpacity,
  useColorScheme,
} from "react-native";

import { NavigationParamList } from "../../screens/Main";
import { textSecondaryColor } from "../../utils/colors";
import Picto from "../Picto/Picto";

export default function ShareProfileButton({
  navigation,
}: NativeStackScreenProps<NavigationParamList, "Messages">) {
  const colorScheme = useColorScheme();
  return (
    <TouchableOpacity
      activeOpacity={0.2}
      onPress={() => {
        navigation.navigate("ShareProfile");
      }}
    >
      <Picto
        picto="qrcode"
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
          marginRight: Platform.OS === "android" ? 0 : 20,
        }}
      />
    </TouchableOpacity>
  );
}
