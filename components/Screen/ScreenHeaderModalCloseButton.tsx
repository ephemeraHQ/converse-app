import { memo } from "react";

import { ScreenHeaderButton } from "./ScreenHeaderButton/ScreenHeaderButton";
import { IScreenHeaderButtonProps } from "./ScreenHeaderButton/ScreenHeaderButton.props";
import { Optional } from "../../types/general";

export type IScreenHeaderModalCloseButtonProps = Optional<
  IScreenHeaderButtonProps,
  "title"
>;

export const ScreenHeaderModalCloseButton = memo(
  function ScreenHeaderModalCloseButton(
    props: IScreenHeaderModalCloseButtonProps
  ) {
    const { title, ...rest } = props;
    return <ScreenHeaderButton title={title ?? "Close"} {...rest} />;
  }
);
