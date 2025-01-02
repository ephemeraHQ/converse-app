import Avatar from "@components/Avatar";
import { BottomSheetContentContainer } from "@design-system/BottomSheet/BottomSheetContentContainer";
import { BottomSheetHeader } from "@design-system/BottomSheet/BottomSheetHeader";
import { BottomSheetModal } from "@design-system/BottomSheet/BottomSheetModal";
import { HStack } from "@design-system/HStack";
import { Text } from "@design-system/Text";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { FlashList } from "@shopify/flash-list";
import { ThemedStyle, useAppTheme } from "@theme/useAppTheme";
import { memo, useCallback, useState } from "react";
import { TextStyle, TouchableHighlight, ViewStyle } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  bottomSheetModalRef,
  resetMessageReactionsDrawer,
  useMessageReactionsRolledUpReactions,
} from "./conversation-message-reaction-drawer.service";

export const MessageReactionsDrawer = memo(function MessageReactionsDrawer() {
  const { theme, themed } = useAppTheme();
  const insets = useSafeAreaInsets();
  const rolledUpReactions = useMessageReactionsRolledUpReactions();

  const handleDismiss = useCallback(() => {
    resetMessageReactionsDrawer();
    setFilterReactions(null);
  }, []);

  // State for managing the active filter, e.g., ❤️, 👍, etc.
  const [filterReactions, setFilterReactions] = useState<string | null>(null);

  return (
    <BottomSheetModal
      onDismiss={handleDismiss}
      ref={bottomSheetModalRef}
      topInset={insets.top}
      snapPoints={["50%", "100%"]}
    >
      <BottomSheetContentContainer>
        <BottomSheetHeader title="Reactions" hasClose />

        {/* Preview of all reactions with counts and filter buttons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{
            paddingLeft: theme.spacing.lg,
            flexDirection: "row",
          }}
          scrollEnabled
        >
          {/* "All" button to clear the filter */}
          <TouchableHighlight
            onPress={() => setFilterReactions(null)}
            style={[
              themed($chip),
              filterReactions === null && themed($chipActive),
            ]}
            underlayColor={theme.colors.border.subtle}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Show all reactions"
          >
            <HStack style={{ alignItems: "center" }}>
              <Text
                style={themed(
                  filterReactions === null ? $chipTextActive : $chipText
                )}
              >
                All {rolledUpReactions.totalCount}
              </Text>
            </HStack>
          </TouchableHighlight>

          {/* Buttons for each unique reaction type with counts */}
          {rolledUpReactions.preview.map((reaction, index) => (
            <TouchableHighlight
              key={index}
              onPress={() =>
                setFilterReactions(
                  reaction.content === filterReactions ? null : reaction.content
                )
              }
              style={[
                themed($chip),
                filterReactions === reaction.content && themed($chipActive),
              ]}
              underlayColor={theme.colors.border.subtle}
              accessible
              accessibilityRole="button"
              accessibilityLabel={`${reaction.count} ${reaction.content} reactions`}
            >
              <Text
                style={themed(
                  filterReactions === reaction.content
                    ? $chipTextActive
                    : $chipText
                )}
              >
                {reaction.content} {reaction.count}
              </Text>
            </TouchableHighlight>
          ))}
          <HStack style={{ width: theme.spacing.xxl }} />
        </ScrollView>
      </BottomSheetContentContainer>

      {/* Detailed list of each reaction, sorted and filtered with all own reactions on top */}
      <BottomSheetScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <FlashList
          estimatedItemSize={rolledUpReactions.totalCount}
          data={rolledUpReactions.detailed.filter(
            (item) => !filterReactions || item.content === filterReactions
          )}
          renderItem={({ item, index }) => (
            <HStack
              key={`${item.content}-${item.reactor.address}-${index}`}
              style={themed($reaction)}
            >
              <Avatar
                size={theme.avatarSize.md}
                uri={item.reactor.avatar}
                name={item.reactor.userName}
              />
              <Text style={themed($userName)}>{item.reactor.userName}</Text>
              <Text style={themed($reactionContent)}>{item.content}</Text>
            </HStack>
          )}
          keyExtractor={(item, index) =>
            `${item.content}-${item.reactor.address}-${index}`
          }
        />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

const $chip: ThemedStyle<ViewStyle> = ({
  spacing,
  borderRadius,
  borderWidth,
  colors,
}) => ({
  marginRight: spacing.xxs,
  marginBottom: spacing.xs,
  paddingVertical: spacing.xxs,
  paddingHorizontal: spacing.xs,
  borderRadius: borderRadius.sm,
  borderWidth: borderWidth.sm,
  borderColor: colors.border.subtle,
});

const $chipActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.border.subtle,
});

const $reaction: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  display: "flex",
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.lg,
  alignItems: "center",
  gap: spacing.xs,
});

const $userName: ThemedStyle<TextStyle> = ({ spacing, colors }) => ({
  flex: 1,
  display: "flex",
  alignItems: "flex-end",
  gap: spacing.xxxs,
  overflow: "hidden",
  color: colors.text.primary,
});

const $reactionContent: ThemedStyle<TextStyle> = ({ spacing }) => ({
  padding: spacing.xxxs,
});

const $chipText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text.secondary,
});

const $chipTextActive: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text.primary,
});
