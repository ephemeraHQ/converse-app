import React from "react"
import { View } from "react-native"
import { Icon } from "@/design-system/Icon/Icon"
import { Chip, ChipAvatar, ChipIcon, ChipText } from "./chip"

export default {
  title: "Design System/Chip",
}

export function ChipExamples() {
  return (
    <View style={{ gap: 10, padding: 10 }}>
      {/* Basic usage with just text */}
      <Chip>
        <ChipText>Basic Chip</ChipText>
      </Chip>

      {/* With avatar and text */}
      <Chip>
        <ChipAvatar uri="https://example.com/avatar.jpg" name="John Doe" />
        <ChipText>John Doe</ChipText>
      </Chip>

      {/* With custom icon */}
      <Chip>
        <ChipIcon>
          <Icon icon="star" size={16} />
        </ChipIcon>
        <ChipText>With Icon</ChipText>
      </Chip>

      {/* Filled variant */}
      <Chip variant="filled">
        <ChipText>Filled Chip</ChipText>
      </Chip>

      {/* Disabled state */}
      <Chip disabled>
        <ChipText>Disabled Chip</ChipText>
      </Chip>

      {/* Selected state with medium size */}
      <Chip size="md" isSelected>
        <ChipText>Selected (Medium)</ChipText>
      </Chip>

      {/* Interactive chip with onPress */}
      <Chip onPress={() => alert("Chip pressed!")}>
        <ChipText>Pressable Chip</ChipText>
      </Chip>

      {/* Combination of multiple props */}
      <Chip variant="filled" size="md" isSelected onPress={() => alert("Complex chip pressed!")}>
        <ChipAvatar uri="https://example.com/avatar.jpg" name="Jane Smith" />
        <ChipIcon>
          <Icon icon="checkmark" size={16} />
        </ChipIcon>
        <ChipText>Complex Chip</ChipText>
      </Chip>
    </View>
  )
}
