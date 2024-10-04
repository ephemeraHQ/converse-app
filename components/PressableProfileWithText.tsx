import { navigate } from "@utils/navigation";
import { memo, useCallback, useMemo } from "react";
import { StyleProp, TextStyle } from "react-native";
import ParsedText from "react-native-parsed-text";

const PressableProfileWithTextInner = ({
  profileAddress,
  profileDisplay,
  text,
  textStyle,
}: {
  text: string;
  profileDisplay: string;
  profileAddress: string;
  textStyle?: StyleProp<TextStyle>;
}) => {
  const onPress = useCallback(() => {
    if (profileAddress) {
      return navigate("Profile", {
        address: profileAddress,
      });
    }
    return undefined;
  }, [profileAddress]);

  const pattern = useMemo(
    () => new RegExp(profileDisplay, "g"),
    [profileDisplay]
  );
  const parseOptions = useMemo(
    () => [
      {
        onPress,
        pattern,
        style: textStyle,
      },
    ],
    [onPress, pattern, textStyle]
  );

  return (
    <ParsedText style={textStyle} parse={parseOptions}>
      {text}
    </ParsedText>
  );
};

export const PressableProfileWithText = memo(PressableProfileWithTextInner);
