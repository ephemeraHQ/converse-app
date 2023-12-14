import { useNavigationState } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StyleSheet, Platform } from "react-native";

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
  return StyleSheet.create({
    navigationButton: {
      paddingHorizontal: 5,
      marginRight: 14,
    },
  });
};
