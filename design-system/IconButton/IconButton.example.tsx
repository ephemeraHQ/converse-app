import { memo } from "react";

import { useAppTheme } from "../../theme/useAppTheme";
import { HStack } from "../HStack";
import { VStack } from "../VStack";
import { IconButton } from "./IconButton";

export const IconButtonExample = memo(function IconButtonExample() {
  const { theme } = useAppTheme();

  return (
    <VStack
      style={{
        rowGap: theme.spacing.md,
        paddingTop: theme.spacing["4xl"],
      }}
    >
      <VStack style={{ rowGap: theme.spacing.md }}>
        {/* Fill Variant */}
        <HStack style={{ columnGap: theme.spacing.sm }}>
          <IconButton variant="fill" iconName="star" />
          <IconButton variant="fill" iconName="star" disabled />
          <IconButton
            variant="fill"
            iconName="star"
            action="primary"
            size="lg"
          />
        </HStack>

        {/* Outline Variant */}
        <HStack style={{ columnGap: theme.spacing.sm }}>
          <IconButton variant="outline" iconName="star" />
          <IconButton variant="outline" iconName="star" disabled />
          <IconButton variant="outline" iconName="star" size="lg" />
        </HStack>

        {/* Ghost Variant */}
        <HStack style={{ columnGap: theme.spacing.sm }}>
          <IconButton variant="ghost" iconName="star" />
          <IconButton variant="ghost" iconName="star" disabled />
          <IconButton variant="ghost" iconName="star" size="lg" />
        </HStack>
      </VStack>
    </VStack>
  );
});
