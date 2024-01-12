import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useRef } from "react";
import { Platform, TouchableOpacity, useColorScheme } from "react-native";
import { FAB } from "react-native-paper";

import { NavigationParamList } from "../../screens/Navigation/Navigation";
import { primaryColor } from "../../utils/colors";
import { navigate } from "../../utils/navigation";
import DebugButton, { useEnableDebug } from "../DebugButton";
import Picto from "../Picto/Picto";

export default function NewConversationButton({
  navigation,
}: NativeStackScreenProps<NavigationParamList, "Chats" | "Conversation">) {
  const colorScheme = useColorScheme();
  const debugRef = useRef();
  const enableDebug = useEnableDebug();
  const onPress = useCallback(() => {
    navigate("NewConversation");
  }, []);
  const onLongPress = useCallback(() => {
    if (
      !enableDebug ||
      !debugRef.current ||
      !(debugRef.current as any).showDebugMenu
    ) {
      return;
    }
    (debugRef.current as any).showDebugMenu();
  }, [enableDebug]);
  if (Platform.OS === "ios" || Platform.OS === "web") {
    return (
      <TouchableOpacity
        activeOpacity={0.2}
        onPress={onPress}
        onLongPress={onLongPress}
      >
        {enableDebug && <DebugButton ref={debugRef} />}
        <Picto
          picto="square.and.pencil"
          weight="medium"
          color={primaryColor(colorScheme)}
          size={16}
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
            {enableDebug && <DebugButton ref={debugRef} />}
            <Picto
              picto="square.and.pencil"
              weight="medium"
              color={props.color}
              size={24}
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
        onLongPress={onLongPress}
      />
    );
  }
}
