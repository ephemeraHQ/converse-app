import { headerTitleStyle, textPrimaryColor } from "@styles/colors";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { getTitleFontScale } from "@utils/str";
import { VStack } from "@/design-system/VStack";
import { HStack } from "@design-system/HStack";

type ConversationTitleDumbProps = {
  title?: string;
  subtitle?: React.ReactNode;
  avatarComponent?: React.ReactNode;
  onLongPress?: () => void;
  onPress?: () => void;
};

export function ConversationTitleDumb({
  avatarComponent,
  title,
  subtitle,
  onLongPress,
  onPress,
}: ConversationTitleDumbProps) {
  const styles = useStyles();

  return (
    <HStack style={styles.container}>
      <TouchableOpacity
        onLongPress={onLongPress}
        onPress={onPress}
        style={styles.touchableContainer}
      >
        {avatarComponent}
        <VStack>
          <Text style={styles.title} numberOfLines={1} allowFontScaling={false}>
            {title}
          </Text>
          {subtitle}
        </VStack>
      </TouchableOpacity>
    </HStack>
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
