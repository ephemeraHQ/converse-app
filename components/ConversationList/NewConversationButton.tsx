import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { primaryColor } from "@styles/colors";
import { PictoSizes } from "@styles/sizes";
import React, { useCallback } from "react";
import { Platform, TouchableOpacity, useColorScheme } from "react-native";
import { FAB } from "react-native-paper";

import { NavigationParamList } from "../../screens/Navigation/Navigation";
import { navigate } from "../../utils/navigation";
import Picto from "../Picto/Picto";

export default function NewConversationButton({
  navigation,
}: NativeStackScreenProps<
  NavigationParamList,
  "Chats" | "Conversation" | "ShareFrame"
>) {
  const colorScheme = useColorScheme();
  const onPress = useCallback(() => {
    navigate("NewConversation");
  }, []);

  if (Platform.OS === "ios") {
    return (
      <TouchableOpacity activeOpacity={0.2} onPress={onPress}>
        <Picto
          picto="square.and.pencil"
          color={primaryColor(colorScheme)}
          size={PictoSizes.newConversationButton}
          style={{ width: 32, height: 32 }}
        />
      </TouchableOpacity>
    );
  } else {
    return (
      <FAB
        key={`FAB-newConversation-${colorScheme}`}
        icon={(props) => (
          <>
            <Picto
              picto="square.and.pencil"
              color={props.color}
              size={PictoSizes.newConversationButton}
            />
          </>
        )}
        animated={false}
        style={{
          position: "absolute",
          margin: 0,
          right: 16,
          bottom: 20,
        }}
        onPress={onPress}
      />
    );
  }
}
