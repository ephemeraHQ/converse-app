import {
  messageInnerBubbleColor,
  myMessageInnerBubbleColor,
  textPrimaryColor,
} from "@styles/colors";
import * as Haptics from "expo-haptics";
import { Platform, StyleSheet, Text, useColorScheme, View } from "react-native";

import FrameButton from "./FrameButton";
import FrameTextInput from "./FrameTextInput";
import { FrameButtonType, FrameToDisplay } from "../../../utils/frames";
import { MessageToDisplay } from "../Message/Message";

export default function FrameBottom({
  message,
  frame,
  textInput,
  buttons,
  setFrameTextInputFocused,
  frameTextInputValue,
  setFrameTextInputValue,
  postingActionForButton,
  onButtonPress,
}: {
  message: MessageToDisplay;
  frame: FrameToDisplay;
  textInput: string | undefined;
  buttons: FrameButtonType[];
  setFrameTextInputFocused: (f: boolean) => void;
  postingActionForButton: number | undefined;
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
          paddingVertical:
            frame.type === "PREVIEW" ? 3 : frame.type === "XMTP_FRAME" ? 4 : 0,
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
              messageFromMe={message.fromMe}
            />
          )}
          {buttons.length > 0 &&
            buttons.map((button) => (
              <FrameButton
                key={`${button.label}-${button.index}-${frame.uniqueId}`}
                postingActionForButton={postingActionForButton}
                button={button}
                fullWidth={
                  (button.index === 1 && buttons.length === 1) ||
                  (button.index === 3 && buttons.length === 3)
                }
                onPress={() => {
                  if (Platform.OS !== "web") {
                    // Immediate haptic feedback
                    Haptics.impactAsync();
                  }
                  onButtonPress(button);
                }}
                messageFromMe={message.fromMe}
              />
            ))}
        </>
      )}
      {(frame.type === "FARCASTER_FRAME" || frame.type === "PREVIEW") && (
        <Text
          style={[
            styles.frameBottomText,
            {
              color: message.fromMe ? "white" : textPrimaryColor(colorScheme),
              fontWeight: frame.type === "PREVIEW" ? "600" : "400",
            },
          ]}
        >
          {frame.type === "FARCASTER_FRAME"
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
