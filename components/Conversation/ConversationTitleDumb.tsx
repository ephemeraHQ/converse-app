import { headerTitleStyle, textPrimaryColor } from "@styles/colors";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

import { getTitleFontScale } from "../../utils/str";

type ConversationTitleDumbProps = {
  title?: string;
  avatarComponent?: React.ReactNode;
  onLongPress?: () => void;
  onPress?: () => void;
};

export function ConversationTitleDumb({
  avatarComponent,
  title,
  onLongPress,
  onPress,
}: ConversationTitleDumbProps) {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onLongPress={onLongPress}
        onPress={onPress}
        style={styles.touchableContainer}
      >
        {avatarComponent}
        <Text style={styles.title} numberOfLines={1} allowFontScaling={false}>
          {title}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    avatar: {
      marginRight: Platform.OS === "android" ? 24 : 7,
      marginLeft: Platform.OS === "ios" ? 0 : -9,
    },
    container: { flexDirection: "row", flexGrow: 1 },
    touchableContainer: {
      flexDirection: "row",
      justifyContent: "flex-start",
      left: Platform.OS === "android" ? -36 : 0,
      width: "100%",
      alignItems: "center",
      paddingRight: 40,
    },
    title: {
      color: textPrimaryColor(colorScheme),
      fontSize:
        Platform.OS === "ios"
          ? 16 * getTitleFontScale()
          : headerTitleStyle(colorScheme).fontSize,
    },
  });
};
