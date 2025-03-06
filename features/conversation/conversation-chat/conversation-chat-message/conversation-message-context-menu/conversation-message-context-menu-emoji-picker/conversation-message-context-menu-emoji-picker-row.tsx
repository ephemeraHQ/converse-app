import { ICategorizedEmojisRecord, IEmoji } from "@utils/emojis/emoji-types"
import { FC, memo, useMemo } from "react"
import { Platform, Pressable, StyleSheet, Text, View } from "react-native"

type EmojiRowProps = {
  item: ICategorizedEmojisRecord
  onPress: (emoji: string) => void
}

export const EmojiRow: FC<EmojiRowProps> = memo(({ item, onPress }) => {
  const items = useMemo(() => {
    const sliced: (string | IEmoji)[] = item.emojis.slice(0, 6)
    while (sliced.length < 6) {
      sliced.push("")
    }
    return sliced
  }, [item.emojis])

  return (
    <View style={styles.rowContainer}>
      {items.map((emoji, id) => {
        if (typeof emoji === "string") return <View key={id} style={styles.empty} />
        return (
          <Pressable
            key={emoji.emoji}
            onPress={() => onPress(emoji.emoji)}
            style={styles.pressable}
          >
            <Text adjustsFontSizeToFit style={styles.listEmoji}>
              {emoji.emoji}
            </Text>
          </Pressable>
        )
      })}
      {item.emojis.length !== 6 && <View style={{ flexGrow: 1 }} />}
    </View>
  )
})

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
  empty: {
    flex: 1,
  },
})
