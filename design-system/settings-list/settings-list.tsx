import React, { memo } from "react"
import { View, ViewStyle } from "react-native"
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme"
import { SettingsListRow } from "./settings-list-row"
import { ISettingsListRow } from "./settings-list.types"

type ISettingsListProps = {
  rows: ISettingsListRow[]
}

export const SettingsList = memo(function SettingsList({ rows }: ISettingsListProps) {
  const { themed } = useAppTheme()

  return (
    <View style={themed($container)}>
      {rows.map((row, index) => (
        <SettingsListRow key={row.label + index} row={row} />
      ))}
    </View>
  )
})

const $container: ThemedStyle<ViewStyle> = () => ({
  width: "100%",
})
