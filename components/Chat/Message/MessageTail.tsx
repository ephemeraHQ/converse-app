import React from "react";
import { ColorSchemeName, StyleSheet, ViewStyle } from "react-native";
import Reanimated, { AnimatedStyleProp } from "react-native-reanimated";
import { SvgProps } from "react-native-svg";

import _MessageTail from "../../../assets/message-tail.svg";
import {
  messageBubbleColor,
  myMessageBubbleColor,
} from "../../../utils/colors";

class MessageTailComponent extends React.Component<SvgProps> {
  render() {
    return <_MessageTail {...this.props} />;
  }
}

const MessageTailAnimated =
  Reanimated.createAnimatedComponent(MessageTailComponent);

interface MessageTailProps {
  fromMe: boolean;
  colorScheme: ColorSchemeName;
  hideBackground: boolean;
  style?: AnimatedStyleProp<ViewStyle>;
}

const MessageTail: React.FC<MessageTailProps> = ({
  fromMe,
  colorScheme,
  hideBackground,
  style,
}) => {
  return (
    <MessageTailAnimated
      style={[styles.messageTail, fromMe && styles.messageTailMe, style]}
      fill={
        hideBackground
          ? "transparent"
          : fromMe
          ? myMessageBubbleColor(colorScheme)
          : messageBubbleColor(colorScheme)
      }
    />
  );
};

const styles = StyleSheet.create({
  messageTail: {
    position: "absolute",
    left: -5,
    bottom: 0,
    width: 14,
    height: 21,
    zIndex: -1,
  },
  messageTailMe: {
    left: "auto",
    right: -5,
    transform: [{ scaleX: -1 }],
  },
});

export default MessageTail;
