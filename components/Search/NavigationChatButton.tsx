import { useNavigationState } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StyleSheet, Platform } from "react-native";

import { useIsSplitScreen } from "../../screens/Navigation/navHelpers";
import { navigate } from "../../utils/navigation";
import Button from "../Button/Button";

type NavigationChatProps = {
  navigation: NativeStackNavigationProp<any>;
  address: string;
};

export function NavigationChatButton({
  navigation,
  address,
}: NavigationChatProps) {
  const styles = useStyles();
  const navigationIndex = useNavigationState((state) => state.index);
  const isSplitScreen = useIsSplitScreen();

  const handlePress = () => {
    // On Android the accounts are not in the navigation but in a drawer
    if (Platform.OS !== "web") {
      navigation.pop(
        Platform.OS === "ios" ? navigationIndex - 1 : navigationIndex
      );
    }
    setTimeout(
      () => {
        navigate("Conversation", {
          mainConversationWithPeer: address,
          focus: true,
        });
      },
      isSplitScreen ? 0 : 300
    );
  };

  return (
    <Button
      variant={
        Platform.OS === "android" || Platform.OS === "web"
          ? "text"
          : "secondary"
      }
      picto="message"
      title="Chat"
      style={styles.navigationButton}
      onPress={handlePress}
    />
  );
}

const useStyles = () => {
  return StyleSheet.create({
    navigationButton: {
      paddingHorizontal: 5,
      marginRight: 14,
    },
  });
};
