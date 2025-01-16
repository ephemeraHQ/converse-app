import React, { memo } from "react";
import { View, ViewStyle, Switch, TouchableOpacity } from "react-native";
import { Text } from "@/design-system/Text";
import { useAppTheme, ThemedStyle } from "@/theme/useAppTheme";
import { HStack } from "@/design-system/HStack";
import { VStack } from "@/design-system/VStack";
import { Icon } from "@/design-system/Icon/Icon";
import { ITableRow } from "./Table.types";

type ITableRowProps = {
  row: ITableRow;
  editMode?: boolean;
};

export const TableRow = memo(function TableRow({
  row,
  editMode,
}: ITableRowProps) {
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
            value={row.isEnabled}
            onValueChange={row.onValueChange}
            disabled={!editMode}
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

  return row.onPress ? (
    <TouchableOpacity style={themed($rowContainer)} onPress={row.onPress}>
      {content}
    </TouchableOpacity>
  ) : (
    <HStack style={themed($rowContainer)}>{content}</HStack>
  );
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
