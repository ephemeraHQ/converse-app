import React from "react"
import { View } from "react-native"
import { Chip, ChipText } from "@/design-system/chip"
import { HStack } from "@/design-system/HStack"
import { useAppTheme } from "@/theme/use-app-theme"

type IConversationRequestsToggleProps = {
  options: string[]
  selectedIndex: number
  onSelect: (index: number) => void
}

export function ConversationRequestsToggle({
  options,
  selectedIndex,
  onSelect,
}: IConversationRequestsToggleProps) {
  const { theme } = useAppTheme()

  return (
    <HStack
      style={{
        gap: theme.spacing.xxs,
        marginBottom: theme.spacing.xs,
        marginHorizontal: theme.spacing.xs,
      }}
    >
      {options.map((option, index) => (
        <View key={index} style={{ flex: 1 }}>
          <Chip key={index} isSelected={index === selectedIndex} onPress={() => onSelect(index)}>
            <ChipText>{option}</ChipText>
          </Chip>
        </View>
      ))}
    </HStack>
  )
}
