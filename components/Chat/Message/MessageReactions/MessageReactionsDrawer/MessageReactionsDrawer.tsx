import { BottomSheetContentContainer } from "@design-system/BottomSheet/BottomSheetContentContainer";
import { BottomSheetHeader } from "@design-system/BottomSheet/BottomSheetHeader";
import { BottomSheetModal } from "@design-system/BottomSheet/BottomSheetModal";
import { HStack } from "@design-system/HStack";
import { Text } from "@design-system/Text";
import { VStack } from "@design-system/VStack";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useAppTheme } from "@theme/useAppTheme";
import { memo, useCallback, useState } from "react";
import { TouchableHighlight } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  bottomSheetModalRef,
  resetMessageReactionsDrawer,
  useMessageReactionsRolledUpReactions,
} from "./MessageReactionsDrawer.service";

export const MessageReactionsDrawer = memo(function MessageReactionsDrawer() {
  const { theme } = useAppTheme();

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
            style={{
              marginRight: 8,
              padding: 8,
              borderRadius: theme.borderRadius.sm,
              backgroundColor:
                filterReactions === null
                  ? theme.colors.fill.minimal
                  : theme.colors.background.raised,
            }}
            underlayColor={theme.colors.border.subtle}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Show all reactions"
          >
            <HStack style={{ alignItems: "center" }}>
              <Text>All</Text>
              <Text>{rolledUpReactions.totalCount}</Text>
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
              style={{
                marginRight: 8,
                padding: 8,
                borderRadius: theme.borderRadius.sm,
                backgroundColor:
                  filterReactions === reaction.content
                    ? theme.colors.fill.minimal
                    : theme.colors.background.raised,
              }}
              underlayColor={theme.colors.border.subtle}
              accessible
              accessibilityRole="button"
              accessibilityLabel={`${reaction.count} ${reaction.content} reactions`}
            >
              <HStack style={{ alignItems: "center" }}>
                <Text>{reaction.content}</Text>
                <Text>{reaction.count}</Text>
              </HStack>
            </TouchableHighlight>
          ))}
          <HStack style={{ width: theme.spacing.xxl }} />
        </ScrollView>

        {/* Detailed list of each reaction, sorted with all OWN reactions on top, filtered by content */}
        <BottomSheetScrollView>
          <VStack style={{ padding: theme.spacing.md }}>
            {rolledUpReactions.detailed
              .filter(
                (item) => !filterReactions || item.content === filterReactions
              )
              .map((item, idx) => (
                <HStack
                  key={`${item.content}-${item.reactor.address}-${idx}`}
                  style={{
                    alignItems: "center",
                    paddingVertical: theme.spacing.sm,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border.subtle,
                    backgroundColor: item.isOwnReaction
                      ? theme.colors.fill.minimal
                      : theme.colors.background.sunken,
                  }}
                >
                  <Text style={{ marginRight: theme.spacing.sm }}>
                    {item.content}
                  </Text>
                  <Text
                    style={{
                      fontWeight: "bold",
                      marginRight: theme.spacing.sm,
                    }}
                  >
                    {item.reactor.userName}
                  </Text>
                  <Text>{item.reactor.address}</Text>
                </HStack>
              ))}
          </VStack>
        </BottomSheetScrollView>
      </BottomSheetContentContainer>
    </BottomSheetModal>
  );
});
