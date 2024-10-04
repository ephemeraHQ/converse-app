import { memo } from "react";

import { layout } from "../../theme";
import { Screen } from "../Screen/ScreenComp/Screen";
import { ScreenProps } from "../Screen/ScreenComp/Screen.props";

export const OnboardingScreen = memo(function OnboardingScreen(
  props: ScreenProps
) {
  const { contentContainerStyle, ...rest } = props;

  return (
    <Screen
      contentContainerStyle={[
        {
          paddingHorizontal: layout.screenHorizontalPadding,
        },
        contentContainerStyle,
      ]}
      {...rest}
    />
  );
});
