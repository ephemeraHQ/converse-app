import { memo } from "react";
import { Platform } from "react-native";

import { ScreenHeaderButton } from "./ScreenHeaderButton/ScreenHeaderButton";
import { IScreenHeaderButtonProps } from "./ScreenHeaderButton/ScreenHeaderButton.props";
import { Optional } from "../../types/general";
import { translate } from "@/i18n";

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
            android: translate("back"),
            default: translate("close"),
          })
        }
        {...rest}
      />
    );
  }
);
