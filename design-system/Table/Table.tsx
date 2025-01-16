import React, { memo } from "react";
import { View, ViewStyle } from "react-native";
import { useAppTheme, ThemedStyle } from "@/theme/useAppTheme";
import { VStack } from "@/design-system/VStack";
import { TableRow } from "./TableRow";
import { ITableRow } from "./Table.types";

type ITableProps = {
  rows: ITableRow[];
  editMode?: boolean;
};

export const Table = memo(function Table({ rows, editMode }: ITableProps) {
  const { themed } = useAppTheme();

  return (
    <VStack style={themed($container)}>
      {rows.map((row) => (
        <View key={row.label} style={themed($sectionContainer)}>
          <TableRow row={row} editMode={editMode} />
        </View>
      ))}
    </VStack>
  );
});

const $container: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background.surface,
  overflow: "hidden",
});

const $sectionContainer: ThemedStyle<ViewStyle> = () => ({
  width: "100%",
});
