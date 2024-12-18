import { IVStackProps, VStack } from "@/design-system/VStack";
import { memo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const ConversationComposerContainer = memo(function (
  props: IVStackProps
) {
  const { style, ...rest } = props;

  const insets = useSafeAreaInsets();

  return (
    <VStack
      style={[
        {
          paddingBottom: insets.bottom,
          justifyContent: "flex-end",
          overflow: "hidden",
        },
        style,
      ]}
      {...rest}
    />
  );
});
