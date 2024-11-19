import { memo } from "react";
import { useAppTheme } from "../../theme/useAppTheme";
import { VStack } from "../VStack";
import { Text } from "./Text";

export const TextExample = memo(function TextExample() {
  const { theme } = useAppTheme();

  return (
    <VStack
      style={{
        paddingHorizontal: theme.spacing.lg,
        rowGap: theme.spacing.lg,
      }}
    >
      {/* Preset examples */}
      <VStack style={{ rowGap: theme.spacing.sm }}>
        <Text preset="title">Title Preset</Text>
        <Text preset="body">Body Preset - Main content text</Text>
        <Text preset="bodyBold">Body Bold Preset</Text>
        <Text preset="small">Small Preset</Text>
        <Text preset="smaller">Smaller Preset</Text>
      </VStack>

      {/* Preset with color overrides */}
      <VStack style={{ rowGap: theme.spacing.sm }}>
        <Text preset="title" color="primary">
          Colored Title
        </Text>
        <Text preset="body" color="secondary">
          Colored Body Text
        </Text>
        <Text preset="smallerBold" color="caution">
          Warning Text
        </Text>
      </VStack>

      {/* Preset with weight overrides */}
      <VStack style={{ rowGap: theme.spacing.sm }}>
        <Text preset="bigBold">Big Bold Text</Text>
        <Text preset="formLabel">Form Label Text</Text>
        <Text preset="formHelper">Form Helper Text</Text>
      </VStack>

      {/* Common use cases */}
      <VStack style={{ rowGap: theme.spacing.sm }}>
        <Text preset="title">Product Details</Text>
        <Text preset="bigBold" color="primary">
          $99.99
        </Text>
        <Text preset="body">High-quality product with amazing features</Text>
        <Text preset="formHelper">In stock - Ships in 2-3 days</Text>
      </VStack>
    </VStack>
  );
});
