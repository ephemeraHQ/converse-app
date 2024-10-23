import { TableViewPicto } from "@components/TableView/TableViewImage";
import { textSecondaryColor } from "@styles/colors";
import React from "react";
import { useColorScheme } from "react-native";

export function RightViewChevron() {
  const colorScheme = useColorScheme();

  return (
    <TableViewPicto
      symbol="chevron.right"
      color={textSecondaryColor(colorScheme)}
    />
  );
}
