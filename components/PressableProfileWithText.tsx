import { memo, useCallback, useMemo } from "react";

import { textFontWeightStyles } from "../design-system/Text/Text.styles";
import { getTextStyle } from "../design-system/Text/Text.utils";
import { useAppTheme } from "../theme/useAppTheme";
import { ParsedText } from "./ParsedText/ParsedText";

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

  const { themed } = useAppTheme();

  const $pressableStyle = {
    ...textFontWeightStyles.bold,
  };

  const $textStyle = getTextStyle(themed, {
    preset: "smaller",
    size: "xxs",
  });

  return (
    <ParsedText
      parse={parseOptions}
      pressableStyle={$pressableStyle}
      style={$textStyle}
    >
      {text}
    </ParsedText>
  );
};

export const PressableProfileWithText = memo(PressableProfileWithTextInner);
