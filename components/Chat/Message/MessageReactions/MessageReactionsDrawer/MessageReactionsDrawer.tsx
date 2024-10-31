import Avatar from "@components/Avatar";
import { BottomSheetContentContainer } from "@design-system/BottomSheet/BottomSheetContentContainer";
import { BottomSheetHeader } from "@design-system/BottomSheet/BottomSheetHeader";
import { BottomSheetModal } from "@design-system/BottomSheet/BottomSheetModal";
import { HStack } from "@design-system/HStack";
import { Text } from "@design-system/Text";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { FlashList } from "@shopify/flash-list";
import { useAppTheme } from "@theme/useAppTheme";
import { memo, useCallback, useState } from "react";
import { StyleSheet, TouchableHighlight } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  bottomSheetModalRef,
  resetMessageReactionsDrawer,
  useMessageReactionsRolledUpReactions,
} from "./MessageReactionsDrawer.service";

export const MessageReactionsDrawer = memo(function MessageReactionsDrawer() {
  const styles = useStyles();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const rolledUpReactions = useMessageReactionsRolledUpReactions();

  const handleDismiss = useCallback(() => {
    resetMessageReactionsDrawer();
    setFilterReactions(null);
  }, []);

  // State for managing the active filter, e.g., ❤️, 👍, etc.
  const [filterReactions, setFilterReactions] = useState<string | null>(null);

  // Chip styling
  const getChipStyle = (reactionContent: string | null) => [
    styles.chip,
    filterReactions === reactionContent
      ? { backgroundColor: theme.colors.border.subtle }
      : null,
  ];

  const getChipTextColor = (reactionContent: string | null) =>
    filterReactions === reactionContent
      ? { color: theme.colors.text.primary }
      : { color: theme.colors.text.secondary };

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
            style={getChipStyle(null)}
            underlayColor={theme.colors.border.subtle}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Show all reactions"
          >
            <HStack style={{ alignItems: "center" }}>
              <Text style={getChipTextColor(null)}>
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
              style={getChipStyle(reaction.content)}
              underlayColor={theme.colors.border.subtle}
              accessible
              accessibilityRole="button"
              accessibilityLabel={`${reaction.count} ${reaction.content} reactions`}
            >
              <Text style={getChipTextColor(reaction.content)}>
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
          contentContainerStyle={{ paddingBottom: insets.bottom }}
          data={rolledUpReactions.detailed.filter(
            (item) => !filterReactions || item.content === filterReactions
          )}
          renderItem={({ item, index }) => (
            <HStack
              key={`${item.content}-${item.reactor.address}-${index}`}
              style={styles.reaction}
            >
              <Avatar
                size={theme.avatarSize.md}
                uri={item.reactor.avatar}
                name={item.reactor.userName}
              />
              <Text style={styles.userName}>{item.reactor.userName}</Text>
              <Text style={styles.reactionContent}>{item.content}</Text>
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

const useStyles = () => {
  const { theme } = useAppTheme();

  return StyleSheet.create({
    chip: {
      marginRight: theme.spacing.xxs,
      marginBottom: theme.spacing.xs,
      paddingVertical: theme.spacing.xxs,
      paddingHorizontal: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
      borderWidth: theme.borderWidth.sm,
      borderColor: theme.colors.border.subtle,
    },
    reaction: {
      display: "flex",
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.lg,
      alignItems: "center",
      gap: theme.spacing.xs,
    },
    userName: {
      flex: 1,
      display: "flex",
      alignItems: "flex-end",
      gap: theme.spacing.xxxs,
      overflow: "hidden",
    },
    reactionContent: {
      padding: theme.spacing.xxxs,
    },
  });
};
