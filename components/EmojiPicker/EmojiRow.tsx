import { CategorizedEmojisRecord } from "@utils/emojis/interfaces";
import { FC } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

interface EmojiRowProps {
  item: CategorizedEmojisRecord;
  onPress: (emoji: string) => void;
}

export const EmojiRow: FC<EmojiRowProps> = ({ item, onPress }) => {
  return (
    <View style={styles.rowContainer}>
      {item.emojis.map((emoji) => (
        <Pressable
          key={emoji.emoji}
          onPress={() => onPress(emoji.emoji)}
          style={styles.pressable}
        >
          <Text adjustsFontSizeToFit style={styles.listEmoji}>
            {emoji.emoji}
          </Text>
        </Pressable>
      ))}
      {item.emojis.length !== 6 && <View style={{ flexGrow: 1 }} />}
    </View>
  );
};

const styles = StyleSheet.create({
  listEmoji: {
    fontSize: Platform.OS === "ios" ? 40 : 32,
    flexGrow: 1,
    lineHeight: 50,
  },
  rowContainer: {
    flexDirection: "row",
    width: "100%",
  },
  pressable: {
    flex: 1,
    marginHorizontal: Platform.OS === "ios" ? 8 : 0,
    paddingHorizontal: Platform.OS === "android" ? 8 : 0,
    justifyContent: "center",
    alignItems: "center",
  },
});
