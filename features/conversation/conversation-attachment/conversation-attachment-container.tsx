import { IVStackProps, VStack } from "@design-system/VStack";
import { useAppTheme } from "@theme/useAppTheme";
import { memo } from "react";

export const AttachmentContainer = memo(function AttachmentContainer(
  props: IVStackProps
) {
  const { style, ...rest } = props;

  const { theme } = useAppTheme();

  return (
    <VStack
      style={[
        {
          overflow: "hidden",
          borderRadius: theme.borderRadius.sm,
          width: "100%",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.fill.tertiary,
          aspectRatio: 1.5, // Default aspect ratio for attachments
        },
        style,
      ]}
      {...rest}
    />
  );
});
