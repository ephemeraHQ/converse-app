import { Avatar } from "@/components/Avatar";
import { Center } from "@/design-system/Center";
import { Text } from "@/design-system/Text";
import { useAppTheme } from "@/theme/useAppTheme";
import React from "react";
import { StyleProp, ViewStyle, TextStyle } from "react-native";
import { AnimatedPressable } from "@design-system/Pressable";

type IChipSize = "sm" | "md";

const ChipContext = React.createContext<{
  size: IChipSize;
  disabled?: boolean;
  isSelected?: boolean;
} | null>(null);

function useChipContext() {
  const context = React.useContext(ChipContext);
  if (!context) {
    throw new Error("Chip components must be used within a Chip");
  }
  return context;
}

type IChipProps = {
  isSelected?: boolean;
  onPress?: () => void;
  size?: IChipSize;
  disabled?: boolean;
  variant?: "filled" | "outlined";
  children: React.ReactNode;
};

export function Chip({
  children,
  isSelected,
  onPress,
  size = "sm",
  disabled,
  variant = "outlined",
}: IChipProps) {
  const styles = useChipStyles({ variant });

  return (
    <ChipContext.Provider value={{ size, disabled, isSelected }}>
      <AnimatedPressable
        onPress={onPress}
        disabled={disabled}
        style={() => [
          styles.$container,
          isSelected && styles.$selectedContainer,
          disabled && styles.$disabledContainer,
        ]}
      >
        <Center style={styles.$content}>{children}</Center>
      </AnimatedPressable>
    </ChipContext.Provider>
  );
}

type IChipTextProps = {
  children: string;
  style?: StyleProp<TextStyle>;
};

export function ChipText({ children, style }: IChipTextProps) {
  const { size, disabled, isSelected } = useChipContext();
  const styles = useChipStyles({ variant: "outlined" });

  return (
    <Text
      preset={size === "sm" ? "small" : "body"}
      style={[
        style,
        disabled && styles.$disabledText,
        isSelected && styles.$selectedText,
      ]}
    >
      {children}
    </Text>
  );
}

type IChipIconProps = {
  children: React.ReactNode;
};

export function ChipIcon({ children }: IChipIconProps) {
  return children;
}

type IChipAvatarProps = {
  uri?: string;
  name: string;
};

export function ChipAvatar({ uri, name }: IChipAvatarProps) {
  const { theme } = useAppTheme();
  return <Avatar uri={uri} name={name} size={theme.avatarSize.xs} />;
}

export function useChipStyles({ variant }: { variant: "filled" | "outlined" }) {
  const { theme } = useAppTheme();

  const $container = {
    borderRadius: theme.spacing.xs,
    borderWidth: variant === "outlined" ? theme.borderWidth.sm : 0,
    borderColor: theme.colors.border.subtle,
    backgroundColor:
      variant === "outlined"
        ? theme.colors.background.surface
        : theme.colors.fill.minimal,
    paddingVertical:
      theme.spacing.xxs -
      (variant === "outlined" ? theme.borderWidth.sm * 2 : 0),
    paddingHorizontal: theme.spacing.xs,
  } satisfies StyleProp<ViewStyle>;

  const $content = {
    columnGap: theme.spacing.xxxs,
    height: theme.spacing.md,
  } satisfies StyleProp<ViewStyle>;

  return {
    // Constants calculated using the style values
    constants: {
      chipHeight: $container.paddingVertical * 2 + $content.height,
    },
    // Styles with $ prefix
    $container,
    $selectedContainer: {
      backgroundColor: theme.colors.fill.minimal,
      borderColor:
        variant === "outlined" ? theme.colors.fill.minimal : "transparent",
    },
    $content,
    $disabledContainer: {
      opacity: 0.5,
    },
    $disabledText: {
      color: theme.colors.text.inactive,
    },
    $selectedText: {
      color: theme.colors.text.primary,
    },
  } as const;
}

// Add Chip compound components to the main export
Chip.Text = ChipText;
Chip.Icon = ChipIcon;
Chip.Avatar = ChipAvatar;
