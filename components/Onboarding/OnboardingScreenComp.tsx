import { memo } from "react";

import { useAppTheme } from "@theme/useAppTheme";
import { Screen } from "../Screen/ScreenComp/Screen";
import { IScreenProps } from "../Screen/ScreenComp/Screen.props";

export const OnboardingScreenComp = memo(function OnboardingScreenComp(
  props: IScreenProps
) {
  const { contentContainerStyle, ...rest } = props;

  const { theme } = useAppTheme();

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["bottom"]}
      contentContainerStyle={[
        {
          paddingHorizontal: theme.spacing.lg,
        },
        contentContainerStyle,
      ]}
      {...rest}
    />
  );
});
