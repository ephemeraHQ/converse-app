import React, { memo } from "react";
import { View, ViewStyle, Switch, TouchableOpacity } from "react-native";
import { Text } from "@/design-system/Text";
import { useAppTheme, ThemedStyle } from "@/theme/useAppTheme";
import { HStack } from "@/design-system/HStack";
import { VStack } from "@/design-system/VStack";
import { Icon } from "@/design-system/Icon/Icon";
import { ISettingsListRow } from "./settings-list.types";

type ISettingsListRowProps = {
  row: ISettingsListRow;
  editMode?: boolean;
};

export const SettingsListRow = memo(function SettingsListRow({
  row,
  editMode,
}: ISettingsListRowProps) {
  const { theme, themed } = useAppTheme();

  const content = (
    <HStack style={themed($innerRowContainer)}>
      <VStack style={{ flex: 1 }}>
        <Text color={row.isWarning ? "caution" : "primary"}>{row.label}</Text>
        {row.value && (
          <Text
            preset="formLabel"
            color={row.isWarning ? "caution" : "secondary"}
          >
            {row.value}
          </Text>
        )}
      </VStack>
      <View style={themed($rightContentContainer)}>
        {row.isSwitch ? (
          <Switch
            value={!!row.value}
            onValueChange={row.onValueChange}
            disabled={row.disabled}
          />
        ) : (
          <Icon
            icon="chevron.right"
            size={theme.iconSize.sm}
            color={theme.colors.text.secondary}
          />
        )}
      </View>
    </HStack>
  );

  if (row.onPress) {
    return (
      <TouchableOpacity style={themed($rowContainer)} onPress={row.onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return <HStack style={themed($rowContainer)}>{content}</HStack>;
});

const $rowContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.md,
  width: "100%",
  flexDirection: "row",
  alignItems: "center",
});

const $innerRowContainer: ThemedStyle<ViewStyle> = () => ({
  width: "100%",
  justifyContent: "space-between",
  alignItems: "center",
});

const $rightContentContainer: ThemedStyle<ViewStyle> = () => ({
  marginLeft: "auto",
  alignItems: "flex-end",
  justifyContent: "center",
});
