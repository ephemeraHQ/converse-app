import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { Avatar, IAvatarProps } from "@/components/avatar";
import { Center } from "@/design-system/Center";
import { Pressable } from "@/design-system/Pressable";
import { ITextProps, Text } from "@/design-system/Text";
import { useAppTheme } from "@/theme/use-app-theme";

type IChipSize = "xs" | "sm" | "md";

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
  const styles = useChipStyles({ variant, size });

  return (
    <ChipContext.Provider value={{ size, disabled, isSelected }}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={[
          styles.$container,
          isSelected && styles.$selectedContainer,
          disabled && styles.$disabledContainer,
        ]}
      >
        <Center style={styles.$content}>{children}</Center>
      </Pressable>
    </ChipContext.Provider>
  );
}

type IChipTextProps = ITextProps;

export function ChipText({ children, style }: IChipTextProps) {
  const { size, disabled, isSelected } = useChipContext();
  const styles = useChipStyles({ variant: "outlined", size });

  return (
    <Text
      preset={size === "xs" ? "smaller" : size === "sm" ? "small" : "body"}
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

type IChipAvatarProps = IAvatarProps;

export function ChipAvatar({ uri, name }: IChipAvatarProps) {
  const { theme } = useAppTheme();
  return <Avatar uri={uri} name={name} size={theme.avatarSize.xs} />;
}

export function useChipStyles({
  variant,
  size = "sm",
}: {
  variant: "filled" | "outlined";
  size?: IChipSize;
}) {
  const { theme } = useAppTheme();

  const verticalPadding =
    size === "xs" ? theme.spacing.xxxs : theme.spacing.xxs;

  const horizontalPadding =
    size === "xs" ? theme.spacing.xxs : theme.spacing.xs;

  const contentHeight = size === "xs" ? theme.spacing.sm : theme.spacing.md;

  const $container = {
    borderRadius: theme.spacing.xs,
    borderWidth: variant === "outlined" ? theme.borderWidth.sm : 0,
    borderColor: theme.colors.border.subtle,
    backgroundColor:
      variant === "outlined"
        ? theme.colors.background.surface
        : theme.colors.fill.minimal,
    paddingVertical:
      verticalPadding - (variant === "outlined" ? theme.borderWidth.sm * 2 : 0),
    paddingHorizontal: horizontalPadding,
  } satisfies StyleProp<ViewStyle>;

  const $content = {
    columnGap: theme.spacing.xxxs,
    height: contentHeight,
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
