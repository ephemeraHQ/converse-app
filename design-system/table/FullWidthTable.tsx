import React, { memo } from "react";
import { View, ViewStyle, Switch } from "react-native";
import { Text } from "@/design-system/Text";
import { useAppTheme, ThemedStyle } from "@/theme/useAppTheme";
import { HStack } from "@/design-system/HStack";
import { VStack } from "@/design-system/VStack";

type IFullWidthTableRow = {
  label: string;
  value: string;
  onValueChange?: (value: boolean) => void;
  isSwitch?: boolean;
  isEnabled?: boolean;
};

type IFullWidthTableProps = {
  rows: IFullWidthTableRow[];
  editMode?: boolean;
};

export const FullWidthTable = memo(function FullWidthTable({
  rows,
  editMode,
}: IFullWidthTableProps) {
  const { theme, themed } = useAppTheme();

  return (
    <VStack style={themed($container)}>
      {rows.map((row, index) => (
        <View key={row.label} style={themed($sectionContainer)}>
          <HStack style={themed($rowContainer)}>
            <Text preset="formLabel" color="secondary">
              {row.label}
            </Text>
            {row.isSwitch ? (
              <Switch
                value={row.isEnabled}
                onValueChange={row.onValueChange}
                disabled={!editMode}
              />
            ) : (
              <HStack style={themed($valueContainer)}>
                <Text preset="body" color="primary">
                  {row.value}
                </Text>
                {editMode && <Text preset="body">›</Text>}
              </HStack>
            )}
          </HStack>
          {index !== rows.length - 1 && <View style={themed($separator)} />}
        </View>
      ))}
    </VStack>
  );
});

const $container: ThemedStyle<ViewStyle> = ({
  colors,
  spacing,
  borderWidth,
}) => ({
  backgroundColor: colors.background.surface,
  borderRadius: spacing.xs,
  borderWidth: borderWidth.sm,
  borderColor: colors.border.subtle,
  overflow: "hidden",
});

const $sectionContainer: ThemedStyle<ViewStyle> = () => ({
  width: "100%",
});

const $rowContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.lg,
  justifyContent: "space-between",
  alignItems: "center",
});

const $valueContainer: ThemedStyle<ViewStyle> = () => ({
  alignItems: "center",
});

const $separator: ThemedStyle<ViewStyle> = ({ colors, borderWidth }) => ({
  height: borderWidth.sm,
  backgroundColor: colors.border.subtle,
});
