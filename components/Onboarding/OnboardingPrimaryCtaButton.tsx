import { memo } from "react";

import { Optional } from "../../types/general";
import Button from "../Button/Button";
import { IButtonProps } from "../Button/Button.props";

export const OnboardingPrimaryCtaButton = memo(
  function OnboardingPrimaryCtaButton(
    props: Optional<IButtonProps, "variant">
  ) {
    const { style, variant, ...rest } = props;
    return (
      <Button
        style={[
          {
            marginHorizontal: 0, // TODO: Remove when we fixed the button component
          },
          style,
        ]}
        variant={variant || "primary"}
        {...rest}
      />
    );
  }
);
