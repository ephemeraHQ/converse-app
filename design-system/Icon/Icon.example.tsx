import { HStack } from "@design-system/HStack"
import { Text } from "@design-system/Text"
import { VStack } from "@design-system/VStack"
import { ScrollView } from "react-native"
import { useAppTheme } from "@/theme/use-app-theme"
import { Icon, iconRegistry } from "./Icon"

type IExampleProps = {
  onPress?: () => void
}

export function IconExample(args: IExampleProps) {
  const { theme } = useAppTheme()

  return (
    <ScrollView>
      <VStack
        style={{
          gap: theme.spacing.md,
          backgroundColor: theme.colors.background.raised,
          padding: theme.spacing.md,
        }}
      >
        {/* Different Sizes */}
        <Text preset="body">Icon Sizes</Text>
        <HStack style={{ gap: theme.spacing.md, alignItems: "center" }}>
          <Icon icon="star" size={theme.iconSize.xs} />
          <Icon icon="star" size={theme.iconSize.sm} />
          <Icon icon="star" size={theme.iconSize.md} />
          <Icon icon="star" size={theme.iconSize.lg} />
        </HStack>

        {/* Different Colors */}
        <Text preset="body">Icon Colors</Text>
        <HStack style={{ gap: theme.spacing.md, alignItems: "center" }}>
          <Icon icon="star" color={theme.colors.fill.primary} />
          <Icon icon="star" color={theme.colors.fill.secondary} />
          <Icon icon="star" color={theme.colors.fill.caution} />
          <Icon icon="star" color={theme.colors.fill.accent} />
        </HStack>

        {/* All Available Icons */}
        <Text preset="body">All Icons</Text>
        <VStack style={{ gap: theme.spacing.sm }}>
          {Object.entries(iconRegistry).map(([key, value]) => (
            <HStack
              key={key}
              style={{
                gap: theme.spacing.md,
                alignItems: "center",
                padding: theme.spacing.sm,
                backgroundColor: theme.colors.background.surfaceless,
                borderRadius: theme.borderRadius.sm,
              }}
            >
              <Icon icon={key as keyof typeof iconRegistry} />
              <Text>{key}</Text>
            </HStack>
          ))}
        </VStack>
      </VStack>
    </ScrollView>
  )
}
