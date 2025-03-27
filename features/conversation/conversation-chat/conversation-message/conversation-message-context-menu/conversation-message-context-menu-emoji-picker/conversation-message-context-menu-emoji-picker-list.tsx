import { BottomSheetFlashList } from "@design-system/BottomSheet/BottomSheetFlashList"
import { BottomSheetFlatList } from "@design-system/BottomSheet/BottomSheetFlatList"
import { ListRenderItem as FlashListRenderItem } from "@shopify/flash-list"
import { ICategorizedEmojisRecord } from "@utils/emojis/emoji-types"
import React, { FC, useCallback, useEffect } from "react"
import { ListRenderItem, Platform, StyleSheet, useWindowDimensions, View } from "react-native"
import { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { AnimatedVStack } from "@/design-system/VStack"
import { EmojiRow } from "./conversation-message-context-menu-emoji-picker-row"

type EmojiRowListProps = {
  emojis: ICategorizedEmojisRecord[]
  ListHeader?: React.ReactNode
  onPress: (emoji: string) => void
}

const keyExtractor = (_: unknown, index: number) => String(index)

// Works around issue with Android not picking up scrolls
const ListRenderer = Platform.OS === "ios" ? BottomSheetFlashList : BottomSheetFlatList

export const EmojiRowList: FC<EmojiRowListProps> = ({ emojis, ListHeader, onPress }) => {
  const styles = useStyles()
  const { height: windowHeight } = useWindowDimensions()
  const height = useSharedValue(Math.min(emojis.length * 50, windowHeight * 0.75))

  useEffect(() => {
    height.value = withTiming(Math.min(emojis.length * 50, windowHeight * 0.75), {
      duration: 400,
    })
  }, [emojis.length, height, windowHeight])

  const renderItem: ListRenderItem<ICategorizedEmojisRecord> &
    FlashListRenderItem<ICategorizedEmojisRecord> = useCallback(
    ({ item }) => <EmojiRow onPress={onPress} item={item} />,
    [onPress],
  )

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: height.value,
    }
  })

  const ListHeaderComponent = useCallback(() => {
    return ListHeader
  }, [ListHeader])

  return (
    <AnimatedVStack style={[animatedStyle, styles.container]}>
      <ListRenderer
        ListHeaderComponent={ListHeaderComponent}
        showsVerticalScrollIndicator={false}
        data={emojis}
        scrollEnabled={emojis.length > 1}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        estimatedItemSize={49}
        ListFooterComponent={() => <View style={styles.bottom} />}
      />
    </AnimatedVStack>
  )
}

const useStyles = () => {
  const insets = useSafeAreaInsets()

  return StyleSheet.create({
    container: {
      overflow: "hidden",
    },
    bottom: {
      height: insets.bottom,
    },
  })
}
