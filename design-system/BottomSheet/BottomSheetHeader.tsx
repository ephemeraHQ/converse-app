import { memo, useCallback } from "react";

import { useAppTheme } from "../../theme/useAppTheme";
import { HStack } from "../HStack";
import { IconButton } from "../IconButton/IconButton";
import { Text } from "../Text";
import { useBottomSheet } from "./BottomSheet.utils";

export const BottomSheetHeader = memo(function BottomSheetHeader(props: {
  title: string;
  hasClose?: boolean;
}) {
  const { title, hasClose = true } = props;

  const { close } = useBottomSheet();

  const { theme } = useAppTheme();

  const handleClose = useCallback(() => {
    close();
  }, [close]);

  return (
    <HStack
      // {...debugBorder()}
      style={{
        justifyContent: "space-between",
        alignItems: "center",
        padding: theme.spacing.lg,
      }}
    >
      <Text preset="bigBold">{title}</Text>
      {hasClose && (
        <IconButton
          action="primary"
          variant="subtle"
          size="md"
          iconName="xmark"
          onPress={handleClose}
          style={{
            borderRadius: theme.borderRadius.md,
          }}
        />
      )}
    </HStack>
  );
});
