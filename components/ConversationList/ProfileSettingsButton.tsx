import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import {
  Platform,
  PlatformColor,
  TouchableOpacity,
  useColorScheme,
} from "react-native";

import {
  currentAccount,
  useLoggedWithPrivy,
} from "../../data/store/accountsStore";
import { NavigationParamList } from "../../screens/Navigation/Navigation";
import { textSecondaryColor } from "../../utils/colors";
import Button from "../Button/Button";
import Picto from "../Picto/Picto";

export default function ProfileSettingsButton() {
  const navigation = useNavigation() as NativeStackNavigationProp<
    NavigationParamList,
    "Chats",
    undefined
  >;
  const colorScheme = useColorScheme();
  const isPrivy = useLoggedWithPrivy();
  if (isPrivy) {
    return (
      <Button
        variant="text"
        title="12"
        onPress={() => {
          navigation.navigate("Profile", { address: currentAccount() });
        }}
        style={{ marginTop: 4, marginRight: 10 }}
      />
    );
  }
  return (
    <TouchableOpacity
      activeOpacity={0.2}
      onPress={() => {
        navigation.navigate("Profile", { address: currentAccount() });
      }}
    >
      <Picto
        picto="person"
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
