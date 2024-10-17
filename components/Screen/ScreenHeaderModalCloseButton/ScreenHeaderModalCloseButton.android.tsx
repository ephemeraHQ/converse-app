import { memo } from "react";

import { Optional } from "../../../types/general";
import {
  IScreenHeaderIconButtonProps,
  ScreenHeaderIconButton,
} from "../ScreenHeaderIconButton/ScreenHeaderIconButton";

export type IScreenHeaderModalCloseButtonProps = Optional<
  IScreenHeaderIconButtonProps,
  "picto"
>;

export const ScreenHeaderModalCloseButton = memo(
  function ScreenHeaderModalCloseButton(
    props: IScreenHeaderModalCloseButtonProps
  ) {
    const { picto = "chevron.left", ...rest } = props;
    return <ScreenHeaderIconButton picto={picto} {...rest} />;
  }
);
