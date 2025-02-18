import React from "react";
import { View } from "react-native";
import { Chip } from "./chip";
import { Icon } from "@/design-system/Icon/Icon";

export default {
  title: "Design System/Chip",
};

export function ChipExamples() {
  return (
    <View style={{ gap: 10, padding: 10 }}>
      {/* Basic usage with just text */}
      <Chip>
        <Chip.Text>Basic Chip</Chip.Text>
      </Chip>

      {/* With avatar and text */}
      <Chip>
        <Chip.Avatar uri="https://example.com/avatar.jpg" name="John Doe" />
        <Chip.Text>John Doe</Chip.Text>
      </Chip>

      {/* With custom icon */}
      <Chip>
        <Chip.Icon>
          <Icon icon="star" size={16} />
        </Chip.Icon>
        <Chip.Text>With Icon</Chip.Text>
      </Chip>

      {/* Filled variant */}
      <Chip variant="filled">
        <Chip.Text>Filled Chip</Chip.Text>
      </Chip>

      {/* Disabled state */}
      <Chip disabled>
        <Chip.Text>Disabled Chip</Chip.Text>
      </Chip>

      {/* Selected state with medium size */}
      <Chip size="md" isSelected>
        <Chip.Text>Selected (Medium)</Chip.Text>
      </Chip>

      {/* Interactive chip with onPress */}
      <Chip onPress={() => alert("Chip pressed!")}>
        <Chip.Text>Pressable Chip</Chip.Text>
      </Chip>

      {/* Combination of multiple props */}
      <Chip
        variant="filled"
        size="md"
        isSelected
        onPress={() => alert("Complex chip pressed!")}
      >
        <Chip.Avatar uri="https://example.com/avatar.jpg" name="Jane Smith" />
        <Chip.Icon>
          <Icon icon="checkmark" size={16} />
        </Chip.Icon>
        <Chip.Text>Complex Chip</Chip.Text>
      </Chip>
    </View>
  );
}
