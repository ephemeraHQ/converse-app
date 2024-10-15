import { ITextStyleProps } from "@design-system/Text/Text.props";
import { memo, useCallback, useMemo } from "react";

import { ParsedText } from "./ParsedText/ParsedText";

const pressableStyle: ITextStyleProps = {
  weight: "bold",
};

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

  return (
    <ParsedText
      preset="subheading"
      size="xxs"
      pressableStyle={pressableStyle}
      parse={parseOptions}
    >
      {text}
    </ParsedText>
  );
};

export const PressableProfileWithText = memo(PressableProfileWithTextInner);
