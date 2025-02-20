/**
 * Very minimalistic empty state component.
 * Feel free to extend it and add more props.
 */

import { Icon } from "@/design-system/Icon/Icon";
import { IIconName } from "@/design-system/Icon/Icon.types";
import { Text } from "@/design-system/Text";
import { IVStackProps, VStack } from "@/design-system/VStack";
import { useAppTheme } from "@/theme/use-app-theme";
import { memo } from "react";
import { View } from "react-native";

type IEmptyStateProps = {
  title?: string;
  description?: string;
  iconName?: IIconName;
  icon?: React.ReactNode;
  containerStyle?: IVStackProps["style"];
  style?: IVStackProps["style"];
};

export const EmptyState = memo(function EmptyState({
  title,
  description,
  iconName,
  icon,
  containerStyle,
  style,
}: IEmptyStateProps) {
  const { theme } = useAppTheme();

  return (
    <VStack
      style={[
        {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: theme.spacing.lg,
        },
        containerStyle,
        style,
      ]}
    >
      {(icon || iconName) && (
        <View style={{ marginBottom: theme.spacing.md }}>
          {icon ||
            (iconName && <Icon icon={iconName} size={theme.iconSize.lg} />)}
        </View>
      )}

      {title && (
        <Text
          preset="title"
          style={{
            textAlign: "center",
            marginBottom: theme.spacing.xs,
          }}
        >
          {title}
        </Text>
      )}

      {description && (
        <Text
          color="secondary"
          style={{
            textAlign: "center",
          }}
        >
          {description}
        </Text>
      )}
    </VStack>
  );
});
