import { memo } from "react";

import { useAppTheme } from "../../theme/useAppTheme";
import { debugBorder } from "../../utils/debug";
import { HStack } from "../HStack";
import { IconButton } from "../IconButton";
import { Text } from "../Text";

export const BottomSheetHeader = memo(function BottomSheetHeader(props: {
  title: string;
  hasClose?: boolean;
}) {
  const { title, hasClose = true } = props;

  const { theme } = useAppTheme();

  return (
    <HStack
      {...debugBorder()}
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
          mode="outlined"
          size={theme.iconSize.sm}
          iconName="xmark"
        />
      )}
    </HStack>
  );
});
