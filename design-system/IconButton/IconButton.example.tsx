import { memo } from "react"
import { useAppTheme } from "../../theme/use-app-theme"
import { HStack } from "../HStack"
import { Text } from "../Text/Text"
import { VStack } from "../VStack"
import { IconButton } from "./IconButton"

export const IconButtonExample = memo(function IconButtonExample() {
  const { theme } = useAppTheme()

  return (
    <VStack
      style={{
        paddingHorizontal: theme.spacing.lg,
        rowGap: theme.spacing.lg,
      }}
    >
      {/* Default variants */}
      <VStack style={{ rowGap: theme.spacing.sm }}>
        <Text>Default Size</Text>
        <HStack style={{ columnGap: theme.spacing.sm }}>
          <IconButton variant="fill" iconName="star" />
          <IconButton variant="outline" iconName="star" />
          <IconButton variant="ghost" iconName="star" />
        </HStack>
      </VStack>

      {/* Large size */}
      <VStack style={{ rowGap: theme.spacing.sm }}>
        <Text>Large Size</Text>
        <HStack style={{ columnGap: theme.spacing.sm }}>
          <IconButton variant="fill" iconName="star" size="lg" />
          <IconButton variant="outline" iconName="star" size="lg" />
          <IconButton variant="ghost" iconName="star" size="lg" />
        </HStack>
      </VStack>

      {/* Different actions */}
      <VStack style={{ rowGap: theme.spacing.sm }}>
        <Text>Actions</Text>
        <HStack style={{ columnGap: theme.spacing.sm }}>
          <IconButton variant="fill" iconName="star" action="primary" />
          <IconButton variant="fill" iconName="hand.wave" />
          <IconButton variant="fill" iconName="xmark" action="danger" />
        </HStack>
      </VStack>

      {/* Disabled state */}
      <VStack style={{ rowGap: theme.spacing.sm }}>
        <Text>Disabled</Text>
        <HStack style={{ columnGap: theme.spacing.sm }}>
          <IconButton variant="fill" iconName="star" disabled />
          <IconButton variant="outline" iconName="star" disabled />
          <IconButton variant="ghost" iconName="star" disabled />
        </HStack>
      </VStack>

      {/* Common use cases */}
      <VStack style={{ rowGap: theme.spacing.sm }}>
        <Text>Common Use Cases</Text>
        <HStack style={{ columnGap: theme.spacing.sm }}>
          <IconButton variant="ghost" iconName="magnifyingglass" />
          <IconButton variant="ghost" iconName="message" />
          <IconButton variant="ghost" iconName="gear" />
          <IconButton variant="ghost" iconName="trash" action="danger" />
        </HStack>
      </VStack>
    </VStack>
  )
})
