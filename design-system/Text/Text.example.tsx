import { memo } from "react"
import { useAppTheme } from "../../theme/use-app-theme"
import { VStack } from "../VStack"
import { Text } from "./Text"

export const TextExample = memo(function TextExample() {
  const { theme } = useAppTheme()

  return (
    <VStack
      style={{
        paddingHorizontal: theme.spacing.lg,
        rowGap: theme.spacing.lg,
      }}
    >
      {/* Preset examples */}
      <VStack style={{ rowGap: theme.spacing.sm }}>
        <Text preset="title">Title Preset - Large Headers</Text>
        <Text preset="body">
          Body Preset - Main content text that flows naturally in paragraphs
        </Text>
        <Text preset="bodyBold">Body Bold Preset - Emphasized content</Text>
        <Text preset="small">Small Preset - Less prominent information</Text>
        <Text preset="smaller">Smaller Preset - Fine print and subtle details</Text>
        <Text preset="smallerBold">Smaller Bold Preset - Important fine print</Text>
        <Text preset="bigBold">Big Bold Preset - Strong emphasis</Text>
        <Text preset="formLabel">Form Label Preset - Input field labels</Text>
        <Text preset="formHelper">Form Helper Preset - Additional form context</Text>
        <Text preset="emojiSymbol">👋</Text>
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
        <Text preset="formLabel">Password</Text>
        <Text preset="body">••••••••</Text>
        <Text preset="formHelper" color="caution">
          Password must be at least 8 characters
        </Text>
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

      {/* Product Card Example */}
      <VStack style={{ rowGap: theme.spacing.sm }}>
        <Text preset="bigBold">Premium Package</Text>
        <Text preset="body">Access to all premium features</Text>
        <Text preset="smallerBold" color="primary">
          SAVE 20%
        </Text>
        <Text preset="small" color="secondary">
          Valid until Dec 31, 2024
        </Text>
      </VStack>

      {/* Alert Examples */}
      <VStack style={{ rowGap: theme.spacing.sm }}>
        <Text preset="bodyBold" color="primary">
          ✓ Payment Successful
        </Text>
        <Text preset="bodyBold" color="secondary">
          ⚠ Connection Lost
        </Text>
        <Text preset="bodyBold" color="caution">
          ⚡ Low Battery
        </Text>
        <Text preset="smaller" color="tertiary">
          Last updated: 5 mins ago
        </Text>
      </VStack>

      {/* Emoji Usage */}
      <VStack style={{ rowGap: theme.spacing.sm }}>
        <Text preset="emojiSymbol">🎉 Congratulations!</Text>
        <Text preset="emojiSymbol">⭐️ New Achievement</Text>
        <Text preset="emojiSymbol">🎮 Gaming Mode</Text>
      </VStack>
    </VStack>
  )
})
