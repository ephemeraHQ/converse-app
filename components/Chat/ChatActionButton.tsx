import { useNavigationState } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  useColorScheme,
  StyleSheet,
  View,
  StyleProp,
  ViewStyle,
  Platform,
} from "react-native";

import { messageBubbleColor, textSecondaryColor } from "../../utils/colors";
import Button from "../Button/Button";
import Picto from "../Picto/Picto";

type ChatActionProps = {
  picto: string;
  style?: StyleProp<ViewStyle>;
};

type NavigationChatProps = {
  navigation: NativeStackNavigationProp<any>;
  address: string;
};

export default function ChatActionButton({ picto, style }: ChatActionProps) {
  const styles = useStyles();
  const colorScheme = useColorScheme();
  return (
    <View style={[styles.transactionButton, style]}>
      <Picto
        picto={picto}
        color={textSecondaryColor(colorScheme)}
        size={Platform.OS === "android" ? 20 : 11.7}
        weight="medium"
      />
    </View>
  );
}

export function NavigationChatButton({
  navigation,
  address,
}: NavigationChatProps) {
  const styles = useStyles();
  const navigationIndex = useNavigationState((state) => state.index);

  const handlePress = () => {
    // On Android the accounts are not in the navigation but in a drawer
    navigation.pop(
      Platform.OS === "ios" ? navigationIndex - 1 : navigationIndex
    );
    setTimeout(() => {
      navigation.navigate("Conversation", {
        mainConversationWithPeer: address,
        focus: true,
      });
    }, 300);
  };

  return (
    <Button
      variant={Platform.OS === "android" ? "text" : "secondary"}
      picto="message"
      title="Chat"
      style={styles.navigationButton}
      onPress={handlePress}
    />
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
    navigationButton: {
      paddingHorizontal: 5,
      marginRight: 14,
    },
  });
};
