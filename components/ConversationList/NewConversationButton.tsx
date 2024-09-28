import { useDebugEnabled } from "@components/DebugButton";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { primaryColor } from "@styles/colors";
import { PictoSizes } from "@styles/sizes";
import { converseEventEmitter } from "@utils/events";
import React, { useCallback } from "react";
import {
  Platform,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { FAB } from "react-native-paper";

import { NavigationParamList } from "../../screens/Navigation/Navigation";
import { navigate } from "../../utils/navigation";
import Picto from "../Picto/Picto";

export default function NewConversationButton({
  navigation,
}: NativeStackScreenProps<
  NavigationParamList,
  "Chats" | "Conversation" | "ShareFrame" | "Blocked"
>) {
  const colorScheme = useColorScheme();
  const debugEnabled = useDebugEnabled();
  const onPress = useCallback(() => {
    navigate("NewConversation");
  }, []);
  const showDebug = useCallback(() => {
    converseEventEmitter.emit("showDebugMenu");
  }, []);

  if (Platform.OS === "ios") {
    return (
      <TouchableOpacity
        activeOpacity={0.2}
        onPress={onPress}
        onLongPress={debugEnabled ? showDebug : undefined}
      >
        <Picto
          picto="square.and.pencil"
          color={primaryColor(colorScheme)}
          size={PictoSizes.newConversationButton}
          style={styles.iconStyle}
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
        style={styles.fabStyle}
        onPress={onPress}
        onLongPress={debugEnabled ? showDebug : undefined}
      />
    );
  }
}

const styles = StyleSheet.create({
  fabStyle: {
    position: "absolute",
    margin: 0,
    right: 16,
    bottom: 20,
  },
  iconStyle: {
    width: 32,
    height: 32,
  },
});
