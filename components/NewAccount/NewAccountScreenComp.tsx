import { useAppTheme } from "@theme/useAppTheme";
import { memo } from "react";
import { Screen } from "../Screen/ScreenComp/Screen";
import { IScreenProps } from "../Screen/ScreenComp/Screen.props";

export const NewAccountScreenComp = memo(function (props: IScreenProps) {
  const { contentContainerStyle, ...restProps } = props;
  const { theme } = useAppTheme();

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["bottom"]}
      contentContainerStyle={[
        {
          paddingHorizontal: theme.spacing.md,
        },
        contentContainerStyle,
      ]}
      {...restProps}
    />
  );
});
