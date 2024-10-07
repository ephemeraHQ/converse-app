import { memo } from "react";

import { IScreenHeaderButtonProps } from "./ScreenHeaderButton.props";
import { Optional } from "../../../types/general";
import Button from "../../Button/Button";

export const ScreenHeaderButton = memo(function ScreenHeaderButton(
  props: Optional<IScreenHeaderButtonProps, "variant">
) {
  const { variant, ...restProps } = props;
  return <Button variant={variant || "text"} {...restProps} />;
});
