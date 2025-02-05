import { IconButton } from "@design-system/IconButton/IconButton";
import { VStack } from "@design-system/VStack";
import { useAppTheme } from "@theme/useAppTheme";
import React, { memo } from "react";
import { useConversationComposerStoreContext } from "./conversation-composer.store-context";

export const SendButton = memo(function SendButton(props: {
  onPress: () => void;
}) {
  const { onPress } = props;

  const { theme } = useAppTheme();

  const mediaPreview = useConversationComposerStoreContext(
    (state) => state.composerMediaPreview
  );
  const composerInputValue = useConversationComposerStoreContext(
    (state) => state.inputValue
  );

  const canSend =
    composerInputValue.length > 0 || mediaPreview?.status === "uploaded";

  const margin = (36 - theme.spacing.lg) / 2 - theme.borderWidth.sm;

  return (
    <VStack
      style={{
        marginHorizontal: margin,
        marginVertical: margin,
        alignSelf: "flex-end",
      }}
    >
      <IconButton
        hitSlop={theme.spacing.xs}
        size="sm"
        onPress={onPress}
        disabled={!canSend}
        iconName="arrow.up"
      />
    </VStack>
  );
});
