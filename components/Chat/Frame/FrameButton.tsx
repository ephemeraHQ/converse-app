import {
  StyleSheet,
  Text,
  TouchableHighlight,
  useColorScheme,
  View,
} from "react-native";

import FrameLinkIcon from "../../../assets/frameLink.svg";
import {
  backgroundColor,
  clickedItemBackgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../../../utils/colors";
import { FrameButtonType } from "../../../utils/frames";

type FrameButtonProps = {
  button: FrameButtonType;
  onPress: () => void;
  postingActionForButton: number | undefined;
  fullWidth: boolean;
};

export default function FrameButton({
  button,
  onPress,
  postingActionForButton,
  fullWidth,
}: FrameButtonProps) {
  const styles = useStyles();
  const colorScheme = useColorScheme();
  return (
    <TouchableHighlight
      underlayColor={clickedItemBackgroundColor(colorScheme)}
      onPress={postingActionForButton ? undefined : onPress}
      style={[
        styles.frameButton,
        {
          marginRight: button.index % 2 === 1 && !fullWidth ? "4%" : 0,
          opacity:
            postingActionForButton && postingActionForButton !== button.index
              ? 0.6
              : 1,
          width: fullWidth ? "100%" : "48%",
        },
      ]}
    >
      <View style={styles.frameButtonContent}>
        <Text style={styles.frameButtonText} numberOfLines={1}>
          {button.title}
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
  );
}

const useStyles = () => {
  return StyleSheet.create({
    frameButton: {
      borderRadius: 9,
      paddingHorizontal: 6,
      paddingVertical: 9,
      marginVertical: 4,
      backgroundColor: backgroundColor("light"),
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
      color: textPrimaryColor("light"),
      fontSize: 12,
      flexShrink: 1,
    },
  });
};
