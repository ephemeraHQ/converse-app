import React, { memo } from "react";
import { View, ViewStyle } from "react-native";
import { useAppTheme, ThemedStyle } from "@/theme/useAppTheme";
import { SettingsListRow } from "./settings-list-row";
import { ISettingsListRow } from "./settings-list.types";

type ISettingsListProps = {
  rows: ISettingsListRow[];
  editMode?: boolean;
};

export const SettingsList = memo(function SettingsList({
  rows,
  editMode,
}: ISettingsListProps) {
  const { themed } = useAppTheme();

  return (
    <View style={themed($container)}>
      {rows.map((row, index) => (
        <SettingsListRow
          key={row.label + index}
          row={row}
          editMode={editMode}
        />
      ))}
    </View>
  );
});

const $container: ThemedStyle<ViewStyle> = () => ({
  width: "100%",
});
