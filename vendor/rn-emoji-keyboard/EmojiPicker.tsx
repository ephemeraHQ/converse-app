import * as React from "react";
import { View, useWindowDimensions } from "react-native";
import { EmojiStaticKeyboard } from "./components/EmojiStaticKeyboard";
import { KeyboardProvider } from "./contexts/KeyboardProvider";
import type { KeyboardProps } from "./contexts/KeyboardContext";
import { defaultKeyboardContext } from "./contexts/KeyboardContext";
import type { EmojiType } from "./types";
import { ModalWithBackdrop } from "./components/ModalWithBackdrop";
import { getHeight } from "./utils/getHeight";

export const EmojiPicker = ({
  onEmojiSelected,
  onRequestClose,
  open,
  onClose,
  expandable = defaultKeyboardContext.expandable,
  defaultHeight = defaultKeyboardContext.defaultHeight,
  allowMultipleSelections = false,
  ...props
}: KeyboardProps) => {
  const { height: screenHeight } = useWindowDimensions();

  return (
    <KeyboardProvider
      onEmojiSelected={(emoji: EmojiType) => {
        onEmojiSelected(emoji);
        !allowMultipleSelections && onClose();
      }}
      open={open}
      onClose={onClose}
      expandable={expandable}
      defaultHeight={defaultHeight}
      {...props}
    >
      <ModalWithBackdrop
        isOpen={open}
        backdropPress={onClose}
        onRequestClose={onRequestClose || onClose}
      >
        <>
          <View
            style={[
              {
                height: getHeight(defaultHeight, screenHeight),
              },
            ]}
          >
            <EmojiStaticKeyboard />
          </View>
        </>
      </ModalWithBackdrop>
    </KeyboardProvider>
  );
};
