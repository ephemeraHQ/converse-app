import { memo } from "react";
import { Platform } from "react-native";

import { Optional } from "../../../types/general";
import { ScreenHeaderButton } from "../ScreenHeaderButton/ScreenHeaderButton";
import { IScreenHeaderButtonProps } from "../ScreenHeaderButton/ScreenHeaderButton.props";

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
        title={
          title ??
          Platform.select({
            android: "Back",
            default: "Close",
          })
        }
        {...rest}
      />
    );
  }
);
