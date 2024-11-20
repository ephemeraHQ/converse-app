import { memo, useCallback, useMemo } from "react";
import { TextStyle } from "react-native";

import { textFontWeightStyles } from "../design-system/Text/Text.styles";
import { getTextStyle } from "../design-system/Text/Text.utils";
import { ThemedStyle, useAppTheme } from "../theme/useAppTheme";
import { ParsedText } from "./ParsedText/ParsedText";

const $pressableStyle = {
  ...textFontWeightStyles.bold,
};

const $textSecondaryStyle: ThemedStyle<TextStyle> = (theme) => ({
  color: theme.colors.fill.secondary,
});

const PressableProfileWithTextInner = ({
  profileAddress,
  profileDisplay,
  text,
  onPress,
}: {
  onPress: (address: string) => void;
  text: string;
  profileDisplay: string;
  profileAddress: string;
}) => {
  const handlePress = useCallback(() => {
    return onPress(profileAddress);
  }, [profileAddress, onPress]);

  const pattern = useMemo(
    () =>
      !!profileDisplay
        ? new RegExp(profileDisplay, "g")
        : // Small hack to make sure the text is not empty, otherwise the regex will match everything
          // The library should handle this better and says it does, but it doesn't
          new RegExp("profileDisplay", "g"),
    [profileDisplay]
  );

  const parseOptions = useMemo(
    () => [
      {
        onPress: handlePress,
        pattern,
      },
    ],
    [handlePress, pattern]
  );

  const { themed } = useAppTheme();

  const $textStyle = getTextStyle(themed, {
    preset: "smaller",
    size: "xxs",
    style: themed($textSecondaryStyle),
  });

  return (
    <ParsedText
      parse={parseOptions}
      pressableStyle={$pressableStyle}
      style={$textStyle}
      // testID="pressable-profile-with-text"
    >
      {text}
    </ParsedText>
  );
};

export const PressableProfileWithText = memo(PressableProfileWithTextInner);
