import {
  useColorScheme,
  StyleSheet,
  View,
  StyleProp,
  ViewStyle,
} from "react-native";

import { messageBubbleColor, textSecondaryColor } from "../../utils/colors";
import Picto from "../Picto/Picto";

type Props = {
  picto: string;
  style?: StyleProp<ViewStyle>;
};

export default function ChatActionButton({ picto, style }: Props) {
  const styles = useStyles();
  const colorScheme = useColorScheme();
  return (
    <View style={[styles.transactionButton, style]}>
      <Picto
        picto={picto}
        color={textSecondaryColor(colorScheme)}
        size={11.7}
        weight="medium"
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
