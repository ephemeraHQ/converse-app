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
    props: Optional<IScreenHeaderModalCloseButtonProps, "variant" | "title">
  ) {
    const { title, variant, ...rest } = props;
    return (
      <ScreenHeaderButton
        variant={variant ?? "text"}
        title={title ?? "Close"}
        {...rest}
      />
    );
  }
);
