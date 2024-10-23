import { memo } from "react";

import { IconButton } from "../../../design-system/IconButton/IconButton";
import { IIconButtonProps } from "../../../design-system/IconButton/IconButton.props";

export type IScreenHeaderIconButtonProps = IIconButtonProps;

export const ScreenHeaderIconButton = memo(function ScreenHeaderIconButton(
  props: IScreenHeaderIconButtonProps
) {
  return <IconButton {...props} />;
});
