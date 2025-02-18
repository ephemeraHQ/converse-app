import { Chip } from "@/design-system/chip";
import React from "react";
import { View } from "react-native";

type IConversationRequestsToggleProps = {
  options: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

export function ConversationRequestsToggle({
  options,
  selectedIndex,
  onSelect,
}: IConversationRequestsToggleProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 8,
        marginBottom: 12,
        marginHorizontal: 12,
      }}
    >
      {options.map((option, index) => (
        <View key={index} style={{ flex: 1 }}>
          <Chip
            key={index}
            name={option}
            isSelected={index === selectedIndex}
            onPress={() => onSelect(index)}
            showAvatar={false}
          />
        </View>
      ))}
    </View>
  );
}
