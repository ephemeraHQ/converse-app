import { IVStackProps, VStack } from "@/design-system/VStack";
import { useAppTheme } from "@/theme/useAppTheme";
import { memo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const ConversationComposerContainer = memo(function (
  props: IVStackProps
) {
  const { style, ...rest } = props;

  const insets = useSafeAreaInsets();

  const { theme } = useAppTheme();

  return (
    <VStack
      // {...debugBorder()}
      style={[
        {
          paddingBottom: insets.bottom,
          justifyContent: "flex-end",
          overflow: "hidden",
          backgroundColor: theme.colors.background.surface,
        },
        style,
      ]}
      {...rest}
    />
  );
});
