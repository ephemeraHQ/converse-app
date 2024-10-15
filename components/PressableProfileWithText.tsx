import { ITextStyleProps } from "@design-system/Text/Text.props";
import { ThemedStyle, useAppTheme } from "@theme/useAppTheme";
import { memo, useCallback, useMemo } from "react";
import { TextStyle } from "react-native";

import { ParsedText } from "./ParsedText/ParsedText";

const $pressableStyle: ITextStyleProps = {
  weight: "bold",
};

const $textStyle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.fill.secondary,
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
  const { themed } = useAppTheme();

  const handlePress = useCallback(() => {
    return onPress(profileAddress);
  }, [profileAddress, onPress]);

  const pattern = useMemo(
    () => new RegExp(profileDisplay, "g"),
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

  return (
    <ParsedText
      preset="smaller"
      size="xxs"
      style={themed($textStyle)}
      pressableStyle={$pressableStyle}
      parse={parseOptions}
    >
      {text}
    </ParsedText>
  );
};

export const PressableProfileWithText = memo(PressableProfileWithTextInner);
