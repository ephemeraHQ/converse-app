import { BottomSheetHeader } from "@design-system/BottomSheet/BottomSheetHeader";
import { BottomSheetModal } from "@design-system/BottomSheet/BottomSheetModal";
import { HStack } from "@design-system/HStack";
import { ScrollView } from "@design-system/ScrollView";
import { Text } from "@design-system/Text";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useAppTheme } from "@theme/useAppTheme";
import { getMessageReactions } from "@utils/reactions";
import { memo, useCallback } from "react";
import { TouchableHighlight } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCurrentAccount } from "../../../../../data/store/accountsStore";
import { BottomSheetContentContainer } from "../../../../../design-system/BottomSheet/BottomSheetContentContainer";
import { useMessageReactionsRolledup } from "../useMessageReactionsRolledup";
import { useMessageReactionsStore } from "./MessageReactions.store";
import { bottomSheetModalRef } from "./MessageReactionsDrawer.utils";

export const MessageReactionsDrawer = memo(function MessageReactionsDrawer() {
  const { theme } = useAppTheme();

  const userAddress = useCurrentAccount();

  const message = useMessageReactionsStore((state) => state.message);

  const insets = useSafeAreaInsets();

  const reactions = message ? getMessageReactions(message) : {};

  const rolledUpReactions = useMessageReactionsRolledup({
    reactions,
    userAddress: userAddress!, // ! If we are here, the user is logged in
  });

  const handleDismiss = useCallback(() => {
    useMessageReactionsStore.setState({ message: null });
  }, []);

  return (
    <BottomSheetModal
      onDismiss={handleDismiss}
      ref={bottomSheetModalRef}
      topInset={insets.top}
      snapPoints={["50%", "100%"]}
    >
      <BottomSheetContentContainer
        style={{
          height: 400,
        }}
      >
        <BottomSheetHeader title="Reactions" hasClose />
        <BottomSheetScrollView
          style={{
            backgroundColor: theme.colors.background.raised,
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{
              paddingLeft: theme.spacing.lg,
              flexDirection: "row",
              gap: 20,
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
  );
});
