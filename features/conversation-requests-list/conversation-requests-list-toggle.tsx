import { Chip } from "@/design-system/chip";
import { useAppTheme } from "@/theme/useAppTheme";
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
  const { theme } = useAppTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        gap: theme.spacing.xxs,
        marginBottom: theme.spacing.xs,
        marginHorizontal: theme.spacing.xs,
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
