import { memo } from "react";

import { Optional } from "../../../types/general";
import {
  IScreenHeaderIconButtonProps,
  ScreenHeaderIconButton,
} from "../ScreenHeaderIconButton/ScreenHeaderIconButton";

export type IScreenHeaderModalCloseButtonProps = Optional<
  IScreenHeaderIconButtonProps,
  "iconName"
>;

export const ScreenHeaderModalCloseButton = memo(
  function ScreenHeaderModalCloseButton(
    props: Optional<IScreenHeaderModalCloseButtonProps, "iconName">
  ) {
    const { ...rest } = props;
    return <ScreenHeaderIconButton iconName="chevron.left" {...rest} />;
  }
);
