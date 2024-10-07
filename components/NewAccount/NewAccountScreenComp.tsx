import { memo } from "react";

import { spacing } from "../../theme";
import { Screen } from "../Screen/ScreenComp/Screen";
import { IScreenProps } from "../Screen/ScreenComp/Screen.props";

export const NewAccountScreenComp = memo(function (props: IScreenProps) {
  const { contentContainerStyle, ...restProps } = props;

  return (
    <Screen
      preset="scroll"
      contentContainerStyle={[
        { paddingHorizontal: spacing.md, paddingTop: spacing.lg },
        contentContainerStyle,
      ]}
      {...restProps}
    />
  );
});
