import {
  StyleSheet,
  Text,
  TouchableHighlight,
  useColorScheme,
  View,
} from "react-native";

import FrameLinkIcon from "../../../assets/frameLink.svg";
import {
  clickedItemBackgroundColor,
  textPrimaryColor,
  textSecondaryColor,
  backgroundColor,
} from "../../../utils/colors";
import { FrameButtonType } from "../../../utils/frames";

type FrameButtonProps = {
  button: FrameButtonType;
  onPress: () => void;
  postingActionForButton: number | undefined;
  fullWidth: boolean;
  messageFromMe: boolean;
};

export default function FrameButton({
  button,
  onPress,
  postingActionForButton,
  fullWidth,
  messageFromMe,
}: FrameButtonProps) {
  const styles = useStyles();
  const colorScheme = useColorScheme();
  const isDarkMessage = colorScheme === "dark" && !messageFromMe;
  return (
    <>
      <TouchableHighlight
        underlayColor={clickedItemBackgroundColor(colorScheme)}
        onPress={postingActionForButton ? undefined : onPress}
        style={[
          styles.frameButton,
          {
            marginRight: button.index % 2 === 1 && !fullWidth ? 8 : 0,
            opacity:
              postingActionForButton && postingActionForButton !== button.index
                ? 0.6
                : 1,
            backgroundColor: isDarkMessage
              ? "rgba(255,255,255,0.1)"
              : backgroundColor("light"),
          },
        ]}
      >
        <View style={styles.frameButtonContent}>
          <Text
            style={[
              styles.frameButtonText,
              {
                color: isDarkMessage
                  ? textPrimaryColor("dark")
                  : textPrimaryColor("light"),
              },
            ]}
            numberOfLines={1}
          >
            {button.label}
          </Text>
          {(button.action === "post_redirect" || button.action === "link") && (
            <FrameLinkIcon
              color={textSecondaryColor(colorScheme)}
              fill={textSecondaryColor(colorScheme)}
              style={styles.frameButtonPicto}
            />
          )}
        </View>
      </TouchableHighlight>
      {button.index === 2 && <View style={{ flexBasis: "100%" }} />}
    </>
  );
}

const useStyles = () => {
  return StyleSheet.create({
    frameButton: {
      flexGrow: 1,
      flex: 1,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 9,
      marginVertical: 4,
    },
    frameButtonContent: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "center",
    },
    frameButtonPicto: {
      width: 10,
      height: 10,
      marginHorizontal: 7,
    },
    frameButtonText: {
      fontSize: 12,
      flexShrink: 1,
    },
  });
};
