import { memo } from "react";

import { spacing } from "../../theme";
import { Screen } from "../Screen/ScreenComp/Screen";
import { IScreenProps } from "../Screen/ScreenComp/Screen.props";

export const OnboardingScreenComp = memo(function OnboardingScreenComp(
  props: IScreenProps
) {
  const { contentContainerStyle, ...rest } = props;

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["bottom"]}
      contentContainerStyle={[
        {
          paddingHorizontal: spacing.lg,
        },
        contentContainerStyle,
      ]}
      {...rest}
    />
  );
});
