import * as Haptics from "expo-haptics";
import { Platform, StyleSheet, Text, useColorScheme, View } from "react-native";

import {
  messageInnerBubbleColor,
  myMessageInnerBubbleColor,
  textPrimaryColor,
} from "../../../utils/colors";
import { FrameButtonType, FrameToDisplay } from "../../../utils/frames";
import { MessageToDisplay } from "../Message/Message";
import FrameButton from "./FrameButton";
import FrameTextInput from "./FrameTextInput";

export default function FrameBottom({
  message,
  frame,
  textInput,
  buttons,
  setFrameTextInputFocused,
  frameTextInputValue,
  setFrameTextInputValue,
  posting,
  onButtonPress,
}: {
  message: MessageToDisplay;
  frame: FrameToDisplay;
  textInput: string | undefined;
  buttons: FrameButtonType[];
  setFrameTextInputFocused: (f: boolean) => void;
  posting: number | undefined;
  frameTextInputValue: string;
  setFrameTextInputValue: (s: string) => void;
  onButtonPress: (b: FrameButtonType) => void;
}) {
  const styles = useStyles();
  const colorScheme = useColorScheme();
  return (
    <View
      style={[
        styles.frameBottom,
        {
          backgroundColor: message.fromMe
            ? myMessageInnerBubbleColor(colorScheme)
            : messageInnerBubbleColor(colorScheme),
        },
      ]}
    >
      {frame.type === "XMTP_FRAME" && (
        <>
          {textInput && (
            <FrameTextInput
              textInput={textInput}
              setFrameTextInputFocused={setFrameTextInputFocused}
              setFrameTextInputValue={setFrameTextInputValue}
              frameTextInputValue={frameTextInputValue}
            />
          )}
          {buttons.length > 0 &&
            buttons.map((button) => (
              <FrameButton
                key={`${button.title}-${button.index}`}
                posting={posting}
                button={button}
                fullWidth={
                  buttons.length === 1 ||
                  (button.index === 3 && buttons.length === 3)
                }
                onPress={() => {
                  if (Platform.OS !== "web") {
                    // Immediate haptic feedback
                    Haptics.impactAsync();
                  }
                  // Timeout because we still use the JS SDK for frames
                  // and the encryption of payload happens on main thread :(
                  // @todo => use the RN SDK when it's available to sign
                  setTimeout(() => onButtonPress(button), 10);
                }}
              />
            ))}
        </>
      )}
      {(frame.type === "FRAME" || frame.type === "PREVIEW") && (
        <Text
          style={[
            styles.frameBottomText,
            {
              color: message.fromMe ? "white" : textPrimaryColor(colorScheme),
              fontWeight: frame.type === "PREVIEW" ? "600" : "400",
            },
          ]}
        >
          {frame.type === "FRAME"
            ? "This frame is not supported by XMTP yet, please use a Farcaster client to interact with it."
            : frame.extractedTags["og:title"]}
        </Text>
      )}
    </View>
  );
}

const useStyles = () => {
  return StyleSheet.create({
    frameBottom: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingTop: 3,
      paddingBottom: 6,
      paddingHorizontal: 8,
      borderBottomLeftRadius: 14,
      borderBottomRightRadius: 14,
    },
    frameBottomText: {
      paddingHorizontal: 4,
      paddingVertical: 8,
      fontSize: 15,
    },
  });
};
