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
    props: Optional<IScreenHeaderModalCloseButtonProps, "variant" | "title">
  ) {
    const { title, variant, ...rest } = props;
    return <ScreenHeaderIconButton picto="chevron.left" {...rest} />;
  }
);
