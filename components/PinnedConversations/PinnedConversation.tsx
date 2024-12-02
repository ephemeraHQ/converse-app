import { Pressable } from "@design-system/Pressable";
import { Text } from "@design-system/Text";
import { backgroundColor, textSecondaryColor } from "@styles/colors";
import { FC } from "react";
import { StyleSheet, useColorScheme } from "react-native";

type PinnedConversationProps = {
  avatarComponent: React.ReactNode;
  onLongPress: () => void;
  onPress: () => void;
  showUnread: boolean;
  title: string;
};

export const PinnedConversation: FC<PinnedConversationProps> = ({
  avatarComponent,
  onLongPress,
  onPress,
  showUnread,
  title,
}) => {
  const styles = useStyles();

  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {avatarComponent}
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
};

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: backgroundColor(colorScheme),
    },
    container: {
      margin: 8,
      padding: 4,
    },
    avatar: { margin: 8 },
    text: {
      color: textSecondaryColor(colorScheme),
      textAlign: "center",
      flexWrap: "wrap",
      maxWidth: 100,
    },
  });
};
