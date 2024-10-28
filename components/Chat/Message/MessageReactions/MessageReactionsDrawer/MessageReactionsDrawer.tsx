import { BottomSheetContentContainer } from "@design-system/BottomSheet/BottomSheetContentContainer";
import { BottomSheetHeader } from "@design-system/BottomSheet/BottomSheetHeader";
import { BottomSheetModal } from "@design-system/BottomSheet/BottomSheetModal";
import { HStack } from "@design-system/HStack";
import { ScrollView } from "@design-system/ScrollView";
import { Text } from "@design-system/Text";
import {
  BottomSheetModalProvider,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useAppTheme } from "@theme/useAppTheme";
import { memo, useCallback } from "react";
import { TouchableHighlight } from "react-native";
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
  }, []);

  return (
    <BottomSheetModalProvider>
      <BottomSheetModal
        onDismiss={handleDismiss}
        ref={bottomSheetModalRef}
        topInset={insets.top}
        snapPoints={["50%", "100%"]}
      >
        <BottomSheetContentContainer>
          <BottomSheetHeader title="Reactions" hasClose />
          <BottomSheetScrollView>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{
                paddingLeft: theme.spacing.lg,
                flexDirection: "row",
              }}
            >
              <Text>All {rolledUpReactions.totalReactions}</Text>
              {Object.entries(rolledUpReactions.details).map(
                ([emoji, details]) => (
                  <TouchableHighlight
                    key={emoji}
                    style={{
                      marginRight: 8,
                      padding: 8,
                      borderRadius: theme.borderRadius.sm,
                      backgroundColor: details.userReacted
                        ? theme.colors.fill.minimal
                        : theme.colors.background.raised,
                    }}
                    underlayColor={theme.colors.border.subtle}
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel={`${details.count} ${emoji} reactions`}
                  >
                    <HStack style={{ alignItems: "center" }}>
                      <Text>{emoji}</Text>
                      <Text>{details.count}</Text>
                    </HStack>
                  </TouchableHighlight>
                )
              )}
              <HStack style={{ width: theme.spacing.xxl }} />
            </ScrollView>
          </BottomSheetScrollView>
        </BottomSheetContentContainer>
      </BottomSheetModal>
    </BottomSheetModalProvider>
  );
});
