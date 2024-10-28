import { PictoSizes } from "@styles/sizes";
import { converseEventEmitter } from "@utils/events";
import React, { useCallback } from "react";
import { Platform, useColorScheme } from "react-native";
import { FAB } from "react-native-paper";

import { IconButton } from "../../design-system/IconButton/IconButton";
import { navigate } from "../../utils/navigation";
import Picto from "../Picto/Picto";

export default function NewConversationButton() {
  const colorScheme = useColorScheme();
  const onPress = useCallback(() => {
    navigate("NewConversation");
  }, []);
  const showDebug = useCallback(() => {
    converseEventEmitter.emit("showDebugMenu");
  }, []);

  if (Platform.OS === "ios") {
    return (
      <IconButton
        variant="ghost"
        iconName="square.and.pencil"
        size="md"
        onPress={onPress}
        onLongPress={showDebug}
      />
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
        onLongPress={showDebug}
      />
    );
  }
}
