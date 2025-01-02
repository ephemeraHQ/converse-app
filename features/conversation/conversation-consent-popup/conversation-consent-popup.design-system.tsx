import { IButtonProps } from "@/design-system/Button/Button.props";
import { ITextProps, Text } from "@/design-system/Text";
import { IVStackProps, VStack } from "@/design-system/VStack";
import { useAppTheme } from "@/theme/useAppTheme";
import { Button } from "@design-system/Button/Button";
import React from "react";

export function ConsentPopupButton({ style, ...rest }: IButtonProps) {
  const { theme } = useAppTheme();
  return <Button withHapticFeedback={true} {...rest} />;
}

export function ConsentPopupTitle(props: ITextProps) {
  return <Text {...props} />;
}

export function ConsentPopupButtonsContainer({
  children,
  style,
  ...rest
}: IVStackProps) {
  const { theme } = useAppTheme();

  return (
    <VStack
      style={[
        {
          flexDirection: "row",
          justifyContent: "center",
          marginTop: theme.spacing.xs,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </VStack>
  );
}

export function ConsentPopupContainer({
  children,
  style,
  ...rest
}: IVStackProps) {
  const { theme } = useAppTheme();

  return (
    <VStack
      style={[
        {
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.md,
          marginTop: theme.spacing.md,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </VStack>
  );
}
