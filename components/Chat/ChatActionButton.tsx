import {
  useColorScheme,
  StyleSheet,
  View,
  StyleProp,
  ViewStyle,
  Platform,
} from "react-native";

import { messageBubbleColor, textSecondaryColor } from "../../utils/colors";
import Picto from "../Picto/Picto";

type ChatActionProps = {
  picto: string;
  style?: StyleProp<ViewStyle>;
  pictoStyle?: StyleProp<ViewStyle>;
};

export default function ChatActionButton({
  picto,
  style,
  pictoStyle,
}: ChatActionProps) {
  const styles = useStyles();
  const colorScheme = useColorScheme();
  return (
    <View style={[styles.transactionButton, style]}>
      <Picto
        picto={picto}
        color={textSecondaryColor(colorScheme)}
        size={Platform.OS === "android" ? 20 : 11.7}
        weight="medium"
        style={pictoStyle}
      />
    </View>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    transactionButton: {
      width: 36,
      height: 36,
      borderRadius: 36,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: messageBubbleColor(colorScheme),
    },
  });
};
